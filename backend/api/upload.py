# backend/api/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
import pandas as pd
import uuid
import json
import io
import chardet
from backend.store import sessions

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def detect_csv_delimiter(content: bytes) -> str:
    # Try to sniff the delimiter check first few lines
    sample = content[:10000].decode("utf-8", errors="ignore")
    delimiters = [",", ";", "\t", "|"]
    best_delim = ","
    max_count = 0
    # Simple heuristic: count occurrences in the first line
    first_line = sample.split("\n")[0] if "\n" in sample else sample
    for d in delimiters:
        count = first_line.count(d)
        if count > max_count:
            max_count = count
            best_delim = d
    return best_delim

@router.post("/api/upload")
async def upload_file(
    file: UploadFile = File(None),
    raw_text: str = Form(None)
):
    session_id = str(uuid.uuid4())
    filename = "pasted_text.csv"
    file_size = 0
    df = None

    try:
        # Check if text was pasted
        if raw_text:
            text_bytes = raw_text.encode("utf-8")
            file_size = len(text_bytes)
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="Pasted text exceeds 50MB limit")
            
            # Auto detect delimiter
            delim = detect_csv_delimiter(text_bytes)
            df = pd.read_csv(io.BytesIO(text_bytes), sep=delim)
            filename = "pasted_data.csv"
        
        # Otherwise parse uploaded file
        elif file:
            # Validate size
            content = await file.read()
            file_size = len(content)
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
            
            filename = file.filename
            lower_name = filename.lower()
            
            if lower_name.endswith((".csv", ".tsv", ".txt")):
                # Detect encoding
                detection = chardet.detect(content[:20000])
                encoding = detection.get("encoding", "utf-8") or "utf-8"
                
                # Detect delimiter
                delim = "\t" if lower_name.endswith(".tsv") else detect_csv_delimiter(content)
                
                df = pd.read_csv(io.BytesIO(content), sep=delim, encoding=encoding)
            
            elif lower_name.endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(content))
            
            elif lower_name.endswith(".json"):
                detection = chardet.detect(content[:20000])
                encoding = detection.get("encoding", "utf-8") or "utf-8"
                df = pd.read_json(io.BytesIO(content), encoding=encoding)
                # If JSON is not flat, we might have nested data, convert to flat if it's a simple list/dict
                if isinstance(df, pd.DataFrame) is False:
                    df = pd.json_normalize(json.loads(content.decode(encoding)))
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .csv, .tsv, .xlsx, .xls, .json, or .txt")
        else:
            raise HTTPException(status_code=400, detail="No file or text data provided")

        if df is None or df.empty:
            raise HTTPException(status_code=400, detail="The file or text data appears to be empty")

        # Basic cleanup: remove completely empty columns or rows
        df = df.dropna(how="all")
        
        # Prepare response profile preview
        rows_count, cols_count = df.shape
        column_names = list(df.columns)
        dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        # Get sample preview (up to 3 rows) and serialize safely
        # Fill NaN values with None for JSON compatibility
        preview_df = df.head(3).copy()
        preview_df = preview_df.where(pd.notnull(preview_df), None)
        preview_rows = preview_df.to_dict(orient="records")

        # Save to session store
        sessions[session_id] = {
            "filename": filename,
            "file_size": file_size,
            "df": df.copy(),
            "cleaned_df": df.copy(), # will be updated in cleaner step
            "chat_history": []
        }

        # Human friendly file size
        if file_size < 1024:
            size_str = f"{file_size} B"
        elif file_size < 1024 * 1024:
            size_str = f"{file_size / 1024:.1f} KB"
        else:
            size_str = f"{file_size / (1024 * 1024):.1f} MB"

        return {
            "session_id": session_id,
            "filename": filename,
            "rows": rows_count,
            "columns": cols_count,
            "preview_rows": preview_rows,
            "column_names": column_names,
            "dtypes": dtypes,
            "file_size": size_str,
            "file_size_bytes": file_size
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse file: {str(e)}")

@router.get("/api/session/{session_id}")
async def get_session_info(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = sessions[session_id]
    df = session_data.get("cleaned_df", session_data.get("df"))
    
    rows_count, cols_count = df.shape
    preview_df = df.head(3).copy()
    preview_df = preview_df.where(pd.notnull(preview_df), None)
    preview_rows = preview_df.to_dict(orient="records")
    
    return {
        "session_id": session_id,
        "filename": session_data.get("filename"),
        "file_size_bytes": session_data.get("file_size"),
        "rows": rows_count,
        "columns": cols_count,
        "preview_rows": preview_rows,
        "column_names": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
    }
