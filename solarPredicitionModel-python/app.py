"""
app.py (Version 2)
------------------
Purpose:
- Serve solar AC power predictions from trained model.

Improvements:
- Supports both old model format (raw estimator) and new model bundle.
- Applies inverse transform when model was trained with log1p target.
- Adds practical input range validation.
- Returns power in watts and kilowatts for clarity.

Endpoint:
- POST /predict

Example JSON input:
{
  "temperature": 36,
  "irradiation": 0.85
}

PowerShell test:
Invoke-RestMethod -Uri "http://127.0.0.1:5000/predict" -Method Post -ContentType "application/json" -Body '{"temperature":36,"irradiation":0.85}'
"""

# Flask web framework.
from flask import Flask, request, jsonify

# Load serialized model.
import joblib

# Build feature dataframe for sklearn inference.
import pandas as pd

# Numeric utilities for inverse transform.
import numpy as np

# Path handling.
from pathlib import Path


app = Flask(__name__)
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "solar_model.pkl"


# Load model artifact on startup.
try:
    loaded_artifact = joblib.load(MODEL_PATH)
except FileNotFoundError as exc:
    raise FileNotFoundError(f"Model file not found: {MODEL_PATH}. Run train.py first.") from exc
except Exception as exc:
    raise RuntimeError(f"Failed to load model: {exc}") from exc


# Support both legacy format (estimator only) and v2 bundle format.
if isinstance(loaded_artifact, dict) and "model" in loaded_artifact:
    model = loaded_artifact["model"]
    feature_columns = loaded_artifact.get("feature_columns", ["AMBIENT_TEMPERATURE", "IRRADIATION"])
    target_transform = loaded_artifact.get("target_transform", None)
else:
    model = loaded_artifact
    feature_columns = ["AMBIENT_TEMPERATURE", "IRRADIATION"]
    target_transform = None


def is_number(value) -> bool:
    """Allow int/float but reject booleans."""
    return isinstance(value, (int, float)) and not isinstance(value, bool)


@app.route("/predict", methods=["POST"])
def predict():
    # Enforce JSON requests.
    if not request.is_json:
        return jsonify({"error": "Request must be JSON with Content-Type: application/json"}), 400

    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "Invalid or empty JSON body"}), 400

    # Validate required fields.
    if "temperature" not in payload:
        return jsonify({"error": "Missing required field: temperature"}), 400
    if "irradiation" not in payload:
        return jsonify({"error": "Missing required field: irradiation"}), 400

    temperature = payload["temperature"]
    irradiation = payload["irradiation"]

    # Validate numeric types.
    if not is_number(temperature):
        return jsonify({"error": "Field 'temperature' must be numeric"}), 400
    if not is_number(irradiation):
        return jsonify({"error": "Field 'irradiation' must be numeric"}), 400

    # Practical bounds to catch obvious bad input.
    if not (-10 <= float(temperature) <= 60):
        return jsonify({"error": "temperature must be between -10 and 60 Celsius"}), 400
    if not (0 <= float(irradiation) <= 1.5):
        return jsonify({"error": "irradiation must be between 0 and 1.5"}), 400

    # Build inference row using training feature schema.
    model_input = pd.DataFrame(
        [[float(temperature), float(irradiation)]],
        columns=feature_columns,
    )

    # Predict from model.
    raw_pred = float(model.predict(model_input)[0])

    # Apply inverse transform if model was trained in log-space.
    if target_transform == "log1p":
        predicted_watts = float(np.expm1(raw_pred))
    else:
        predicted_watts = raw_pred

    # Prevent physically invalid negative power.
    predicted_watts = max(0.0, predicted_watts)

    # Provide both units for easier interpretation.
    return jsonify(
        {
            "predicted_ac_power_watts": round(predicted_watts, 2),
            "predicted_ac_power_kw": round(predicted_watts / 1000.0, 3),
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
