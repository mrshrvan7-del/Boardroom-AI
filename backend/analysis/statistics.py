# backend/analysis/statistics.py
import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, Any, List, Tuple

def detect_distribution(series: pd.Series) -> str:
    series_clean = series.dropna()
    if len(series_clean) < 8:
        return "Uniform" # Too small to test
        
    try:
        # Check skewness
        skew = stats.skew(series_clean)
        
        # Test for normality (Shapiro-Wilk or Normaltest)
        # scipy normaltest
        stat, p_val = stats.normaltest(series_clean) if len(series_clean) >= 8 else (0, 0.05)
        
        if p_val > 0.05:
            return "Normal"
            
        if skew > 1:
            return "Skewed Right"
        elif skew < -1:
            return "Skewed Left"
            
        # Check for bimodality (using Sarle's bimodality coefficient)
        # BC = (skew^2 + 1) / (kurtosis + 3 * (n-1)^2 / ((n-2)*(n-3)))
        kurt = stats.kurtosis(series_clean, fisher=True)
        n = len(series_clean)
        if n > 3:
            bc = (skew**2 + 1) / (kurt + 3 + (3 * (n - 1)**2) / ((n - 2) * (n - 3)))
        else:
            bc = (skew**2 + 1) / (kurt + 3)
            
        if bc > 0.555:
            return "Bimodal"
            
        return "Uniform"
    except Exception:
        # Fallback based on simple rules
        skew = series_clean.skew()
        if pd.isnull(skew):
            return "Uniform"
        if skew > 0.5:
            return "Skewed Right"
        elif skew < -0.5:
            return "Skewed Left"
        return "Normal"

def compute_percentiles(series: pd.Series) -> Dict[str, float]:
    series_clean = series.dropna()
    if series_clean.empty:
        return {p: 0.0 for p in ["10th", "25th", "50th", "75th", "90th", "95th"]}
        
    percentiles = [10, 25, 50, 75, 90, 95]
    vals = np.percentile(series_clean, percentiles)
    
    return {f"{p}th": float(v) for p, v in zip(percentiles, vals)}

def compute_descriptive_stats(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    stats_dict = {}
    
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            series_clean = df[col].dropna()
            if series_clean.empty:
                continue
                
            mean_val = float(series_clean.mean())
            median_val = float(series_clean.median())
            
            # Mode handling
            mode_series = series_clean.mode()
            mode_val = float(mode_series[0]) if not mode_series.empty else mean_val
            
            std_val = float(series_clean.std()) if len(series_clean) > 1 else 0.0
            var_val = float(series_clean.var()) if len(series_clean) > 1 else 0.0
            
            skew_val = float(series_clean.skew()) if len(series_clean) > 2 else 0.0
            kurt_val = float(series_clean.kurtosis()) if len(series_clean) > 3 else 0.0
            
            stats_dict[col] = {
                "mean": mean_val,
                "median": median_val,
                "mode": mode_val,
                "std": std_val,
                "variance": var_val,
                "skewness": skew_val,
                "kurtosis": kurt_val,
                "min": float(series_clean.min()),
                "max": float(series_clean.max()),
                "sum": float(series_clean.sum()),
                "distribution": detect_distribution(df[col]),
                "percentiles": compute_percentiles(df[col])
            }
            
    return stats_dict

def compute_correlations(df: pd.DataFrame) -> List[Dict[str, Any]]:
    # Get all numeric columns
    numeric_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
    
    if len(numeric_cols) < 2:
        return []
        
    try:
        # Compute Pearson correlation matrix
        corr_matrix = df[numeric_cols].corr(method="pearson")
        
        correlations = []
        
        # Loop through upper triangle to avoid duplicate pairs
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                col1 = numeric_cols[i]
                col2 = numeric_cols[j]
                val = corr_matrix.iloc[i, j]
                
                if not pd.isnull(val):
                    correlations.append({
                        "col1": col1,
                        "col2": col2,
                        "coefficient": float(val),
                        "strength": "strong" if abs(val) >= 0.7 else "moderate" if abs(val) >= 0.4 else "weak",
                        "direction": "positive" if val > 0 else "negative"
                    })
                    
        # Sort by absolute correlation coefficient descending
        correlations.sort(key=lambda x: abs(x["coefficient"]), reverse=True)
        
        # Return top 5 strongest correlations
        return correlations[:5]
    except Exception:
        return []
