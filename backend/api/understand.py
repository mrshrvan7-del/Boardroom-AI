# backend/api/understand.py
from fastapi import APIRouter, HTTPException, Query
from backend.store import sessions
from backend.services.dataset_classifier import classify_dataset
from backend.services.kpi_engine import detect_kpis
from typing import Optional

router = APIRouter()

@router.post("/api/understand/{session_id}")
async def understand_dataset(
    session_id: str,
    override_type: Optional[str] = Query(None, description="Manually override dataset type: HR, Sales, Support, Finance, Custom")
):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = sessions[session_id]
    cleaned_df = session_data.get("cleaned_df")
    profile = session_data.get("profile")
    
    if cleaned_df is None or profile is None:
        raise HTTPException(status_code=400, detail="Dataset must be cleaned and profiled before calling understand")
        
    try:
        column_names = list(cleaned_df.columns)
        dtypes = {col: str(dtype) for col, dtype in cleaned_df.dtypes.items()}
        
        sample_df = cleaned_df.head(5).copy()
        sample_df = sample_df.where(pd_notnull_shim(sample_df), None)
        sample_rows = sample_df.to_dict(orient="records")
        
        # Get base classification
        classification = classify_dataset(column_names, sample_rows, dtypes, profile)
        
        # If manually overridden
        if override_type:
            valid_types = ["HR", "Sales", "Support", "Finance", "Custom"]
            if override_type in valid_types:
                classification["dataset_type"] = override_type
                classification["confidence"] = 100
                classification["domain_context"] = f"Manually overridden to {override_type} Analytics"
                
                # Update primary metric
                numeric_cols = profile.get("numeric_columns", [])
                if override_type == "HR":
                    salary_cols = [c for c in numeric_cols if "salary" in c.lower()]
                    classification["primary_metric"] = salary_cols[0] if salary_cols else (numeric_cols[0] if numeric_cols else "")
                elif override_type == "Sales":
                    rev_cols = [c for c in numeric_cols if "revenue" in c.lower() or "amount" in c.lower()]
                    classification["primary_metric"] = rev_cols[0] if rev_cols else (numeric_cols[0] if numeric_cols else "")
                elif override_type == "Support":
                    classification["primary_metric"] = numeric_cols[0] if numeric_cols else ""
                elif override_type == "Finance":
                    profit_cols = [c for c in numeric_cols if "profit" in c.lower() or "income" in c.lower()]
                    classification["primary_metric"] = profit_cols[0] if profit_cols else (numeric_cols[0] if numeric_cols else "")
                else:
                    classification["primary_metric"] = numeric_cols[0] if numeric_cols else ""

        # Calculate KPIs using KPI Engine
        kpis = detect_kpis(cleaned_df, classification["dataset_type"], profile)
        
        # Save to store
        sessions[session_id].update({
            "dataset_type": classification["dataset_type"],
            "confidence": classification["confidence"],
            "domain_context": classification["domain_context"],
            "kpis": kpis,
            "primary_metric": classification["primary_metric"],
            "time_series": classification["time_series"],
            "geographic": classification["geographic"]
        })
        
        response_data = {**classification, "kpis": kpis}
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to understand dataset: {str(e)}")

def pd_notnull_shim(df):
    import pandas as pd
    return pd.notnull(df)
