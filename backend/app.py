from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.address_heat import router as address_router
# Existing routes
from routes.heatmap import router as heatmap_router
from routes.prediction import router as prediction_router
from routes.recommendation import router as recommendation_router

# New forecast route
from routes.forecast import router as forecast_router


app = FastAPI(
    title="Urban Heat AI Platform",
    description="AI-powered Urban Heat Island Monitoring, Prediction and Mitigation System",
    version="2.0.0"
)

# Enable CORS (important for React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# API ROUTES
# -------------------------------

# Heatmap monitoring
app.include_router(
    heatmap_router,
    prefix="/heatmap",
    tags=["Heatmap Data"]
)

# Heat prediction (existing)
app.include_router(
    prediction_router,
    prefix="/prediction",
    tags=["Heat Prediction"]
)

# Cooling recommendation engine
app.include_router(
    recommendation_router,
    prefix="/recommendation",
    tags=["Cooling Recommendations"]
)

# NEW: Urban heat forecasting
app.include_router(
    forecast_router,
    prefix="/forecast",
    tags=["Future Heat Forecast"]
)

app.include_router(address_router, prefix="/address_heat", tags=["Address Heat"])

# -------------------------------
# Root endpoint
# -------------------------------

@app.get("/")
def home():
    return {
        "status": "running",
        "project": "Urban Heat AI Platform",
        "version": "2.0",
        "features": [
            "Urban Heat Monitoring",
            "AI Heat Detection",
            "Cooling Recommendations",
            "Urban Heat Forecasting"
        ],
        "message": "Backend server is running successfully 🚀"
    }