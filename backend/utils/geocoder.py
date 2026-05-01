import requests

def get_coordinates(address):
    """
    Convert address → latitude & longitude
    """

    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": address,
        "format": "json"
    }

    try:
        response = requests.get(url, params=params, headers={"User-Agent": "heat-app"})
        data = response.json()

        if len(data) == 0:
            return None

        return {
            "lat": float(data[0]["lat"]),
            "lon": float(data[0]["lon"])
        }

    except Exception as e:
        print("Geocoding error:", e)
        return None