# Weather-Based Solar Energy Prediction and Planning System

This project provides a web-based decision support platform for both:

- **New users** planning first-time solar installation (sizing + ROI + subsidy + explainability)
- **Existing users** optimizing daily usage (forecasted generation + smart usage alerts + efficiency guidance)

## Stack

- **React (Frontend)** dashboard and chatbot UI
- **Node.js + Express (Backend API)**
- **MongoDB (Data API)** for prediction history persistence (with local JSON fallback)
- **Python ML service** for weather-driven solar generation signal
- **OpenWeather API** for live weather and forecast
- **Gemini API** for plain-language advisory

## Backend Architecture (MVC)

Server code is organized with controller/model/routes separation:

- `server/controllers/*` – request handlers
- `server/models/predictionStore.js` – persistence layer (MongoDB Data API + fallback)
- `server/routes/*` – endpoint routing
- `server/services/*` – business/service integrations (AI, weather, ML, Mongo)
- `server/config/constants.js` – env configuration

## Core User Flows

### 1) New Users (Solar Planning)

1. User enters only **location** + **monthly electricity bill**.
2. System computes recommended solar size (kW).
3. System returns ROI map (cost, subsidy, annual savings, payback years, ROI %).
4. AI advisor explains technical terms in simple language.

### 2) Existing Users (Operational Optimization)

1. Returning users are routed to dashboard using saved profile.
2. System shows saved ROI status and CO₂ savings context.
3. System forecasts tomorrow generation from weather + ML signal.
4. AI-backed smart usage alerts recommend heavy appliance timing.
5. In cloudy/monsoon-like windows, system advises grid-saving mode.

## Key Endpoints

- `POST /api/calculate-roi` – planning flow for new users
- `GET /api/existing-user-dashboard` – operational dashboard for existing users
- `GET /api/weather-forecast` – 5-day forecast + usage alerts
- `GET /api/solar-glossary` – simple educational terms (kW, on-grid, ROI)
- `GET /api/latest-roi-status` – latest saved ROI status
- `POST /api/chat` – AI advisor chat
- `GET /api/predictions` – history records
- `GET /health` – service health + storage mode

## MongoDB Data API Configuration

Set these in server environment:

- `MONGODB_DATA_API_URL`
- `MONGODB_DATA_API_KEY`
- `MONGODB_DATA_SOURCE` (default: `Cluster0`)
- `MONGODB_DATABASE` (default: `solar_roi`)
- `MONGODB_COLLECTION` (default: `predictions`)

If these are not set, app falls back to:

- `solar-roi-app/server/data/predictions.json`

## Abstract Fit & Implementation Checklist

See `PROJECT_CHECKLIST.md`.
