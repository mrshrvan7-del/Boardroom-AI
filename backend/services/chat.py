# backend/services/chat.py
import pandas as pd
import numpy as np
import re
from typing import Dict, Any, List, Tuple

def parse_filter_request(message: str, df: pd.DataFrame, profile: Dict[str, Any]) -> Tuple[pd.DataFrame, str]:
    # Look for categorical column values in the message
    df_filtered = df.copy()
    filter_desc = []
    
    col_profiles = profile.get("column_profiles", [])
    
    for col_prof in col_profiles:
        col = col_prof["name"]
        
        # If it's a category/status/flag/gender/etc
        if col_prof["semantic_type"] in ["Category", "Status", "Flag", "Gender", "Name"]:
            # Check unique values
            # Sample unique values from df
            unique_vals = df[col].dropna().unique()
            for val in unique_vals:
                val_str = str(val)
                # If value is mentioned in message
                if re.search(r'\b' + re.escape(val_str.lower()) + r'\b', message.lower()):
                    df_filtered = df_filtered[df_filtered[col].astype(str).str.lower() == val_str.lower()]
                    filter_desc.append(f"{col} is '{val_str}'")
                    
    # Look for inequality filters on numeric columns (e.g. "salary > 50000", "age < 30")
    numeric_cols = profile.get("numeric_columns", [])
    for col in numeric_cols:
        col_clean = col.replace("_", " ").lower()
        if col_clean in message.lower():
            # Check for patterns like "greater than 50000", "> 50000", "over 50k", etc
            gt_match = re.search(r'(?:greater than|more than|>|above|over)\s*(\d+(?:\.\d+)?[kM]?)', message.lower())
            lt_match = re.search(r'(?:less than|under|<|below)\s*(\d+(?:\.\d+)?[kM]?)', message.lower())
            
            def parse_num_suffix(s: str) -> float:
                s = s.lower()
                if s.endswith('k'):
                    return float(s.replace('k', '')) * 1000
                elif s.endswith('m'):
                    return float(s.replace('m', '')) * 1000000
                return float(s)
                
            if gt_match:
                val = parse_num_suffix(gt_match.group(1))
                df_filtered = df_filtered[df_filtered[col] > val]
                filter_desc.append(f"{col} > {val:,.0f}")
            elif lt_match:
                val = parse_num_suffix(lt_match.group(1))
                df_filtered = df_filtered[df_filtered[col] < val]
                filter_desc.append(f"{col} < {val:,.0f}")
                
    if len(df_filtered) < len(df) and filter_desc:
        desc_str = "Filtered dataset where: " + " and ".join(filter_desc)
        return df_filtered, desc_str
        
    return df, ""

