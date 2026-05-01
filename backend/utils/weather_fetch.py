import requests
import math

API_KEY="c46ed59c21c518921cdd12b086313464"

def estimate_vegetation(temp, humidity):
    """
    Estimate vegetation index (NDVI-like)
    """
    # Cooler + humid → more vegetation
    veg = (humidity / 100) * (1 - temp / 50)
    return round(max(0.1, min(veg, 0.8)), 2)


def estimate_building_density(lat, lon):
    """
    Generic urban density estimation (India-wide)
    """

    # Major metro zones (approx logic)
    if (
        12 < lat < 14 or   # Chennai/Bangalore
        18 < lat < 20 or   # Mumbai
        22 < lat < 24 or   # Kolkata
        28 < lat < 29      # Delhi
    ):
        return 0.7  # dense urban

    return 0.4  # semi-urban / rural


def get_weather_by_coords(lat, lon):

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"

    try:
        response = requests.get(url, timeout=5)
        data = response.json()

        if "main" not in data:
            print("API error:", data)
            return None

        temp = data["main"]["temp"]
        humidity = data["main"]["humidity"]

        vegetation = estimate_vegetation(temp, humidity)
        building_density = estimate_building_density(lat, lon)

        return {
            "lat": lat,
            "lon": lon,
            "temperature": temp,
            "humidity": humidity,
            "vegetation": vegetation,
            "building_density": building_density
        }

    except Exception as e:
        print("Weather fetch error:", e)
        return None