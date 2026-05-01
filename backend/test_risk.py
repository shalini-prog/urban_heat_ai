from utils.heat_risk_engine import generate_heat_risk

result = generate_heat_risk(
    temp=40,
    humidity=70,
    vegetation=0.2,
    building_density=0.8
)

print(result)