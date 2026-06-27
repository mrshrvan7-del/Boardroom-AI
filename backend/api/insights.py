# backend/api/insights.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.store import sessions
from backend.services.insight_generator import generate_insights
from backend.services.root_cause import analyze_root_cause

router = APIRouter()

class RootCauseRequest(BaseModel):
    metric_name: str
    metric_value: str
    direction: str

@router.post("/api/insights/{session_id}")
async def fetch_insights(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = sessions[session_id]
    cleaned_df = session_data.get("cleaned_df")
    profile = session_data.get("profile")
    analysis_results = session_data.get("analysis")
    kpis = session_data.get("kpis")
    dataset_type = session_data.get("dataset_type")
    
    if cleaned_df is None or profile is None or analysis_results is None or kpis is None or dataset_type is None:
        raise HTTPException(status_code=400, detail="Dataset must be cleaned, understood, and analyzed before generating insights")
        
    try:
        # Generate insights
        insights = generate_insights(analysis_results["descriptive_stats"], analysis_results, kpis, dataset_type, profile)
        
        # Save to store
        sessions[session_id]["insights"] = insights
        
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

@router.post("/api/root_cause/{session_id}")
async def run_root_cause(session_id: str, req: RootCauseRequest):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = sessions[session_id]
    cleaned_df = session_data.get("cleaned_df")
    profile = session_data.get("profile")
    
    if cleaned_df is None or profile is None:
        raise HTTPException(status_code=400, detail="Dataset must be loaded and profiled before running root cause analysis")
        
    try:
        res = analyze_root_cause(req.metric_name, req.metric_value, req.direction, cleaned_df, profile)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Root cause analysis failed: {str(e)}")
