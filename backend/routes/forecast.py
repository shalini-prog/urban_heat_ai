from fastapi import APIRouter
from models.heat_forecast import predict_future_heat

router = APIRouter()

@router.get("/")
def forecast(temp: float, humidity: float, vegetation: float):

    prediction = predict_future_heat(temp, humidity, vegetation)

    return {
        "status": "success",
        "forecast": prediction
    }