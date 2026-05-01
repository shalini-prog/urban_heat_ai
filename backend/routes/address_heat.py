from fastapi import APIRouter
import numpy as np

from utils.geocoder import get_coordinates
from utils.nearby_grid import generate_nearby_grid
from utils.weather_fetch import get_weather_by_coords
from utils.heat_risk_engine import generate_heat_risk

router = APIRouter()


@router.get("/")
def get_heat_by_address(address: str):

    # Step 1: Convert address → coordinates
    coords = get_coordinates(address)

    if not coords:
        return {"status": "error", "message": "Address not found"}

    lat, lon = coords["lat"], coords["lon"]

    # Step 2: Generate nearby grid (dense)
    grid_points = generate_nearby_grid(lat, lon, step=0.003, size=6)

    # Step 3: Fetch base weather ONLY ONCE (⚡ fast)
    base_weather = get_weather_by_coords(lat, lon)

    if not base_weather:
        return {"status": "error", "message": "Weather fetch failed"}

    results = []

    # Step 4: Generate heat data for all points (simulation)
    for lat_p, lon_p in grid_points:

        temp = base_weather["temperature"] + np.random.uniform(-1.5, 1.5)
        humidity = base_weather["humidity"] + np.random.uniform(-5, 5)
        vegetation = base_weather.get("vegetation", 0.2) + np.random.uniform(-0.05, 0.05)

        # Clamp values (avoid weird data)
        humidity = max(20, min(100, humidity))
        vegetation = max(0.1, min(0.9, vegetation))

        risk = generate_heat_risk(
    temp=temp,
    humidity=humidity,
    vegetation=vegetation,
    building_density=base_weather.get("building_density", 0.5),
    lat=lat_p,
    lon=lon_p
)

        results.append({
            "lat": lat_p,
            "lon": lon_p,
            **risk
        })

    return {
        "status": "success",
        "center": coords,
        "points": results
    }