import numpy as np

def predict_future_heat(temp, humidity, vegetation):
    """
    Smart heat prediction based on environmental conditions
    """

    # 🌡️ Heat factor
    heat_factor = (
    (temp * 0.7) +
    (humidity * 0.2) +
    ((1 - vegetation) * 10)
)

    # 📈 Trend calculation
    if heat_factor > 50:
        trend = "increasing"
        tomorrow = temp + 1.2
        next_week = temp + 3.5

    elif heat_factor > 40:
        trend = "slightly increasing"
        tomorrow = temp + 0.8
        next_week = temp + 2.0

    elif heat_factor > 30:
        trend = "stable"
        tomorrow = temp + 0.3
        next_week = temp + 1.0

    else:
        trend = "decreasing"
        tomorrow = temp - 0.5
        next_week = temp - 1.5

    return {
        "trend": trend,
        "tomorrow_temp": round(tomorrow, 2),
        "next_week_temp": round(next_week, 2),
        "heatwave_alert": True if tomorrow >= 40 or next_week >= 42 else False
    }