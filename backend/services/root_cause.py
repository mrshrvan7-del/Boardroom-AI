# backend/services/root_cause.py
import pandas as pd
import numpy as np
from typing import Dict, Any, List

def analyze_root_cause(metric_name: str, metric_value: str, direction: str, df: pd.DataFrame, profile: Dict[str, Any]) -> Dict[str, Any]:
    if metric_name not in df.columns or not pd.api.types.is_numeric_dtype(df[metric_name]):
        return {
            "metric": metric_name,
            "value": metric_value,
            "direction": direction,
            "narrative": f"Could not perform root cause analysis: '{metric_name}' is not a valid numeric column in the dataset.",
            "top_drivers": []
        }
        
    try:
        numeric_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col]) and col != metric_name]
        
        if not numeric_cols:
            return {
                "metric": metric_name,
                "value": metric_value,
                "direction": direction,
                "narrative": f"No other numerical columns are available in the dataset to perform correlation analysis for '{metric_name}'.",
                "top_drivers": []
            }
            
        # Compute correlations with the target metric
        corrs = []
        for col in numeric_cols:
            coeff = df[metric_name].corr(df[col])
            if not pd.isnull(coeff):
                corrs.append({
                    "column": col,
                    "coefficient": float(coeff),
                    "abs_coeff": abs(coeff)
                })
                
        # Sort by absolute correlation coefficient descending
        corrs.sort(key=lambda x: x["abs_coeff"], reverse=True)
        top_drivers = corrs[:3]
        
        narrative_parts = [
            f"The metric '{metric_name}' has shifted {direction} (value: {metric_value}).",
            "Based on a local correlation scan of other numerical variables, this shift is most statistically connected to:"
        ]
        
        for i, d in enumerate(top_drivers, 1):
            strength = "strong" if d["abs_coeff"] >= 0.7 else "moderate" if d["abs_coeff"] >= 0.4 else "weak"
            direction_str = "positive" if d["coefficient"] > 0 else "negative"
            narrative_parts.append(
                f"{i}. '{d['column']}' (correlation of {d['coefficient']:.2f}, indicating a {strength} {direction_str} relationship)."
            )
            
        if direction == "down" and top_drivers:
            primary = top_drivers[0]
            if primary["coefficient"] > 0:
                narrative_parts.append(
                    f"Actionable Focus: A decline in '{metric_name}' correlates with decreases in '{primary['column']}'. Boosting '{primary['column']}' is the most statistical path to recovery."
                )
            else:
                narrative_parts.append(
                    f"Actionable Focus: A decline in '{metric_name}' correlates with increases in '{primary['column']}'. Stabilizing or reducing '{primary['column']}' will help pull '{metric_name}' back up."
                )
                
        narrative = " ".join(narrative_parts)
        
        return {
            "metric": metric_name,
            "value": metric_value,
            "direction": direction,
            "narrative": narrative,
            "top_drivers": top_drivers
        }
    except Exception as e:
        return {
            "metric": metric_name,
            "value": metric_value,
            "direction": direction,
            "narrative": f"An error occurred during root cause analysis: {str(e)}",
            "top_drivers": []
        }
