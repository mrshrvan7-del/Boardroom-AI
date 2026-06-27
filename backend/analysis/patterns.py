# backend/analysis/patterns.py
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, List, Tuple

def detect_time_series_patterns(df: pd.DataFrame, date_col: str, value_col: str) -> Dict[str, Any]:
    if not date_col or not value_col or date_col not in df.columns or value_col not in df.columns:
        return {}
        
    try:
        # Group by date and calculate mean/sum
        ts_df = df.copy()
        ts_df[date_col] = pd.to_datetime(ts_df[date_col])
        daily_series = ts_df.groupby(date_col)[value_col].mean().sort_index()
        
        if len(daily_series) < 3:
            return {
                "trend_direction": "stable",
                "slope": 0.0,
                "seasonality": "none",
                "anomalies_count": 0,
                "forecasted_value": float(daily_series.mean()) if not daily_series.empty else 0.0
            }
            
        # 1. Trend Direction (using linear regression slope)
        x = np.arange(len(daily_series))
        y = daily_series.values
        slope, intercept = np.polyfit(x, y, 1)
        
        # Determine trend direction
        relative_change = (slope * len(daily_series)) / max(1e-9, y[0])
        if relative_change > 0.05:
            trend = "upward"
        elif relative_change < -0.05:
            trend = "downward"
        else:
            trend = "stable"
            
        # 2. Seasonality (heuristics based on day of week or month variance)
        seasonality = "none"
        if len(daily_series) >= 14:
            # Check day of week pattern
            dow_means = daily_series.groupby(daily_series.index.dayofweek).mean()
            dow_var = dow_means.var()
            overall_var = daily_series.var()
            if overall_var > 0 and (dow_var / overall_var) > 0.15:
                seasonality = "weekly"
        
        # 3. Anomalies in Time Series (residual Z-score from rolling mean)
        rolling_mean = daily_series.rolling(window=min(7, len(daily_series)), min_periods=1).mean()
        rolling_std = daily_series.rolling(window=min(7, len(daily_series)), min_periods=1).std().fillna(0)
        
        residuals = daily_series - rolling_mean
        anomalies = []
        
        for idx, (dt, val) in enumerate(daily_series.items()):
            std_val = rolling_std.iloc[idx]
            if std_val > 0:
                z = residuals.iloc[idx] / std_val
                if abs(z) > 2.5: # 2.5 std deviations
                    anomalies.append({
                        "date": dt.isoformat(),
                        "value": float(val),
                        "z_score": float(z)
                    })
                    
        # 4. Forecasted next value using linear regression
        next_x = len(daily_series)
        forecasted_val = float(slope * next_x + intercept)
        
        return {
            "trend_direction": trend,
            "slope": float(slope),
            "seasonality": seasonality,
            "anomalies_count": len(anomalies),
            "anomalies": anomalies,
            "forecasted_value": forecasted_val
        }
    except Exception:
        return {
            "trend_direction": "stable",
            "slope": 0.0,
            "seasonality": "none",
            "anomalies_count": 0,
            "forecasted_value": 0.0
        }

def detect_outliers_zscore(df: pd.DataFrame) -> List[Dict[str, Any]]:
    # Returns list of rows that have z-score > 3 in any numeric column
    numeric_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
    outliers = []
    
    if not numeric_cols:
        return []
        
    try:
        for col in numeric_cols:
            series_clean = df[col].dropna()
            if len(series_clean) < 5:
                continue
            mean_val = series_clean.mean()
            std_val = series_clean.std()
            
            if std_val > 0:
                col_z = (df[col] - mean_val) / std_val
                outlier_indices = col_z[abs(col_z) > 3].index
                
                for idx in outlier_indices:
                    outliers.append({
                        "row_index": int(idx),
                        "column": col,
                        "value": float(df.loc[idx, col]),
                        "z_score": float(col_z.loc[idx])
                    })
        return outliers[:50] # Cap results
    except Exception:
        return []

def detect_clusters(df: pd.DataFrame) -> Tuple[List[int], List[Dict[str, Any]]]:
    # Returns cluster labels for each row, and cluster statistics
    numeric_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
    
    # Needs at least 3 rows and 1 numeric column
    if len(df) < 5 or not numeric_cols:
        return [0] * len(df), []
        
    try:
        # Impute and Scale
        sub_df = df[numeric_cols].fillna(df[numeric_cols].median())
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(sub_df)
        
        # KMeans clustering with k=3
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        labels = kmeans.fit_predict(scaled_data)
        
        # Calculate cluster profiles
        cluster_profiles = []
        for i in range(3):
            cluster_mask = (labels == i)
            count = int(cluster_mask.sum())
            if count == 0:
                continue
                
            cluster_means = {}
            for col in numeric_cols:
                cluster_means[col] = float(df.loc[cluster_mask, col].mean())
                
            cluster_profiles.append({
                "cluster_id": i,
                "size": count,
                "percentage": float(count / len(df)),
                "means": cluster_means
            })
            
        return labels.tolist(), cluster_profiles
    except Exception:
        return [0] * len(df), []

def find_top_bottom_performers(df: pd.DataFrame, metric_col: str, group_col: str) -> Dict[str, Any]:
    if not metric_col or not group_col or metric_col not in df.columns or group_col not in df.columns:
        return {}
        
    try:
        # Group by and calculate averages
        grouped = df.groupby(group_col)[metric_col].mean().dropna().sort_values(ascending=False)
        
        top_5 = []
        for name, val in grouped.head(5).items():
            top_5.append({"group": str(name), "value": float(val)})
            
        bottom_5 = []
        for name, val in grouped.tail(5).items():
            bottom_5.append({"group": str(name), "value": float(val)})
            
        # Reverse bottom 5 to show lowest first
        bottom_5.reverse()
        
        return {
            "metric": metric_col,
            "group_by": group_col,
            "top_performers": top_5,
            "bottom_performers": bottom_5
        }
    except Exception:
        return {}

def detect_anomalies(df: pd.DataFrame) -> List[int]:
    # Returns list of row indices that are flagged as anomalies using Isolation Forest
    numeric_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
    
    if len(df) < 10 or not numeric_cols:
        return []
        
    try:
        # Prepare sub dataframe
        sub_df = df[numeric_cols].fillna(df[numeric_cols].median())
        
        # Fit Isolation Forest
        clf = IsolationForest(contamination=0.05, random_state=42) # Flag 5% as anomalies
        preds = clf.fit_predict(sub_df)
        
        # Predictions are -1 for anomalies, 1 for normal
        anomaly_indices = df.index[preds == -1].tolist()
        return [int(idx) for idx in anomaly_indices]
    except Exception:
        return []
