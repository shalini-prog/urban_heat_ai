import numpy as np
from sklearn.ensemble import RandomForestRegressor

# Example trained model placeholder
model = RandomForestRegressor(n_estimators=200)


def predict_future_heat(temp, humidity, vegetation):

    # Simple feature vector
    features = np.array([[temp, humidity, vegetation]])

    # For demo, simulate prediction
    tomorrow = temp + np.random.uniform(0.3, 1.5)
    next_week = temp + np.random.uniform(1.5, 3.0)

    return {
        "tomorrow_temp": round(tomorrow, 2),
        "next_week_temp": round(next_week, 2)
    }