import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection

from app.routes.auth import router as auth_router
from app.routes.patients import router as patients_router
from app.routes.doctors import router as doctors_router
from app.routes.analysis import router as analysis_router
from app.routes.reports import router as reports_router

app = FastAPI(
    title="LungAI API",
    description="Backend API for LungAI Multimodal Healthcare Support with Explainable AI (XAI)",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded files directory
app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Register API routes
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(doctors_router)
app.include_router(analysis_router)
app.include_router(reports_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "Multimodal Healthcare Support System with Explainable AI",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
