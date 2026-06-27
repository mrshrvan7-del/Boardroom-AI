# backend/services/audit_logger.py
import json
import os
from datetime import datetime
from typing import Dict, Any, List

LOG_FILE_PATH = "backend/audit_log.json"

def log_upload_event(filename: str, file_size: str, rows: int, columns: int, column_names: List[str], dtypes: Dict[str, str]):
    # Formulate log entry
    entry = {
        "timestamp": datetime.now().isoformat(),
        "filename": filename,
        "file_size": file_size,
        "rows": rows,
        "columns": columns,
        "column_names": column_names,
        "dtypes": dtypes
    }
    
    logs = []
    
    # Read existing log records if present
    if os.path.exists(LOG_FILE_PATH):
        try:
            with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    logs = json.loads(content)
                    if not isinstance(logs, list):
                        logs = []
        except Exception as e:
            print("Failed to read audit logs:", e)
            logs = []
            
    # Append new log
    logs.append(entry)
    
    # Write back safely
    try:
        os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)
        with open(LOG_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print("Failed to write audit logs:", e)
