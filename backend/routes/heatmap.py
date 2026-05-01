from fastapi import APIRouter
import pandas as pd
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

from utils.worker_safety import generate_worker_safety
from utils.weather_fetch import get_weather_by_coords
from utils.heat_risk_engine import generate_heat_risk

router = APIRouter()

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# City dataset paths
CITY_DATASETS = {
    "chennai": os.path.join(BASE_DIR, "data", "chennai_locations.csv"),
    "delhi": os.path.join(BASE_DIR, "data", "new_delhi_locations.csv")
}


# 🔥 Worker function (runs in parallel)
def process_location(row):
    try:
        lat = row.get("lat")
        lon = row.get("lon")
        area = row.get("area", "Unknown")
        pincode = row.get("pincode", "N/A")

        if pd.isna(lat) or pd.isna(lon):
            return None

        weather = get_weather_by_coords(lat, lon)
        if not weather:
            return None

        # Heat Risk
        risk = generate_heat_risk(
            temp=weather["temperature"],
            humidity=weather["humidity"],
            vegetation=weather.get("vegetation", 0.2),
            building_density=weather.get("building_density", 0.5)
        )

        combined = {**weather, **risk}

        # Worker Safety
        combined["worker_safety"] = generate_worker_safety(risk)

        combined["area"] = area
        combined["pincode"] = pincode

        return combined

    except Exception as e:
        print(f"Error processing {row}: {e}")
        return None


@router.get("/")
def get_heatmap(city: str = "chennai"):

    city = city.lower().strip()

    if city not in CITY_DATASETS:
        return {
            "status": "error",
            "message": f"City '{city}' not supported"
        }

    dataset_path = CITY_DATASETS[city]

    try:
        locations = pd.read_csv(dataset_path)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to load dataset: {str(e)}"
        }

    records = []

    # 🚀 PARALLEL EXECUTION
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(process_location, row) for _, row in locations.iterrows()]

        for future in as_completed(futures):
            result = future.result()
            if result:
                records.append(result)

    if not records:
        return {
            "status": "error",
            "message": "No data fetched. Check API key or network."
        }

    return {
        "status": "success",
        "city": city,
        "points": len(records),
        "data": records
    }