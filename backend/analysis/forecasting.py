# backend/analysis/forecasting.py
import pandas as pd
import numpy as np
from typing import Dict, Any, List

def forecast_metric(series: pd.Series, periods: int = 3) -> Dict[str, Any]:
    series_clean = series.dropna()
    if len(series_clean) < 3:
        return {
            "forecast_values": [],
            "upper_bound": [],
            "lower_bound": [],
            "dates": []
        }
        
    try:
        x = np.arange(len(series_clean))
        y = series_clean.values
        
        # Fit linear regression model
        slope, intercept = np.polyfit(x, y, 1)
        
        # Calculate standard error of estimate
        y_pred = slope * x + intercept
        residuals = y - y_pred
        std_err = np.std(residuals) if len(residuals) > 1 else 1e-9
        
        forecast_vals = []
        upper_bounds = []
        lower_bounds = []
        
        for p in range(1, periods + 1):
            next_x = len(series_clean) + p - 1
            pred_val = slope * next_x + intercept
            
            # Confidence intervals (95% approx: pred +/- 1.96 * std_err)
            margin = 1.96 * std_err * (1 + (1 / len(series_clean)) + ((next_x - np.mean(x))**2 / np.sum((x - np.mean(x))**2)))**0.5
            
            forecast_vals.append(float(pred_val))
            upper_bounds.append(float(pred_val + margin))
            lower_bounds.append(float(max(0, pred_val - margin))) # clamp to 0 if appropriate, otherwise float
            
        return {
            "forecast_values": forecast_vals,
            "upper_bound": upper_bounds,
            "lower_bound": lower_bounds
        }
    except Exception:
        # Simple mean fallback
        mean_val = float(series_clean.mean())
        return {
            "forecast_values": [mean_val] * periods,
            "upper_bound": [mean_val * 1.1] * periods,
            "lower_bound": [mean_val * 0.9] * periods
        }

def compute_growth_rate(series: pd.Series) -> Dict[str, float]:
    series_clean = series.dropna()
    if len(series_clean) < 2:
        return {"mom": 0.0, "yoy": 0.0}
        
    try:
        # MoM (Month-over-Month) or Period-over-Period growth
        last_val = series_clean.iloc[-1]
        prev_val = series_clean.iloc[-2]
        mom_growth = ((last_val - prev_val) / prev_val) if prev_val != 0 else 0.0
        
        # YoY (Year-over-Year) growth (assuming monthly or check index distance if 12 periods back)
        yoy_growth = 0.0
        if len(series_clean) >= 12:
            yoy_prev_val = series_clean.iloc[-12]
            yoy_growth = ((last_val - yoy_prev_val) / yoy_prev_val) if yoy_prev_val != 0 else 0.0
        else:
            # Fallback to the first available period
            first_val = series_clean.iloc[0]
            yoy_growth = ((last_val - first_val) / first_val) if first_val != 0 else 0.0
            
        return {
            "mom": float(mom_growth),
            "yoy": float(yoy_growth)
        }
    except Exception:
        return {"mom": 0.0, "yoy": 0.0}

def compute_moving_average(series: pd.Series, window: int = 3) -> List[float]:
    try:
        ma = series.rolling(window=window, min_periods=1).mean()
        # fill nan with mean
        ma = ma.fillna(series.mean())
        return [float(v) for v in ma.values]
    except Exception:
        return [float(v) for v in series.fillna(0).values]
