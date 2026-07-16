from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth_api, dashboard_api, admin_api

app = FastAPI(
    title="CrimeVision API",
    description="Backend API for AI-Powered Crime Intelligence Platform",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with Vercel frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_api.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin_api.router, prefix="/api/admin", tags=["Administration"])
app.include_router(dashboard_api.router, prefix="/api/dashboard", tags=["Dashboard"])

from app.api import heatmap_api
app.include_router(heatmap_api.router, prefix="/api/map", tags=["Map"])

from app.api import risk_analysis_api
app.include_router(risk_analysis_api.router, prefix="/api/risk", tags=["Risk Analysis"])

from app.api import district_api
app.include_router(district_api.router, prefix="/api/district", tags=["District Drilldowns"])

from app.api import alerts_api
app.include_router(alerts_api.router, prefix="/api/alerts", tags=["Trend Alerts"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CrimeVision API"}

from app.api import chat_api
app.include_router(chat_api.router, prefix="/api/chat", tags=["Chatbot"])

from app.api import dataset_api
app.include_router(dataset_api.router, prefix="/api/dataset", tags=["Dataset"])

from app.api import fir_api
app.include_router(fir_api.router, prefix="/api/fir", tags=["FIR"])

# Will include routers here
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
