import requests

API_KEY = "9a7935047a6385fef8df85b31afcf8c6"

def get_weather_by_coords(lat, lon):

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"

    try:
        response = requests.get(url, timeout=5)
        data = response.json()

        if "main" not in data:
            print("API error:", data)
            return None

        return {
            "lat": lat,
            "lon": lon,
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "vegetation": 0.2
        }

    except Exception as e:
        print("Weather fetch error:", e)
        return None