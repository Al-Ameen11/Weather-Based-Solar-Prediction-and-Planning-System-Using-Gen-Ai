# Weather-Based Solar Energy Prediction and Planning System (No MongoDB)

This project provides a web-based decision support system for rooftop solar planning using:

- **React** dashboard for user inputs and result visualization.
- **Node.js + Express** backend APIs.
- **OpenWeather API** for real-time weather signals.
- **Python Random Forest model** for solar generation signal prediction.
- **Generative AI (Gemini)** for plain-language explanation and guidance.
- **Local JSON storage** (`server/data/predictions.json`) instead of MongoDB.

## Key Flow

1. User submits location and monthly electricity bill.
2. Backend fetches weather from OpenWeather.
3. Backend requests prediction from Python ML service (`/predict`) and computes annual generation + ROI.
4. Backend returns:
   - system sizing,
   - estimated cost and subsidy,
   - annual savings and payback,
   - generation category (High/Medium/Low),
   - appliance recommendations,
   - AI explanation.
5. Backend stores recent prediction history in local JSON.

## Backend Endpoints

- `POST /api/calculate-roi` – main prediction + ROI + AI explanation.
- `GET /api/weather-forecast` – 5-day weather forecast.
- `POST /api/chat` – solar advisory chatbot.
- `GET /api/predictions` – latest predictions (local JSON store).
- `GET /health` – server health status.

## Local Storage (No MongoDB)

Prediction records are persisted at:

- `solar-roi-app/server/data/predictions.json`

This keeps the stack lightweight for demos and local deployments.
