# backend/api/export.py
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from backend.store import sessions
from backend.exports.excel_export import generate_excel
from backend.exports.pdf_export import generate_pdf_report
from backend.exports.ppt_export import generate_ppt
from backend.services.insight_generator import generate_insights

router = APIRouter()

@router.post("/api/export/{session_id}")
async def export_dataset_report(
    session_id: str,
    format: str = Query("pdf", description="Export format: pdf, pptx, or xlsx")
):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = sessions[session_id]
    cleaned_df = session_data.get("cleaned_df")
    profile = session_data.get("profile")
    kpis = session_data.get("kpis")
    dataset_type = session_data.get("dataset_type", "Custom")
    analysis_results = session_data.get("analysis")
    insights = session_data.get("insights")
    filename = session_data.get("filename", "dataset.csv")
    
    if cleaned_df is None or profile is None or kpis is None or analysis_results is None:
        raise HTTPException(status_code=400, detail="Dataset must be cleaned and analyzed before exporting")
        
    # Generate insights if missing
    if insights is None:
        try:
            insights = generate_insights(analysis_results["descriptive_stats"], analysis_results, kpis, dataset_type, profile)
            session_data["insights"] = insights
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to prep insights: {str(e)}")
            
    try:
        format_lower = format.lower()
        if format_lower == "pdf":
            pdf_buffer = generate_pdf_report(session_id, filename, dataset_type, kpis, insights)
            clean_name = filename.rsplit(".", 1)[0]
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=Boardroom_AI_{clean_name}_Report.pdf"}
            )
            
        elif format_lower == "pptx":
            ppt_buffer = generate_ppt(session_id, filename, dataset_type, kpis, insights)
            clean_name = filename.rsplit(".", 1)[0]
            return StreamingResponse(
                ppt_buffer,
                media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                headers={"Content-Disposition": f"attachment; filename=Boardroom_AI_{clean_name}_Briefing.pptx"}
            )
            
        elif format_lower == "xlsx":
            excel_buffer = generate_excel(cleaned_df, kpis, analysis_results)
            clean_name = filename.rsplit(".", 1)[0]
            return StreamingResponse(
                excel_buffer,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=Boardroom_AI_{clean_name}_Data.xlsx"}
            )
            
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Supported formats are pdf, pptx, xlsx")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate export file: {str(e)}")
