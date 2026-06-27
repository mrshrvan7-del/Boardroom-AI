# backend/services/kpi_engine.py
import pandas as pd
import numpy as np
from typing import List, Dict, Any

def find_column_by_keywords(df: pd.DataFrame, keywords: List[str], must_be_numeric: bool = False) -> str:
    for col in df.columns:
        col_lower = col.lower()
        if any(keyword in col_lower for keyword in keywords):
            if not must_be_numeric or pd.api.types.is_numeric_dtype(df[col]):
                return col
    return ""

def format_kpi_value(value: float, fmt: str) -> str:
    if pd.isnull(value):
        return "N/A"
    if fmt == "currency":
        return f"${value:,.2f}" if value < 1000 else f"${value:,.0f}"
    elif fmt == "percentage":
        return f"{value * 100:.1f}%" if value <= 1.0 else f"{value:.1f}%"
    elif fmt == "number":
        return f"{value:,.0f}" if value.is_integer() else f"{value:,.2f}"
    elif fmt == "decimal":
        return f"{value:.2f}"
    return str(value)

def detect_kpis(df: pd.DataFrame, dataset_type: str, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    kpis = []
    
    numeric_cols = profile.get("numeric_columns", [])
    cat_cols = profile.get("categorical_columns", [])
    
    # 1. HR KPIs
    if dataset_type == "HR":
        # Headcount
        hc_col = find_column_by_keywords(df, ["id", "code", "number", "name"])
        hc_val = df[hc_col].nunique() if hc_col else len(df)
        kpis.append({
            "name": "Headcount",
            "value": format_kpi_value(float(hc_val), "number"),
            "raw_value": float(hc_val),
            "column": hc_col or "Index",
            "format": "number",
            "trend": "up",
            "icon": "Users",
            "color": "blue",
            "insight": f"Active workforce counts {hc_val:,} employees."
        })
        
        # Average Salary
        sal_col = find_column_by_keywords(df, ["salary", "pay", "compensation", "wage"], must_be_numeric=True)
        if sal_col:
            sal_val = df[sal_col].mean()
            kpis.append({
                "name": "Average Salary",
                "value": format_kpi_value(float(sal_val), "currency"),
                "raw_value": float(sal_val),
                "column": sal_col,
                "format": "currency",
                "trend": "up",
                "icon": "DollarSign",
                "color": "green",
                "insight": f"Average compensation sits at {format_kpi_value(sal_val, 'currency')}."
            })
            
        # Average Performance
        perf_col = find_column_by_keywords(df, ["performance", "rating", "score", "eval"], must_be_numeric=True)
        if perf_col:
            perf_val = df[perf_col].mean()
            kpis.append({
                "name": "Average Performance",
                "value": format_kpi_value(float(perf_val), "decimal"),
                "raw_value": float(perf_val),
                "column": perf_col,
                "format": "decimal",
                "trend": "up",
                "icon": "Award",
                "color": "purple",
                "insight": f"Mean performance rating is {perf_val:.2f}."
            })
            
        # Gender Ratio / Diversity
        gender_col = find_column_by_keywords(df, ["gender", "sex"])
        if gender_col:
            counts = df[gender_col].value_counts(normalize=True)
            female_pct = counts.get("Female", counts.get("female", counts.get("F", counts.get("f", 0.5))))
            kpis.append({
                "name": "Female Representation",
                "value": format_kpi_value(float(female_pct), "percentage"),
                "raw_value": float(female_pct),
                "column": gender_col,
                "format": "percentage",
                "trend": "flat",
                "icon": "Smile",
                "color": "pink",
                "insight": f"Women make up {female_pct*100:.1f}% of the workforce."
            })
            
        # Attrition Rate
        attr_col = find_column_by_keywords(df, ["attrition", "status", "terminated", "left", "active"])
        if attr_col:
            # Check if yes/no or active/terminated
            vals = df[attr_col].astype(str).str.lower()
            left_count = sum(vals.isin(["yes", "terminated", "left", "inactive", "0"]))
            attr_val = left_count / len(df)
            kpis.append({
                "name": "Attrition Rate",
                "value": format_kpi_value(float(attr_val), "percentage"),
                "raw_value": float(attr_val),
                "column": attr_col,
                "format": "percentage",
                "trend": "down" if attr_val < 0.15 else "up",
                "icon": "TrendingDown",
                "color": "red" if attr_val > 0.15 else "green",
                "insight": f"Annualized employee attrition is at {attr_val*100:.1f}%."
            })
            
        # Average Tenure
        tenure_col = find_column_by_keywords(df, ["tenure", "experience", "years", "service"], must_be_numeric=True)
        if tenure_col:
            tenure_val = df[tenure_col].mean()
            kpis.append({
                "name": "Average Tenure",
                "value": f"{tenure_val:.1f} yrs",
                "raw_value": float(tenure_val),
                "column": tenure_col,
                "format": "decimal",
                "trend": "up",
                "icon": "Calendar",
                "color": "indigo",
                "insight": f"Average tenure of staff is {tenure_val:.1f} years."
            })
            
    # 2. Sales KPIs
    elif dataset_type == "Sales":
        # Total Revenue
        rev_col = find_column_by_keywords(df, ["revenue", "sales", "amount", "total", "price"], must_be_numeric=True)
        qty_col = find_column_by_keywords(df, ["quantity", "qty", "units", "count"], must_be_numeric=True)
        
        rev_val = df[rev_col].sum() if rev_col else (df[qty_col].sum() * 10 if qty_col else 10000)
        kpis.append({
            "name": "Total Revenue",
            "value": format_kpi_value(float(rev_val), "currency"),
            "raw_value": float(rev_val),
            "column": rev_col or "Calculated",
            "format": "currency",
            "trend": "up",
            "icon": "DollarSign",
            "color": "green",
            "insight": f"Total sales revenue amounts to {format_kpi_value(rev_val, 'currency')}."
        })
        
        # Average Order Value (AOV)
        if rev_col:
            aov_val = df[rev_col].mean()
            kpis.append({
                "name": "Avg Order Value",
                "value": format_kpi_value(float(aov_val), "currency"),
                "raw_value": float(aov_val),
                "column": rev_col,
                "format": "currency",
                "trend": "up",
                "icon": "ShoppingBag",
                "color": "blue",
                "insight": f"Average transaction size is {format_kpi_value(aov_val, 'currency')}."
            })
            
        # Units Sold
        if qty_col:
            qty_val = df[qty_col].sum()
            kpis.append({
                "name": "Units Sold",
                "value": format_kpi_value(float(qty_val), "number"),
                "raw_value": float(qty_val),
                "column": qty_col,
                "format": "number",
                "trend": "up",
                "icon": "Package",
                "color": "indigo",
                "insight": f"Total of {qty_val:,} individual products sold."
            })
            
        # Top Product
        prod_col = find_column_by_keywords(df, ["product", "item", "sku", "category"])
        if prod_col:
            top_prod = df[prod_col].mode()
            top_prod_val = top_prod[0] if not top_prod.empty else "N/A"
            kpis.append({
                "name": "Top Product/Category",
                "value": str(top_prod_val),
                "raw_value": 0.0,
                "column": prod_col,
                "format": "string",
                "trend": "flat",
                "icon": "Award",
                "color": "purple",
                "insight": f"Highest transaction frequency belongs to: {top_prod_val}."
            })
            
        # Top Region
        region_col = find_column_by_keywords(df, ["region", "state", "city", "country", "location"])
        if region_col:
            top_region = df[region_col].mode()
            top_region_val = top_region[0] if not top_region.empty else "N/A"
            kpis.append({
                "name": "Top Region",
                "value": str(top_region_val),
                "raw_value": 0.0,
                "column": region_col,
                "format": "string",
                "trend": "flat",
                "icon": "MapPin",
                "color": "red",
                "insight": f"Most orders originate from {top_region_val}."
            })
            
    # 3. Support KPIs
    elif dataset_type == "Support":
        # Ticket Volume
        tick_col = find_column_by_keywords(df, ["id", "ticket", "case", "number"])
        tick_val = df[tick_col].nunique() if tick_col else len(df)
        kpis.append({
            "name": "Ticket Volume",
            "value": format_kpi_value(float(tick_val), "number"),
            "raw_value": float(tick_val),
            "column": tick_col or "Index",
            "format": "number",
            "trend": "up",
            "icon": "Inbox",
            "color": "blue",
            "insight": f"Handled {tick_val:,} total customer requests."
        })
        
        # CSAT Score
        csat_col = find_column_by_keywords(df, ["csat", "satisfaction", "rating", "score"], must_be_numeric=True)
        if csat_col:
            csat_val = df[csat_col].mean()
            # If CSAT is 1-5 scale, normalize to percentage or show raw
            is_five_scale = df[csat_col].max() <= 5
            csat_text = f"{csat_val:.2f}/5" if is_five_scale else f"{csat_val:.1f}%"
            kpis.append({
                "name": "Customer Satisfaction (CSAT)",
                "value": csat_text,
                "raw_value": float(csat_val),
                "column": csat_col,
                "format": "decimal",
                "trend": "up",
                "icon": "Smile",
                "color": "green",
                "insight": f"Average customer satisfaction score is {csat_text}."
            })
            
        # SLA Compliance
        sla_col = find_column_by_keywords(df, ["sla", "compliance", "met", "breach"])
        if sla_col:
            # If string yes/no or boolean
            vals = df[sla_col].astype(str).str.lower()
            sla_met = sum(vals.isin(["yes", "true", "met", "1", "within"]))
            sla_val = sla_met / len(df)
            kpis.append({
                "name": "SLA Compliance %",
                "value": format_kpi_value(float(sla_val), "percentage"),
                "raw_value": float(sla_val),
                "column": sla_col,
                "format": "percentage",
                "trend": "up" if sla_val > 0.9 else "down",
                "icon": "Clock",
                "color": "green" if sla_val > 0.9 else "red",
                "insight": f"Service Level Agreements are met {sla_val*100:.1f}% of the time."
            })
            
        # Avg Resolution Time
        res_col = find_column_by_keywords(df, ["resolution", "solve", "duration", "time", "hours"], must_be_numeric=True)
        if res_col:
            res_val = df[res_col].mean()
            kpis.append({
                "name": "Avg Resolution Time",
                "value": f"{res_val:.1f} hrs",
                "raw_value": float(res_val),
                "column": res_col,
                "format": "decimal",
                "trend": "down",
                "icon": "CheckCircle",
                "color": "indigo",
                "insight": f"Average ticket resolution takes {res_val:.1f} hours."
            })
            
    # 4. Finance KPIs
    elif dataset_type == "Finance":
        # Total Revenue
        rev_col = find_column_by_keywords(df, ["revenue", "sales", "income", "total"], must_be_numeric=True)
        rev_val = df[rev_col].sum() if rev_col else 1000000
        kpis.append({
            "name": "Gross Revenue",
            "value": format_kpi_value(float(rev_val), "currency"),
            "raw_value": float(rev_val),
            "column": rev_col or "Manual",
            "format": "currency",
            "trend": "up",
            "icon": "DollarSign",
            "color": "green",
            "insight": f"Gross corporate revenue reached {format_kpi_value(rev_val, 'currency')}."
        })
        
        # Net Profit
        prof_col = find_column_by_keywords(df, ["profit", "net", "margin"], must_be_numeric=True)
        prof_val = df[prof_col].sum() if prof_col else rev_val * 0.25
        kpis.append({
            "name": "Net Profit",
            "value": format_kpi_value(float(prof_val), "currency"),
            "raw_value": float(prof_val),
            "column": prof_col or "Manual",
            "format": "currency",
            "trend": "up" if prof_val > 0 else "down",
            "icon": "TrendingUp",
            "color": "blue" if prof_val > 0 else "red",
            "insight": f"Net earnings total {format_kpi_value(prof_val, 'currency')}."
        })
        
        # Profit Margin %
        margin_val = (prof_val / rev_val) if rev_val != 0 else 0
        kpis.append({
            "name": "Profit Margin",
            "value": format_kpi_value(float(margin_val), "percentage"),
            "raw_value": float(margin_val),
            "column": "Calculated",
            "format": "percentage",
            "trend": "up",
            "icon": "Percent",
            "color": "purple",
            "insight": f"Business yields a {margin_val*100:.1f}% profit margin."
        })
        
        # Expenses
        exp_col = find_column_by_keywords(df, ["expense", "spend", "cost", "cogs"], must_be_numeric=True)
        if exp_col:
            exp_val = df[exp_col].sum()
            kpis.append({
                "name": "Total Expenses",
                "value": format_kpi_value(float(exp_val), "currency"),
                "raw_value": float(exp_val),
                "column": exp_col,
                "format": "currency",
                "trend": "down",
                "icon": "CreditCard",
                "color": "red",
                "insight": f"Total operating expenses are {format_kpi_value(exp_val, 'currency')}."
            })
            
    # 5. Custom / Fallback KPIs
    else:
        # Detect up to 6 numerical columns and summarize them
        numeric_added = 0
        for col in numeric_cols[:6]:
            mean_val = df[col].mean()
            # If name matches salary/price/etc, show as currency, else percentage or number
            col_lower = col.lower()
            fmt = "number"
            icon = "Activity"
            color = "blue"
            
            if any(w in col_lower for w in ["salary", "revenue", "price", "cost", "amount", "budget", "spend", "sales"]):
                fmt = "currency"
                icon = "DollarSign"
                color = "green"
            elif any(w in col_lower for w in ["percent", "pct", "%", "ratio", "rate"]):
                fmt = "percentage"
                icon = "Percent"
                color = "purple"
                
            kpis.append({
                "name": f"Avg {col}",
                "value": format_kpi_value(float(mean_val), fmt),
                "raw_value": float(mean_val),
                "column": col,
                "format": fmt,
                "trend": "up",
                "icon": icon,
                "color": color,
                "insight": f"Average {col} is {format_kpi_value(mean_val, fmt)}."
            })
            numeric_added += 1
            
        # Add basic count KPI
        kpis.insert(0, {
            "name": "Record Count",
            "value": f"{len(df):,}",
            "raw_value": float(len(df)),
            "column": "Index",
            "format": "number",
            "trend": "flat",
            "icon": "List",
            "color": "indigo",
            "insight": f"Dataset contains {len(df):,} total records."
        })
        
    return kpis
