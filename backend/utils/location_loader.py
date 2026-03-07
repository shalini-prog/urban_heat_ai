import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "chennai_locations.csv")

def load_locations():
    df = pd.read_csv(DATA_PATH)
    return df.to_dict(orient="records")