def handle_chat_query(message: str, conversation_history: List[Dict[str, str]], df: pd.DataFrame, profile: Dict[str, Any], dataset_type: str) -> Dict[str, Any]:
    msg_lower = message.lower()
    
    numeric_cols = profile.get("numeric_columns", [])
    cat_cols = profile.get("categorical_columns", [])
    date_cols = profile.get("datetime_columns", [])
    
    # 1. Check if it's a Filter request
    df_filtered, filter_description = parse_filter_request(message, df, profile)
    
    # 2. Check for Aggregation / Metric request
    # Detect operation
    op = None
    op_label = ""
    if any(w in msg_lower for w in ["average", "mean", "avg"]):
        op = "mean"
        op_label = "Average"
    elif any(w in msg_lower for w in ["total", "sum", "combined"]):
        op = "sum"
        op_label = "Total"
    elif any(w in msg_lower for w in ["maximum", "max", "highest", "top"]):
        op = "max"
        op_label = "Maximum"
    elif any(w in msg_lower for w in ["minimum", "min", "lowest", "bottom"]):
        op = "min"
        op_label = "Minimum"
    elif any(w in msg_lower for w in ["count", "number of", "how many"]):
        op = "count"
        op_label = "Count"
        
    # Find matching numeric column
    matched_num_col = ""
    for col in numeric_cols:
        col_clean = col.replace("_", " ").lower()
        # check if column name is mentioned in message
        if col_clean in msg_lower or any(part in msg_lower for part in col_clean.split()):
            matched_num_col = col
            break
            
    # Find matching category column for grouping
    matched_cat_col = ""
    for col in cat_cols:
        col_clean = col.replace("_", " ").lower()
        if col_clean in msg_lower or "by " + col_clean in msg_lower:
            matched_cat_col = col
            break
            
    # A. Execute Grouped Aggregation
    if op and matched_num_col and matched_cat_col:
        try:
            # Group by and aggregate
            if op == "mean":
                grouped_res = df_filtered.groupby(matched_cat_col)[matched_num_col].mean().dropna().sort_values(ascending=False)
            elif op == "sum":
                grouped_res = df_filtered.groupby(matched_cat_col)[matched_num_col].sum().dropna().sort_values(ascending=False)
            elif op == "max":
                grouped_res = df_filtered.groupby(matched_cat_col)[matched_num_col].max().dropna().sort_values(ascending=False)
            elif op == "min":
                grouped_res = df_filtered.groupby(matched_cat_col)[matched_num_col].min().dropna().sort_values(ascending=False)
            else: # count
                grouped_res = df_filtered.groupby(matched_cat_col)[matched_num_col].count().dropna().sort_values(ascending=False)
                
            # Create chart config
            chart_config = {
                "chart_type": "bar" if len(grouped_res) < 10 else "horizontal_bar",
                "title": f"{op_label} {matched_num_col} by {matched_cat_col}",
                "x_column": matched_cat_col,
                "y_column": matched_num_col,
                "data": [{"category": str(k), "value": float(v)} for k, v in grouped_res.items()]
            }
            
            # Format answers
            top_val = grouped_res.iloc[0]
            top_cat = grouped_res.index[0]
            ans_parts = [
                f"I computed the **{op_label.lower()}** of **{matched_num_col}** grouped by **{matched_cat_col}**."
            ]
            if filter_description:
                ans_parts.append(f"({filter_description})")
            ans_parts.append(
                f"The highest is **{top_cat}** with {top_val:,.2f}. Here is a summary of the top categories:"
            )
            
            for k, v in grouped_res.head(5).items():
                ans_parts.append(f"- **{k}**: {v:,.2f}")
                
            return {
                "intent": "compute_metric",
                "answer_text": "\n".join(ans_parts),
                "chart_config": chart_config,
                "follow_up_suggestions": [
                    f"Show me {matched_num_col} over time",
                    f"Compare {matched_cat_col} performance",
                    "Can you cluster this data?"
                ]
            }
        except Exception as e:
            pass
            
    # B. Execute Single Column Metric Aggregation
    if op and matched_num_col:
        try:
            val = 0.0
            if op == "mean":
                val = df_filtered[matched_num_col].mean()
            elif op == "sum":
                val = df_filtered[matched_num_col].sum()
            elif op == "max":
                val = df_filtered[matched_num_col].max()
            elif op == "min":
                val = df_filtered[matched_num_col].min()
            else:
                val = df_filtered[matched_num_col].count()
                
            ans_text = f"The **{op_label.lower()}** of **{matched_num_col}** is **{val:,.2f}**."
            if filter_description:
                ans_text = f"({filter_description}) " + ans_text
                
            return {
                "intent": "compute_metric",
                "answer_text": ans_text,
                "follow_up_suggestions": [
                    f"What is the average {matched_num_col} by {cat_cols[0]}?" if cat_cols else "Show me more details",
                    f"Show the distribution of {matched_num_col}"
                ]
            }
        except Exception:
            pass
            
    # C. Handle Trend Queries
    if any(w in msg_lower for w in ["trend", "over time", "history", "date", "monthly"]):
        if date_cols and numeric_cols:
            primary_date = date_cols[0]
            metric = matched_num_col or numeric_cols[0]
            try:
                # Group by date and calculate average
                ts_df = df_filtered.copy()
                ts_df[primary_date] = pd.to_datetime(ts_df[primary_date])
                ts_series = ts_df.groupby(primary_date)[metric].mean().sort_index()
                
                chart_config = {
                    "chart_type": "line",
                    "title": f"{metric} Trend Over Time",
                    "x_column": primary_date,
                    "y_column": metric,
                    "data": [{"category": k.strftime("%Y-%m-%d") if hasattr(k, "strftime") else str(k), "value": float(v)} for k, v in ts_series.items()]
                }
                
                ans_text = f"Here is the trend for **{metric}** over the date column **{primary_date}**. "
                if filter_description:
                    ans_text += f"\nActive filter: *{filter_description}*."
                    
                return {
                    "intent": "explain_trend",
                    "answer_text": ans_text,
                    "chart_config": chart_config,
                    "follow_up_suggestions": [
                        f"Forecast the next 3 periods for {metric}",
                        "Are there any anomalies in this trend?"
                    ]
                }
            except Exception:
                pass
                
    # D. Return Filtered Data Rows
    if filter_description and len(df_filtered) < len(df):
        # Format a small table for filtered rows
        rows_to_show = df_filtered.head(10).copy()
        # safe nulls
        rows_to_show = rows_to_show.where(pd.notnull(rows_to_show), None)
        preview_data = rows_to_show.to_dict(orient="records")
        
        cols = list(df_filtered.columns)[:6] # show first 6 columns
        table_md = [
            f"I found **{len(df_filtered):,}** matching rows where **{filter_description.replace('Filtered dataset where: ', '')}**.",
            "",
            "| " + " | ".join(cols) + " |",
            "| " + " | ".join(["---"] * len(cols)) + " |"
        ]
        
        for idx, row in rows_to_show.iterrows():
            row_vals = [str(row[c]) if row[c] is not None else "" for c in cols]
            table_md.append("| " + " | ".join(row_vals) + " |")
            
        return {
            "intent": "filter_data",
            "answer_text": "\n".join(table_md),
            "filtered_data": preview_data,
            "follow_up_suggestions": [
                "Clear filters and show all data",
                "What are the key statistics of this subset?"
            ]
        }
        
    # E. General Questions or Fallback
    columns_list = ", ".join([f"`{c}`" for c in df.columns[:10]])
    if len(df.columns) > 10:
        columns_list += f" (+{len(df.columns)-10} more)"
        
    fallback_text = (
        f"I received your question: \"{message}\".\n\n"
        f"I can help you filter, sum, average, or plot any metrics in this **{dataset_type}** dataset.\n"
        f"The dataset contains **{len(df):,}** rows and **{len(df.columns)}** columns. "
        f"Here are some of the fields: {columns_list}.\n\n"
        f"Try asking questions like:\n"
    )
    
    if dataset_type == "HR":
        fallback_text += (
            "- *What is the average salary by department?*\n"
            "- *Show me only female employees.*\n"
            "- *Show me the trend of performance over time.*"
        )
    elif dataset_type == "Sales":
        fallback_text += (
            "- *What is the total revenue by product?*\n"
            "- *Show me transactions over $1000.*\n"
            "- *Show me the trend of sales over time.*"
        )
    else:
        fallback_text += (
            "- *What is the average values grouped by category?*\n"
            "- *Show me a trend line chart of my numerical columns.*"
        )
        
    return {
        "intent": "general_question",
        "answer_text": fallback_text,
        "follow_up_suggestions": [
            "What is the overall data quality score?",
            "Show me top performer groups"
        ]
    }
