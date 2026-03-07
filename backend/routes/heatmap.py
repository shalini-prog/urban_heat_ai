from fastapi import APIRouter
import pandas as pd
import time
import os

from models.heat_detector import detect_heat_zones
from utils.weather_fetch import get_weather_by_coords

router = APIRouter()

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# City dataset paths
CITY_DATASETS = {
    "chennai": os.path.join(BASE_DIR, "data", "chennai_locations.csv"),
    "delhi": os.path.join(BASE_DIR, "data", "new_delhi_locations.csv")
}


@router.get("/")
def get_heatmap(city: str = "chennai"):
    """
    Generate heatmap using weather API + AI heat detection
    Supported cities: chennai, delhi
    """

    # Validate city
    if city not in CITY_DATASETS:
        return {
            "status": "error",
            "message": f"City '{city}' not supported"
        }

    dataset_path = CITY_DATASETS[city]

    # Load dataset
    try:
        locations = pd.read_csv(dataset_path)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to load location dataset: {str(e)}"
        }

    records = []

    for _, row in locations.iterrows():

        lat = row["lat"]
        lon = row["lon"]
        area = row["area"]
        pincode = row["pincode"]

        try:

            weather = get_weather_by_coords(lat, lon)

            if weather:
                weather["area"] = area
                weather["pincode"] = pincode
                records.append(weather)

        except Exception as e:
            print(f"Weather fetch failed for {area} ({lat},{lon}): {e}")

        # Prevent OpenWeather API rate limit
        time.sleep(1)

    df = pd.DataFrame(records)

    print("Fetched records:", len(df))

    if df.empty:
        return {
            "status": "error",
            "message": "No weather data fetched. Check API key or rate limit."
        }

    # Ensure ML input columns exist
    required_columns = ["temperature", "humidity", "vegetation"]

    for col in required_columns:
        if col not in df.columns:
            return {
                "status": "error",
                "message": f"Missing column: {col}"
            }

    # Run AI heat detection
    df = detect_heat_zones(df)

    result = df.to_dict(orient="records")

    return {
        "status": "success",
        "city": city,
        "points": len(result),
        "data": result
    }