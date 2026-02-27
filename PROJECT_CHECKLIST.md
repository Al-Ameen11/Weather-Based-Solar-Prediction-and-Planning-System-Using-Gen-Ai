# Abstract Alignment Checklist

Use this checklist to align the implementation with the stated abstract for a **Weather-Based Solar Energy Prediction and Decision Support System**.

## 1) Core Product Scope

- [x] Build a web dashboard for non-technical users (simple form + visual output).
- [x] Include weather-driven solar generation prediction flow.
- [x] Include financial decision-support output (cost, savings, ROI/payback).
- [x] Include plain-language AI explanation of results.
- [x] Include appliance usage guidance to improve solar self-consumption.
- [ ] Ensure all abstract claims are implemented exactly as written (not partially).

## 2) Data & Integrations

- [x] Integrate real-time weather API (OpenWeather current weather + forecast).
- [x] Integrate ML inference service for generation signal.
- [x] Add fallback behavior when ML service is unavailable.
- [x] Add fallback behavior when GenAI key/service is unavailable.
- [ ] Validate and normalize user location/state mapping for subsidy logic.
- [ ] Replace demo/default API key placeholders with deployment-ready secret handling.

## 3) ML & Forecasting Quality

- [x] Use weather variables to drive prediction requests (temperature + cloud-derived irradiation).
- [x] Predict generation signal and convert to annual generation estimate.
- [ ] Confirm the annual generation formula is calibrated against realistic local solar yield.
- [ ] Add model performance reporting (MAE/RMSE/R²) in docs and/or dashboard.
- [ ] Add periodic retraining and dataset update plan.

## 4) Financial Decision Support

- [x] Estimate system size from user bill when size is not provided.
- [x] Compute total cost, subsidy, net investment, annual savings, payback, and long-term savings.
- [ ] Add explicit ROI percentage metric (current output emphasizes payback and savings).
- [ ] Use location-specific tariff assumptions instead of fixed heuristic where possible.
- [ ] Separate CAPEX/OPEX assumptions and expose them in UI for transparency.

## 5) Subsidy & Policy Clarity

- [x] Show subsidy percent, amount, and textual guidance.
- [ ] Improve state detection (currently based on input parsing and may misclassify).
- [ ] Add source citation/date for subsidy rules.
- [ ] Add disclaimer that subsidy schemes change over time.

## 6) GenAI Advisor Experience

- [x] Provide AI summary in simple language in results page.
- [x] Provide interactive chatbot endpoint + UI.
- [ ] Add guardrails for financial/legal advice disclaimers.
- [ ] Add multilingual support if targeting broader non-technical audiences.

## 7) Smart Appliance Alerts

- [x] Provide appliance usage recommendations by output category.
- [ ] Implement **alerts/notifications** (push/email/in-app reminders) as stated in abstract.
- [ ] Trigger recommendations using forecast windows (time-of-day suggestions), not only category labels.

## 8) MERN Architecture Fit

- [x] React frontend implemented.
- [x] Node/Express backend implemented.
- [x] MongoDB integrated for prediction history (with local JSON fallback if Mongo env is missing).
- [x] MERN claim can be retained because MongoDB integration is now available.

## 9) UX, Trust & Explainability

- [x] Provide clear KPI cards and breakdown for user trust.
- [x] Provide weather forecast visualization.
- [ ] Add explanation of assumptions used in financial calculations.
- [ ] Add uncertainty/confidence indicator for predictions.
- [ ] Add downloadable report (PDF/CSV) for household decision-making.

## 10) Engineering Readiness

- [x] Include health endpoint.
- [x] Persist recent predictions (local JSON).
- [ ] Add unit/integration tests for core API routes and financial formulas.
- [ ] Add input validation hardening (invalid city names, malformed numeric edge cases).
- [ ] Add production hardening (rate limiting, logging, error observability, env validation).
- [ ] Add CI pipeline for lint/test/build.

---

## Quick Logical Fit Verdict

### Strongly aligned
- Weather-based prediction flow exists.
- Financial decision-support metrics are available.
- GenAI explanation + chatbot are implemented.
- Appliance recommendation guidance is present.
- Interactive dashboard UX is implemented.

### Partially aligned / gaps versus abstract wording
- "MERN" claim is only partial because MongoDB is intentionally removed.
- "ROI" is implied via payback/savings but not surfaced as an explicit ROI % metric.
- "Smart appliance usage alerts" are currently recommendations, not active alerts/notifications.
- Subsidy intelligence is simplified and may not robustly map real user state/policy updates.

## Priority Next Steps (Recommended Order)

1. Decide architecture claim: add MongoDB or revise abstract/project title to match actual stack.
2. Implement explicit ROI % and expose all financial assumptions in UI.
3. Add real alerting for appliance usage based on forecast time windows.
4. Harden subsidy logic with reliable state extraction + policy source/version metadata.
5. Add automated tests for calculation and prediction APIs.
