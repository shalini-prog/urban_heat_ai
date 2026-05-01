🌡️ Urban Heat AI Platform

An AI-powered Urban Heat Island Monitoring, Prediction, and Mitigation System designed to analyze heat risk across cities and provide actionable insights, forecasts, and safety recommendations.

📌 Overview

Urban areas experience extreme heat due to:

Dense buildings 🏙️
Low vegetation 🌳
High human activity 🚶

This platform helps:

🔍 Detect heat zones
📊 Predict future heat trends
🗺️ Generate city-wide heatmaps
🧠 Provide smart cooling recommendations
👷 Ensure worker safety

🚀 Key Features

🔥 Heat Risk Detection

Uses temperature, humidity, vegetation, and urban density
Calculates heat index + risk score
Classifies into:
🟢 Normal
🟡 Caution
🟠 Danger
🔴 Extreme

🧠 AI-Based Heat Zone Clustering

Uses KMeans clustering
Identifies:
Normal zones
Warm zones
Heat Islands
Severe Heat Islands

📊 City Heatmap (Parallel Processing ⚡)

Generates heat data for multiple locations
Uses multithreading for high performance
Returns large-scale city insights

📍 Address-Based Heat Detection

Convert address → coordinates (OpenStreetMap)
Generate dense grid around location
Simulate micro heat variations

⏳ Future Heat Forecasting

Predicts:
Tomorrow temperature
Next week trend
Detects:
Increasing heat 📈
Stable conditions ➖
Decreasing heat 📉

🧠 Smart Recommendations Engine

Immediate actions 🚨
Short-term solutions 🏗️
Long-term urban planning 🌱

👷 Worker Safety Module

Safe working hours
Water intake guidance
Work-rest cycles

🏗️ System Architecture

User Request
     ↓
FastAPI Backend
     ↓
Geocoder (Address → Coordinates)
     ↓
Weather API (OpenWeatherMap)
     ↓
Heat Risk Engine (Core Logic)
     ↓
AI Models (KMeans / Prediction)
     ↓
Recommendation Engine
     ↓
JSON Response

⚙️ Tech Stack

Backend: FastAPI
Machine Learning:
KMeans (Clustering)
Random Forest (Prediction)
Data Processing: Pandas, NumPy
API Integration:
OpenWeatherMap
OpenStreetMap (Geocoding)
Parallel Processing: ThreadPoolExecutor

📁 Project Structure

backend/
│
├── routes/
│   ├── heatmap.py
│   ├── prediction.py
│   ├── recommendation.py
│   ├── forecast.py
│   └── address_heat.py
│
├── utils/
│   ├── heat_risk_engine.py
│   ├── weather_fetch.py
│   ├── geocoder.py
│   ├── nearby_grid.py
│   └── worker_safety.py
│
├── models/
│   ├── heat_cluster_model.pkl
│   └── heat_forecast.py
│
├── data/
│   ├── chennai_locations.csv
│   └── new_delhi_locations.csv
│
└── main.py

📡 API Endpoints

🔹 Heatmap (City-Wide)

GET /heatmap?city=chennai

🔹 Address-Based Heat Detection

GET /address_heat?address=Chennai Marina Beach

🔹 Heat Prediction

GET /prediction

🔹 Heat Forecast

GET /forecast?lat=13.08&lon=80.27

🔹 Smart Recommendations

GET /recommendation?temp=40&humidity=70&vegetation=0.2

🧠 Core Logic Highlights

🌡️ Heat Index (NOAA Formula)
Used for real human comfort estimation

📊 Risk Score Calculation
Combines:
Temperature
Humidity
Vegetation
Building Density

🌄 Smart Adjustments
Detects hill stations (Ooty, Kodaikanal)
Automatically reduces temperature impact

📊 Example Output
{
  "temperature": 40,
  "humidity": 70,
  "heat_index": 52,
  "risk_score": 78,
  "risk_level": "Extreme",
  "color": "red"
}

🚀 Setup Instructions

1️⃣ Clone Repository
git clone https://github.com/your-username/urban-heat-ai.git
cd urban-heat-ai/backend

2️⃣ Create Virtual Environment
python -m venv venv
venv\Scripts\activate

3️⃣ Install Dependencies
pip install -r requirements.txt

4️⃣ Add API Key

Update in:

utils/weather_fetch.py
API_KEY = "your_openweathermap_api_key"
5️⃣ Run Server
uvicorn main:app --reload
6️⃣ Open API Docs
http://127.0.0.1:8000/docs

📈 Future Enhancements

📱 Mobile App Integration
🗺️ Interactive Heat Map (Leaflet / Mapbox)
🤖 Deep Learning Models
📡 IoT Sensor Integration
🔔 Real-time Heat Alerts
👨‍💻 Author

Developed as part of an AI-based Urban Heat Intelligence System

📜 License

This project is open-source under the MIT License.

⭐ Support

If you like this project:

⭐ Star the repo
🍴 Fork it
🚀 Contribute
