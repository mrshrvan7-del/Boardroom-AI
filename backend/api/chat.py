# backend/api/chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.store import sessions
from backend.services.chat import handle_chat_query

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []

@router.post("/api/chat/{session_id}")
async def run_chat(session_id: str, req: ChatRequest):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = sessions[session_id]
    cleaned_df = session_data.get("cleaned_df")
    profile = session_data.get("profile")
    dataset_type = session_data.get("dataset_type", "Custom")
    
    if cleaned_df is None or profile is None:
        raise HTTPException(status_code=400, detail="Dataset must be cleaned and profiled before chat interface is active")
        
    try:
        # Run local query parser
        res = handle_chat_query(req.message, req.conversation_history or [], cleaned_df, profile, dataset_type)
        
        # Save to session history (cap at 20 messages / 10 turns)
        history = session_data.get("chat_history", [])
        history.append({"role": "user", "content": req.message})
        history.append({"role": "assistant", "content": res["answer_text"]})
        session_data["chat_history"] = history[-20:]
        
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processor failed: {str(e)}")
