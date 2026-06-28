# backend/services/profiler.py
import pandas as pd
import numpy as np
import re
from typing import Dict, Any, List

def detect_column_types(df: pd.DataFrame) -> Dict[str, str]:
    column_types = {}
    
    for col in df.columns:
        col_lower = col.lower()
        
        # Datetime column
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            column_types[col] = "Date"
            continue
            
        # Check by column name and values
        non_null = df[col].dropna()
        if non_null.empty:
            column_types[col] = "Category"
            continue
            
        # Numeric column
        if pd.api.types.is_numeric_dtype(df[col]):
            # First check explicit numeric/currency patterns in name
            if "percentage" in col_lower or "pct" in col_lower or "%" in col_lower:
                column_types[col] = "Percentage"
            elif any(curr in col_lower for curr in ["salary", "revenue", "price", "cost", "amount", "budget", "spend", "sales"]):
                column_types[col] = "Currency"
            else:
                # Then check if values act as ID
                is_id_like = False
                if pd.api.types.is_integer_dtype(df[col]):
                    if non_null.nunique() == len(non_null) or "id" in col_lower or "code" in col_lower:
                        is_id_like = True
                
                if is_id_like:
                    column_types[col] = "ID"
                else:
                    column_types[col] = "Numeric"
            continue
            
        # Object/String column
        sample_str = non_null.astype(str)
        
        # Check for ID patterns
        if "id" in col_lower or "code" in col_lower or "key" in col_lower:
            if non_null.nunique() > 0.8 * len(non_null): # High cardinality
                column_types[col] = "ID"
                continue
                
        # Email pattern
        if any("@" in val for val in sample_str.head(10)):
            if all(re.match(r"[^@]+@[^@]+\.[^@]+", val) for val in sample_str.head(5)):
                column_types[col] = "Email"
                continue
                
        # Phone pattern
        phone_matches = sum(1 for val in sample_str.head(10) if re.search(r"\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}", val))
        if phone_matches >= len(sample_str.head(10)) * 0.7:
            column_types[col] = "Phone"
            continue
            
        # Status/Flag patterns
        status_words = ["status", "state", "stage", "active", "completed", "enabled", "flag"]
        unique_vals = non_null.unique()
        if len(unique_vals) <= 3 and all(str(val).lower() in ["true", "false", "0", "1", "yes", "no", "y", "n"] for val in unique_vals):
            column_types[col] = "Flag"
            continue
            
        if any(w in col_lower for w in status_words) or len(unique_vals) <= 5:
            column_types[col] = "Status"
            continue
            
        # Date column that didn't get parsed
        date_words = ["date", "time", "year", "month", "day", "created", "updated", "hired"]
        if any(w in col_lower for w in date_words):
            column_types[col] = "Date"
            continue
            
        # Category vs Name (cardinality check)
        cardinality_pct = non_null.nunique() / len(non_null)
        if "name" in col_lower or "title" in col_lower or "description" in col_lower or cardinality_pct > 0.5:
            column_types[col] = "Name"
        else:
            column_types[col] = "Category"
            
    return column_types

def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    column_types = detect_column_types(df)
    
    total_rows, total_columns = df.shape
    memory_usage = int(df.memory_usage(deep=True).sum())
    
    # Categorize columns into groups
    numeric_cols = []
    categorical_cols = []
    datetime_cols = []
    id_cols = []
    high_missing_cols = []
    
    column_profiles = []
    
    for col in df.columns:
        dtype = str(df[col].dtype)
        sem_type = column_types.get(col, "Category")
        
        # Missing value info
        null_count = int(df[col].isnull().sum())
        null_pct = float(null_count / total_rows) if total_rows > 0 else 0.0
        
        if null_pct > 0.3:
            high_missing_cols.append(col)
            
        # Group lists
        if sem_type in ["Numeric", "Percentage", "Currency"]:
            numeric_cols.append(col)
        elif sem_type == "Date":
            datetime_cols.append(col)
        elif sem_type == "ID":
            id_cols.append(col)
        else:
            categorical_cols.append(col)
            
        # Column stats
        unique_count = int(df[col].nunique())
        non_null_df = df[col].dropna()
        sample_values = list(non_null_df.head(5).unique())
        # Convert values to JSON-serializable types
        sample_values = [int(v) if isinstance(v, (np.integer, int)) else 
                         float(v) if isinstance(v, (np.floating, float)) else 
                         str(v) for v in sample_values]
        
        col_profile = {
            "name": col,
            "dtype": dtype,
            "semantic_type": sem_type,
            "unique_count": unique_count,
            "null_pct": null_pct,
            "null_count": null_count,
            "sample_values": sample_values
        }
        
        # Add details for numeric columns
        if pd.api.types.is_numeric_dtype(df[col]) and not non_null_df.empty:
            col_profile.update({
                "min": float(non_null_df.min()),
                "max": float(non_null_df.max()),
                "mean": float(non_null_df.mean()),
                "median": float(non_null_df.median()),
                "std": float(non_null_df.std()) if len(non_null_df) > 1 else 0.0
            })
            
        # Add details for date columns
        elif (pd.api.types.is_datetime64_any_dtype(df[col]) or sem_type == "Date") and not non_null_df.empty:
            try:
                date_series = pd.to_datetime(non_null_df)
                col_profile.update({
                    "min": date_series.min().isoformat(),
                    "max": date_series.max().isoformat()
                })
            except Exception:
                pass
                
        column_profiles.append(col_profile)
        
    # Check for duplicate rows
    duplicate_rows = int(df.duplicated().sum())
    
    return {
        "total_rows": total_rows,
        "total_columns": total_columns,
        "memory_usage": memory_usage,
        "duplicate_rows": duplicate_rows,
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "datetime_columns": datetime_cols,
        "id_columns": id_cols,
        "high_missing_columns": high_missing_cols,
        "column_profiles": column_profiles
    }
