# backend/store.py
import pandas as pd
from typing import Dict, Any

# In-memory store for session data
# Format:
# {
#     "session_id": {
#         "filename": str,
#         "file_size": int,
#         "df": pd.DataFrame,          # Original DataFrame
#         "cleaned_df": pd.DataFrame,  # Cleaned DataFrame
#         "profile": Dict[str, Any],   # Profiler results
#         "clean_report": Dict[str, Any], # Cleaner results
#         "analysis": Dict[str, Any],  # Statistical analysis results
#         "dataset_type": str,         # Classified dataset type (e.g. HR, Sales)
#         "kpis": list,                # KPI list
#         "insights": Dict[str, Any],  # Insights and recommendations
#         "chat_history": list         # Conversation history for Chat
#     }
# }
sessions: Dict[str, Dict[str, Any]] = {}
