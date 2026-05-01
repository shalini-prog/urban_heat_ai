def get_work_schedule(risk_level):
    """
    Suggest safe working hours based on risk level
    """

    if risk_level == "Extreme":
        return {
            "allowed": False,
            "message": "Avoid outdoor work between 10 AM – 5 PM",
            "safe_hours": ["5:30 AM – 10 AM", "5 PM – 8 PM"]
        }

    elif risk_level == "Danger":
        return {
            "allowed": True,
            "message": "Limit outdoor work during peak heat",
            "safe_hours": ["6 AM – 11 AM", "4 PM – 7 PM"]
        }

    elif risk_level == "Caution":
        return {
            "allowed": True,
            "message": "Moderate heat, take precautions",
            "safe_hours": ["6 AM – 12 PM", "3 PM – 7 PM"]
        }

    else:
        return {
            "allowed": True,
            "message": "Safe conditions",
            "safe_hours": ["Any time"]
        }


def get_water_intake(heat_index):
    """
    Estimate water intake per hour (litres)
    """

    if heat_index >= 50:
        return "1.0 – 1.5 L/hour"
    elif heat_index >= 40:
        return "0.7 – 1.0 L/hour"
    elif heat_index >= 30:
        return "0.5 – 0.7 L/hour"
    else:
        return "0.3 – 0.5 L/hour"


def get_rest_cycle(risk_level):
    """
    Work-rest ratio
    """

    if risk_level == "Extreme":
        return "20 min work / 40 min rest"
    elif risk_level == "Danger":
        return "30 min work / 30 min rest"
    elif risk_level == "Caution":
        return "45 min work / 15 min rest"
    else:
        return "Normal schedule"


def generate_worker_safety(risk_data):
    """
    Main function to generate worker safety plan
    """

    risk_level = risk_data["risk_level"]
    heat_index = risk_data["heat_index"]

    return {
        "work_schedule": get_work_schedule(risk_level),
        "water_intake": get_water_intake(heat_index),
        "rest_cycle": get_rest_cycle(risk_level),
        "warning": "High risk of heatstroke" if risk_level in ["Extreme", "Danger"] else "Normal conditions"
    }