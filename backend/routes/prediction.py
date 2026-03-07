from fastapi import APIRouter
import random

router = APIRouter()

@router.get("/")
def predict_heat():

    # Dummy prediction for now (AI model will replace this later)

    prediction = {
        "area": "Chennai",
        "predicted_temperature": round(random.uniform(35, 44), 2),
        "heat_risk_score": random.randint(50, 95)
    }

    return {
        "status": "success",
        "prediction": prediction
    }