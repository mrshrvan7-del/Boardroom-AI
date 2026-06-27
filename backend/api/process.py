# backend/api/process.py
from fastapi import APIRouter, HTTPException
from backend.store import sessions
from backend.services.cleaner import clean_dataset
from backend.services.profiler import profile_dataset

router = APIRouter()

@router.post("/api/process/{session_id}")
async def process_dataset(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = sessions[session_id]
    original_df = session_data["df"]
    
    try:
        # Run cleaner
        cleaned_df, cleaning_report = clean_dataset(original_df.copy())
        
        # Run profiler
        profile = profile_dataset(cleaned_df)
        
        # Save to store
        sessions[session_id].update({
            "cleaned_df": cleaned_df,
            "profile": profile,
            "clean_report": cleaning_report
        })
        
        # Prepare JSON serializable response
        # Profile might contain numpy float/int types, which should be already cast,
        # but let's make sure everything returned is standard Python
        return {
            "cleaning_report": cleaning_report,
            "profile": profile
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clean and profile dataset: {str(e)}")
