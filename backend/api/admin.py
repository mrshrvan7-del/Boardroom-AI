# backend/api/admin.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os

router = APIRouter()

class AdminCredentials(BaseModel):
    username: str
    password: str

LOG_FILE_PATH = "backend/audit_log.json"

@router.post("/api/admin/logs")
async def get_admin_logs(creds: AdminCredentials):
    # Verify secure credentials provided by user
    if creds.username != "Saravana" or creds.password != "Mrshrvan7!":
        raise HTTPException(status_code=401, detail="Invalid admin credentials.")
        
    logs = []
    if os.path.exists(LOG_FILE_PATH):
        try:
            with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    logs = json.loads(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read logs: {str(e)}")
            
    return {
        "status": "success",
        "logs": logs
    }
