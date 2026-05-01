from fastapi import APIRouter
import math

router = APIRouter()


def generate_smart_recommendations(
    temp,
    humidity,
    vegetation,
    building_density,
    risk_level,
    risk_score
):
    """
    Generate actionable recommendations based on heat risk
    """

    recommendations = {
        "immediate_actions": [],
        "short_term": [],
        "long_term": []
    }

    # 🌡️ Temperature reduction target
    target_temp = 30
    reduction_needed = max(temp - target_temp, 0)

    # 🌳 Environmental calculations
    trees_needed = math.ceil(reduction_needed / 0.1) if reduction_needed > 0 else 0
    cool_roofs_needed = math.ceil(reduction_needed / 0.5) if reduction_needed > 0 else 0
    water_units = math.ceil(reduction_needed / 1.5) if reduction_needed > 0 else 0

    # 🔴 EXTREME RISK
    if risk_level == "Extreme":
        recommendations["immediate_actions"].extend([
            "🚫 Stop outdoor work from 10 AM – 5 PM",
            "🏥 Activate emergency cooling centers",
            "🚰 Ensure continuous drinking water supply",
            "⚠️ Issue public heat alerts"
        ])

        recommendations["short_term"].extend([
            f"🏠 Install ~{cool_roofs_needed} cool roofs in nearby buildings",
            f"🌳 Plant ~{trees_needed} trees in this locality",
            f"💧 Add ~{water_units} water bodies/fountains"
        ])

        recommendations["long_term"].extend([
            "🏙️ Redesign urban layout to reduce heat trapping",
            "🌿 Increase green cover to at least 30%",
            "🧱 Use reflective materials in roads and buildings"
        ])

    # 🟠 DANGER
    elif risk_level == "Danger":
        recommendations["immediate_actions"].extend([
            "⚠️ Limit outdoor work during peak heat",
            "💧 Encourage hydration breaks every 30 minutes"
        ])

        recommendations["short_term"].extend([
            f"🏠 Install ~{cool_roofs_needed} cool roofs",
            f"🌳 Plant ~{trees_needed} trees"
        ])

        recommendations["long_term"].extend([
            "🌿 Increase vegetation cover",
            "🏗️ Reduce concrete density in future projects"
        ])

    # 🟡 CAUTION
    elif risk_level == "Caution":
        recommendations["immediate_actions"].append(
            "🌤️ Monitor heat conditions and stay hydrated"
        )

        recommendations["short_term"].append(
            "🌳 Increase roadside plantation"
        )

        recommendations["long_term"].append(
            "🌿 Maintain green zones"
        )

    # 🟢 NORMAL
    else:
        recommendations["immediate_actions"].append(
            "✅ Conditions are safe"
        )

        recommendations["long_term"].append(
            "🌿 Preserve existing environment"
        )

    return recommendations


@router.get("/")
def recommendation(
    temp: float,
    humidity: float,
    vegetation: float,
    building_density: float = 0.5,
    risk_level: str = "Normal",
    risk_score: float = 0
):
    """
    Smart AI-based heat mitigation recommendations
    """

    recs = generate_smart_recommendations(
        temp,
        humidity,
        vegetation,
        building_density,
        risk_level,
        risk_score
    )

    return {
        "status": "success",
        "risk_level": risk_level,
        "risk_score": risk_score,
        "recommendations": recs
    }