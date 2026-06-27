# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.upload import router as upload_router
from backend.api.process import router as process_router
from backend.api.understand import router as understand_router
from backend.api.analyze import router as analyze_router
from backend.api.insights import router as insights_router
from backend.api.chat import router as chat_router
from backend.api.meeting import router as meeting_router
from backend.api.export import router as export_router

app = FastAPI(
    title="Boardroom-AI Analytics Platform API",
    description="Local statistical profiling and narrative insights engine.",
    version="1.0.0"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all. In production, restrict to frontend domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(upload_router, tags=["Upload"])
app.include_router(process_router, tags=["Data Cleaning & Profiling"])
app.include_router(understand_router, tags=["Data Classification & KPIs"])
app.include_router(analyze_router, tags=["Statistical Analysis"])
app.include_router(insights_router, tags=["Insights & Narratives"])
app.include_router(chat_router, tags=["Ask AI Chat"])
app.include_router(meeting_router, tags=["Meeting Mode briefing"])
app.include_router(export_router, tags=["Export"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Boardroom-AI Analytics Engine",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
