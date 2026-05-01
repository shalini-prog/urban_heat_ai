import math


# -------------------------------
# HEAT INDEX (Feels Like Temp)
# -------------------------------
def calculate_heat_index(temp, humidity):
    """
    Smart Heat Index Calculation
    Uses NOAA only when valid, else returns actual temp
    """

    # ❗ If temperature is low, return actual temp
    if temp < 27:
        return round(temp, 2)

    # ❗ If humidity is low, effect is minimal
    if humidity < 40:
        return round(temp, 2)

    # ✅ NOAA formula (valid region)
    hi = (
        -8.784695
        + 1.61139411 * temp
        + 2.338549 * humidity
        - 0.14611605 * temp * humidity
        - 0.012308094 * (temp ** 2)
        - 0.016424828 * (humidity ** 2)
        + 0.002211732 * (temp ** 2) * humidity
        + 0.00072546 * temp * (humidity ** 2)
        - 0.000003582 * (temp ** 2) * (humidity ** 2)
    )

    return round(hi, 2)


# -------------------------------
# HILL STATION DETECTION
# -------------------------------
def is_hill_station(lat, lon):
    """
    Basic hill region detection (can expand later)
    """

    # Kodaikanal
    if 10.1 < lat < 10.4 and 77.3 < lon < 77.6:
        return True

    # Ooty
    if 11.3 < lat < 11.6 and 76.5 < lon < 76.9:
        return True

    return False


# -------------------------------
# RISK SCORE CALCULATION
# -------------------------------
def calculate_risk_score(temp, humidity, vegetation, building_density):
    """
    Combined risk score using environment + human comfort
    """

    heat_index = calculate_heat_index(temp, humidity)

    # Normalize
    temp_score = min(temp / 45, 1)
    humidity_score = min(humidity / 100, 1)
    veg_score = 1 - vegetation
    density_score = building_density

    # Weighted mix
    risk = (
        0.4 * temp_score +
        0.2 * humidity_score +
        0.2 * veg_score +
        0.2 * density_score
    ) * 100

    return round(risk, 2), heat_index


# -------------------------------
# HEAT INDEX BASED CLASSIFICATION
# -------------------------------
def classify_heat_index(heat_index):
    """
    Human comfort based classification
    """

    if heat_index < 27:
        return "Normal", "green"
    elif heat_index < 32:
        return "Caution", "yellow"
    elif heat_index < 41:
        return "Danger", "orange"
    else:
        return "Extreme", "red"


# -------------------------------
# MAIN FUNCTION
# -------------------------------
def generate_heat_risk(
    temp,
    humidity,
    vegetation,
    building_density=0.5,
    lat=None,
    lon=None
):
    """
    Final unified risk system
    """

    # 🌄 Hill station adjustment
    if lat is not None and lon is not None:
        if is_hill_station(lat, lon):
            temp = temp - 6
            vegetation = min(vegetation + 0.2, 1.0)

    # Calculate base risk
    risk_score, heat_index = calculate_risk_score(
        temp, humidity, vegetation, building_density
    )

    # 🔥 FINAL DECISION BASED ON HEAT INDEX (MOST IMPORTANT)
    level, color = classify_heat_index(heat_index)

    # Optional: adjust score to align with level
    if level == "Normal":
        risk_score = min(risk_score, 30)
    elif level == "Caution":
        risk_score = max(30, min(risk_score, 50))
    elif level == "Danger":
        risk_score = max(50, min(risk_score, 70))
    else:
        risk_score = max(risk_score, 70)

    return {
        "temperature": round(temp, 2),
        "humidity": round(humidity, 2),
        "heat_index": heat_index,
        "vegetation": round(vegetation, 2),
        "risk_score": round(risk_score, 2),
        "risk_level": level,
        "color": color
    }