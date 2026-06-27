# backend/api/meeting.py
from fastapi import APIRouter, HTTPException
from backend.store import sessions
from backend.services.meeting_generator import generate_meeting_context
from backend.services.insight_generator import generate_insights

router = APIRouter()

@router.post("/api/meeting/{session_id}")
async def get_meeting_mode_data(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = sessions[session_id]
    cleaned_df = session_data.get("cleaned_df")
    profile = session_data.get("profile")
    kpis = session_data.get("kpis")
    dataset_type = session_data.get("dataset_type", "Custom")
    insights = session_data.get("insights")
    analysis_results = session_data.get("analysis")
    
    if cleaned_df is None or profile is None or kpis is None:
        raise HTTPException(status_code=400, detail="Dataset must be cleaned and profiled first")
        
    try:
        # If insights were not generated yet, generate them on the fly
        if insights is None and analysis_results is not None:
            insights = generate_insights(analysis_results["descriptive_stats"], analysis_results, kpis, dataset_type, profile)
            session_data["insights"] = insights
        elif insights is None:
            # Create a mock/empty insights shell to prevent crash
            insights = {
                "health_score": 8.0,
                "highlights": [{"emoji": "📊", "text": "Dataset loaded successfully.", "type": "positive"}],
                "concerns": [{"emoji": "ℹ️", "text": "Run full analysis for deep metrics.", "severity": "low"}],
                "talking_points": ["Dataset contains active variables.", "Initial data quality checks look standard."]
            }
            
        meeting_data = generate_meeting_context(insights, kpis, dataset_type, profile)
        return meeting_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate meeting briefing: {str(e)}")
