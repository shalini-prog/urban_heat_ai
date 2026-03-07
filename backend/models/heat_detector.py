import pandas as pd
import joblib
import os

# Locate the trained model file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "heat_cluster_model.pkl")

# Load trained model
model = joblib.load(MODEL_PATH)


def detect_heat_zones(df):
    """
    Detect Urban Heat Island zones using trained KMeans model
    """

    # Select features used for clustering
    features = df[["temperature", "humidity", "vegetation"]]

    # Predict cluster
    df["heat_zone"] = model.predict(features)

    # Cluster labels
    zone_labels = {
        0: "Normal",
        1: "Warm",
        2: "Heat Island",
        3: "Severe Heat Island"
    }

    df["zone_label"] = df["heat_zone"].map(zone_labels)

    # Color mapping for visualization
    zone_colors = {
        0: "green",
        1: "yellow",
        2: "orange",
        3: "red"
    }

    df["color"] = df["heat_zone"].map(zone_colors)

    return df