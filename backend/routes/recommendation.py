from fastapi import APIRouter
import math

router = APIRouter()


def generate_recommendations(temp, humidity, vegetation, zone):

    recommendations = []

    # Temperature difference to reduce
    target_temp = 35
    reduction_needed = max(temp - target_temp, 0)

    # Tree calculation
    # Rough assumption: 1 mature tree cools ~0.1°C locally
    trees_needed = math.ceil(reduction_needed / 0.1)

    # Cool roofs
    # Each cool roof reduces ~0.5°C
    cool_roofs = math.ceil(reduction_needed / 0.5)

    # Water bodies
    water_bodies = math.ceil(reduction_needed / 1.5)

    if zone == "Severe Heat Island":

        recommendations.append(f"🌳 Plant approximately {trees_needed} trees")
        recommendations.append(f"🏠 Install {cool_roofs} cool roofs")
        recommendations.append(f"💧 Add {water_bodies} urban water bodies")
        recommendations.append("🧱 Apply reflective road materials")

    elif zone == "Heat Island":

        recommendations.append(f"🌳 Plant approximately {trees_needed} trees")
        recommendations.append(f"🏠 Install {cool_roofs} cool roofs")
        recommendations.append("🌿 Increase green parks and vegetation")

    elif zone == "Warm":

        recommendations.append("🌳 Increase roadside tree plantation")
        recommendations.append("🌿 Improve urban green cover")

    else:

        recommendations.append("🌿 Maintain vegetation levels")
        recommendations.append("🌱 Preserve existing green areas")

    return recommendations


@router.get("/")
def recommendation(temp: float, humidity: float, vegetation: float, zone: str):

    recs = generate_recommendations(temp, humidity, vegetation, zone)

    return {
        "temperature": temp,
        "zone": zone,
        "recommendations": recs
    }