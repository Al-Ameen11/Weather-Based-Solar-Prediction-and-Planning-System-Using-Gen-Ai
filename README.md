# Weather-Based Solar Energy Prediction and Planning System

This project provides a web-based decision support system for rooftop solar planning using:

- **React** dashboard for user inputs and result visualization.
- **Node.js + Express** backend APIs.
- **OpenWeather API** for real-time weather signals.
- **Python Random Forest model** for solar generation signal prediction.
- **Generative AI (Gemini)** for plain-language explanation and guidance.
- **MongoDB integration** via MongoDB Data API for prediction history storage.

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
5. Backend stores recent prediction history in MongoDB (with local JSON fallback when MongoDB env is not configured).

## Backend Endpoints

- `POST /api/calculate-roi` – main prediction + ROI + AI explanation.
- `GET /api/weather-forecast` – 5-day weather forecast.
- `POST /api/chat` – solar advisory chatbot.
- `GET /api/predictions` – latest predictions from MongoDB (or fallback local JSON).
- `GET /health` – server health status.

## MongoDB Storage

Prediction records are stored using **MongoDB Data API** when these environment variables are configured on the server:

- `MONGODB_DATA_API_URL`
- `MONGODB_DATA_API_KEY`
- `MONGODB_DATA_SOURCE` (default: `Cluster0`)
- `MONGODB_DATABASE` (default: `solar_roi`)
- `MONGODB_COLLECTION` (default: `predictions`)

If MongoDB Data API variables are not set, the server automatically falls back to local JSON storage at:

- `solar-roi-app/server/data/predictions.json`

## Abstract Fit & Implementation Checklist

For a structured implementation checklist and gap analysis against the project abstract, see:

- `PROJECT_CHECKLIST.md`
