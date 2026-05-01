from fastapi import APIRouter
from utils.weather_fetch import get_weather_by_coords
from models.heat_forecast import predict_future_heat

router = APIRouter()

@router.get("/")
def forecast(lat: float, lon: float):
    """
    Predict future heat using smart logic
    """

    weather = get_weather_by_coords(lat, lon)

    if not weather:
        return {
            "status": "error",
            "message": "Weather fetch failed"
        }

    forecast_data = predict_future_heat(
        temp=weather["temperature"],
        humidity=weather["humidity"],
        vegetation=weather.get("vegetation", 0.2)
    )

    return {
        "status": "success",
        "location": {
            "lat": lat,
            "lon": lon
        },
        "current_temp": weather["temperature"],
        "forecast": forecast_data
    }