# backend/api/analyze.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.store import sessions
from backend.analysis.statistics import compute_descriptive_stats, compute_correlations
from backend.analysis.patterns import (
    detect_time_series_patterns,
    detect_outliers_zscore,
    detect_clusters,
    find_top_bottom_performers,
    detect_anomalies
)
from backend.analysis.forecasting import forecast_metric
import pandas as pd
import numpy as np

router = APIRouter()

class ChartDataRequest(BaseModel):
    chart_type: str
    x_column: str
    y_column: str
    group_by: Optional[str] = None

@router.post("/api/analyze/{session_id}")
async def analyze_dataset(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = sessions[session_id]
    cleaned_df = session_data.get("cleaned_df")
    profile = session_data.get("profile")
    dataset_type = session_data.get("dataset_type")
    primary_metric = session_data.get("primary_metric")
    
    if cleaned_df is None or profile is None or dataset_type is None:
        raise HTTPException(status_code=400, detail="Dataset must be cleaned and understood before analysis")
        
    try:
        desc_stats = compute_descriptive_stats(cleaned_df)
        correlations = compute_correlations(cleaned_df)
        
        date_cols = profile.get("datetime_columns", [])
        patterns = {}
        forecasts = {}
        
        if date_cols and primary_metric and primary_metric in cleaned_df.columns:
            date_col = date_cols[0]
            patterns = detect_time_series_patterns(cleaned_df, date_col, primary_metric)
            
            try:
                temp_df = cleaned_df.copy()
                temp_df[date_col] = pd.to_datetime(temp_df[date_col])
                ts_series = temp_df.groupby(date_col)[primary_metric].mean().sort_index()
                forecasts = forecast_metric(ts_series, periods=3)
                last_date = ts_series.index[-1]
                freq = pd.infer_freq(ts_series.index) or "D"
                forecast_dates = pd.date_range(start=last_date, periods=4, freq=freq)[1:]
                forecasts["dates"] = [d.isoformat() for d in forecast_dates]
            except Exception:
                forecasts = {"forecast_values": [], "upper_bound": [], "lower_bound": [], "dates": []}
                
        outliers = detect_outliers_zscore(cleaned_df)
        cluster_labels, cluster_profiles = detect_clusters(cleaned_df)
        
        cleaned_df = cleaned_df.copy()
        cleaned_df["_cluster_id"] = cluster_labels
        sessions[session_id]["cleaned_df"] = cleaned_df
        
        cat_cols = profile.get("categorical_columns", [])
        performers = {}
        if cat_cols and primary_metric and primary_metric in cleaned_df.columns:
            performers = find_top_bottom_performers(cleaned_df, primary_metric, cat_cols[0])
            
        anomaly_rows = detect_anomalies(cleaned_df)
        
        analysis_results = {
            "descriptive_stats": desc_stats,
            "correlations": correlations,
            "patterns": patterns,
            "outliers": outliers,
            "clusters": cluster_profiles,
            "top_performers": performers.get("top_performers", []),
            "bottom_performers": performers.get("bottom_performers", []),
            "forecasts": forecasts,
            "anomaly_rows": anomaly_rows
        }
        
        sessions[session_id]["analysis"] = analysis_results
        
        return analysis_results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run analysis: {str(e)}")

@router.post("/api/chart_data/{session_id}")
async def get_chart_data(session_id: str, req: ChartDataRequest):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    df = sessions[session_id].get("cleaned_df")
    profile = sessions[session_id].get("profile")
    dataset_type = sessions[session_id].get("dataset_type", "Custom")
    
    if df is None or profile is None:
        raise HTTPException(status_code=400, detail="Session data has not been cleaned/profiled")
        
    try:
        chart_type = req.chart_type.lower()
        x_col = req.x_column
        y_col = req.y_column
        
        # Validate columns exist
        if chart_type != "heatmap" and x_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{x_col}' not found in dataset")
        if chart_type not in ["pie", "histogram", "heatmap"] and y_col != "count" and y_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{y_col}' not found in dataset")

        # 1. Line Chart
        if chart_type == "line":
            # If datetime column, parse and group
            if x_col in profile.get("datetime_columns", []):
                temp_df = df.copy()
                temp_df[x_col] = pd.to_datetime(temp_df[x_col])
                grouped = temp_df.groupby(x_col)[y_col].mean().sort_index()
                return {
                    "x_data": [str(d.date()) for d in grouped.index],
                    "y_data": [float(v) for v in grouped.values]
                }
            else:
                grouped = df.groupby(x_col)[y_col].mean().sort_index()
                return {
                    "x_data": [str(v) for v in grouped.index],
                    "y_data": [float(v) for v in grouped.values]
                }

        # 2. Bar Chart / Horizontal Bar Chart
        elif chart_type in ["bar", "horizontal_bar"]:
            # Aggregate: sum for sales revenue, else mean
            agg_func = "sum" if dataset_type == "Sales" and any(w in y_col.lower() for w in ["revenue", "sales", "price"]) else "mean"
            grouped = df.groupby(x_col)[y_col].agg(agg_func).dropna().sort_values(ascending=False)
            return {
                "categories": [str(c) for c in grouped.index],
                "values": [float(v) for v in grouped.values]
            }

        # 3. Pie / Donut Chart
        elif chart_type == "pie":
            if y_col == "count":
                counts = df[x_col].value_counts().head(8)
                return {
                    "data": [{"category": str(k), "value": int(v)} for k, v in counts.items()]
                }
            else:
                grouped = df.groupby(x_col)[y_col].mean().dropna().head(8)
                return {
                    "data": [{"category": str(k), "value": float(v)} for k, v in grouped.items()]
                }

        # 4. Scatter Plot
        elif chart_type == "scatter":
            x_data = df[x_col].dropna().values.tolist()
            y_data = df[y_col].dropna().values.tolist()
            # Synchronize sizes
            min_len = min(len(x_data), len(y_data), 500) # Cap at 500 points for performance
            return {
                "x_data": [float(v) for v in x_data[:min_len]],
                "y_data": [float(v) for v in y_data[:min_len]]
            }

        # 5. Heatmap Correlation Matrix
        elif chart_type == "heatmap":
            numeric_cols = profile.get("numeric_columns", [])
            analysis = sessions[session_id].get("analysis", {})
            correlations = analysis.get("correlations", [])
            return {
                "columns": numeric_cols,
                "correlations": correlations
            }

        # 6. Histogram with Normal Curve Overlay
        elif chart_type == "histogram":
            series_clean = df[x_col].dropna()
            counts, bin_edges = np.histogram(series_clean, bins=15)
            bin_centers = [(bin_edges[i] + bin_edges[i+1])/2 for i in range(len(bin_edges)-1)]
            
            # Normal curve calculations
            mean = float(series_clean.mean())
            std = float(series_clean.std()) if len(series_clean) > 1 else 1.0
            
            normal_y = []
            if std > 0:
                # normal distribution PDF
                pdf = (1 / (std * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((np.array(bin_centers) - mean) / std)**2)
                # Scale normal distribution curve to match count height
                # Area = count * bin_width
                bin_width = bin_edges[1] - bin_edges[0]
                normal_y = (pdf * len(series_clean) * bin_width).tolist()
                
            return {
                "bins": [f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}" for i in range(len(bin_edges)-1)],
                "bin_centers": [float(v) for v in bin_centers],
                "counts": [int(c) for c in counts],
                "normal_curve": [float(y) for y in normal_y]
            }

        # 7. Treemap (Hierarchical categories)
        elif chart_type == "treemap":
            group_col = req.group_by
            if not group_col or group_col not in df.columns:
                group_col = profile.get("categorical_columns", [])[1] if len(profile.get("categorical_columns", [])) > 1 else x_col
                
            tree_data = []
            top_cats = df[x_col].value_counts().head(5).index
            
            for cat in top_cats:
                cat_df = df[df[x_col] == cat]
                sub_counts = cat_df[group_col].value_counts().head(5)
                
                children = [{"name": str(sub_cat), "value": int(val)} for sub_cat, val in sub_counts.items()]
                tree_data.append({
                    "name": str(cat),
                    "children": children
                })
            return {"data": tree_data}

        # 8. Radar Chart
        elif chart_type == "radar":
            numeric_cols = profile.get("numeric_columns", [])[:5] # Max 5 axes
            cat_col = x_col
            
            # Group by category and compute averages for the numeric columns
            grouped = df.groupby(cat_col)[numeric_cols].mean().dropna().head(3) # Max 3 groups
            
            indicators = []
            for col in numeric_cols:
                indicators.append({
                    "name": col,
                    "max": float(df[col].max())
                })
                
            series_data = []
            for idx, (cat_name, row) in enumerate(grouped.iterrows()):
                series_data.append({
                    "name": str(cat_name),
                    "value": [float(v) for v in row.values]
                })
            return {
                "indicators": indicators,
                "data": series_data
            }

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported chart type: {chart_type}")

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chart dataset: {str(e)}")
