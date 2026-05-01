import pandas as pd
from sklearn.cluster import KMeans
import joblib

data = pd.read_csv("../backend/data/sample_city_temperature.csv")

features = data[["temperature","humidity","vegetation"]]

model = KMeans(n_clusters=4)

model.fit(features)

joblib.dump(model,"heat_cluster_model.pkl")

print("Model trained and saved")