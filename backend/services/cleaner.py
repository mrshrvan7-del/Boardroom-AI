# backend/services/cleaner.py
import pandas as pd
import numpy as np
import re
from dateutil import parser
from typing import Tuple, Dict, Any, List

def remove_duplicates(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    initial_rows = len(df)
    df_cleaned = df.drop_duplicates()
    removed_count = initial_rows - len(df_cleaned)
    return df_cleaned, removed_count

def fix_missing_values(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, float]]:
    missing_pct = df.isnull().mean().to_dict()
    
    for col in df.columns:
        if df[col].isnull().any():
            if pd.api.types.is_numeric_dtype(df[col]):
                median = df[col].median()
                if pd.isnull(median):
                    df[col] = df[col].fillna(0)
                else:
                    df[col] = df[col].fillna(median)
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                df[col] = df[col].ffill().bfill()
                if df[col].isnull().any():
                    df[col] = df[col].fillna(pd.Timestamp("1970-01-01"))
            else:
                if not df[col].mode().empty:
                    mode_val = df[col].mode()[0]
                    df[col] = df[col].fillna(mode_val)
                else:
                    df[col] = df[col].fillna("Unknown")
                    
    return df, missing_pct

def is_string_column(series: pd.Series) -> bool:
    # Robust check for any string/object column across all pandas versions
    dtype_name = series.dtype.name.lower()
    return "object" in dtype_name or "string" in dtype_name or "str" in dtype_name

def normalize_dates(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    dates_fixed = 0
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            continue
            
        if is_string_column(df[col]):
            sample = df[col].dropna().head(10).astype(str)
            if sample.empty:
                continue
                
            date_patterns = [
                r"\d{4}-\d{2}-\d{2}",
                r"\d{2}/\d{2}/\d{4}",
                r"\d{2}-\d{2}-\d{4}",
                r"\d{4}/\d{2}/\d{2}",
                r"^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}"
            ]
            
            matches = 0
            for val in sample:
                for pat in date_patterns:
                    if re.search(pat, val):
                        matches += 1
                        break
                        
            if matches >= min(5, len(sample)) * 0.7:
                try:
                    converted = pd.to_datetime(df[col].astype(str).apply(lambda x: parse_date_safe(x)), errors="coerce")
                    if converted.notnull().mean() > 0.5:
                        df[col] = converted
                        dates_fixed += 1
                except Exception:
                    pass
    return df, dates_fixed

def parse_date_safe(val: str):
    if not val or pd.isnull(val) or val.strip().lower() in ["nan", "none", "null", "nat", ""]:
        return pd.NaT
    try:
        return parser.parse(str(val))
    except Exception:
        return pd.NaT

def fix_percentages(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    fixed_count = 0
    percent_regex = re.compile(r"^\s*-?\d+(?:\.\d+)?\s*%\s*$")
    
    for col in df.columns:
        if is_string_column(df[col]):
            sample = df[col].dropna().head(10).astype(str)
            if sample.empty:
                continue
                
            matches = sum(1 for val in sample if percent_regex.match(val))
            if matches >= min(5, len(sample)) * 0.8:
                try:
                    def clean_pct(val):
                        if pd.isnull(val):
                            return np.nan
                        s = str(val).replace("%", "").strip()
                        try:
                            return float(s) / 100.0
                        except ValueError:
                            return np.nan
                            
                    cleaned_series = df[col].apply(clean_pct)
                    df[col] = pd.to_numeric(cleaned_series, errors="coerce")
                    fixed_count += 1
                except Exception:
                    pass
    return df, fixed_count

def fix_currency(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    fixed_count = 0
    for col in df.columns:
        if is_string_column(df[col]):
            sample = df[col].dropna().head(10).astype(str)
            if sample.empty:
                continue
                
            matches = 0
            for val in sample:
                clean_val = val.strip()
                if any(sym in clean_val for sym in ["$", "€", "£", "¥", "₹", "Rs"]) or re.match(r"^\s*-?\d{1,3}(,\d{3})+(\.\d+)?\s*$", clean_val):
                    matches += 1
            
            if matches >= min(5, len(sample)) * 0.8:
                try:
                    def clean_curr(val):
                        if pd.isnull(val):
                            return np.nan
                        s = str(val).replace(",", "").replace("$", "").replace("€", "").replace("£", "").replace("₹", "").replace("¥", "")
                        s = re.sub(r"Rs\.?\s*", "", s, flags=re.IGNORECASE)
                        s = s.strip()
                        try:
                            return float(s)
                        except ValueError:
                            return np.nan
                            
                    cleaned_series = df[col].apply(clean_curr)
                    df[col] = pd.to_numeric(cleaned_series, errors="coerce")
                    fixed_count += 1
                except Exception:
                    pass
    return df, fixed_count

def normalize_text(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    text_fixed = 0
    for col in df.columns:
        if is_string_column(df[col]):
            try:
                df[col] = df[col].astype(str).str.strip()
                sample = df[col].dropna().head(20)
                if not sample.empty:
                    unique_vals = sample.unique()
                    lowercase_vals = [s.lower() for s in unique_vals]
                    if len(unique_vals) > len(set(lowercase_vals)):
                        df[col] = df[col].str.title()
                        text_fixed += 1
            except Exception:
                pass
    return df, text_fixed

def detect_outliers(df: pd.DataFrame) -> Tuple[Dict[str, int], pd.DataFrame]:
    outlier_counts = {}
    outliers_mask = pd.Series(False, index=df.index)
    
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            if iqr > 0:
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                col_outliers = (df[col] < lower_bound) | (df[col] > upper_bound)
                outlier_count = col_outliers.sum()
                if outlier_count > 0:
                    outlier_counts[col] = int(outlier_count)
                    outliers_mask = outliers_mask | col_outliers
                    
    return outlier_counts, outliers_mask

def clean_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    df_clean, dup_removed = remove_duplicates(df.copy())
    df_clean, pct_fixed = fix_percentages(df_clean)
    df_clean, curr_fixed = fix_currency(df_clean)
    df_clean, dates_fixed = normalize_dates(df_clean)
    df_clean, text_fixed = normalize_text(df_clean)
    df_clean, missing_pct_before = fix_missing_values(df_clean)
    
    outlier_counts, outliers_mask = detect_outliers(df_clean)
    outliers_found = sum(outlier_counts.values())
    
    dup_penalty = min(10, dup_removed * 2)
    missing_pct_sum = sum(missing_pct_before.values()) * 100
    missing_penalty = min(30, missing_pct_sum / max(1, len(df.columns)))
    outlier_penalty = min(20, outliers_found * 0.5)
    
    quality_score = max(0, int(100 - (dup_penalty + missing_penalty + outlier_penalty)))
    
    report = {
        "duplicates_removed": dup_removed,
        "missing_fixed": int(sum(pd.Series(missing_pct_before).values > 0)),
        "dates_fixed": dates_fixed,
        "percentages_fixed": pct_fixed,
        "currencies_fixed": curr_fixed,
        "outliers_found": outliers_found,
        "outliers_by_column": outlier_counts,
        "data_quality_score": quality_score
    }
    
    return df_clean, report
