"""
train.py (Version 2)
--------------------
Purpose:
- Train a more stable solar AC power prediction model.

What is improved vs previous version:
- Uses log1p target transformation to reduce large-value volatility.
- Prints both R^2 and MAE for clearer evaluation.
- Saves model bundle with metadata for safer inference in app.py.

Expected input file:
- final_solar_training_dataset.csv (project root)

Expected columns:
- DATE_TIME
- AC_POWER
- AMBIENT_TEMPERATURE
- IRRADIATION

Output artifact:
- solar_model.pkl

Run:
- python train.py
"""

# Pandas is used to load and clean CSV tabular data.
import pandas as pd

# NumPy is used for log/exponential target transformations.
import numpy as np

# joblib is used to persist trained model artifacts.
import joblib

# Pathlib makes file path handling reliable across OSes.
from pathlib import Path

# Split utility for 80/20 train-test split.
from sklearn.model_selection import train_test_split

# RandomForestRegressor is retained for a strong non-linear baseline.
from sklearn.ensemble import RandomForestRegressor

# Metrics for evaluation.
from sklearn.metrics import r2_score, mean_absolute_error


# Fixed input/output file names.
DATASET_FILE = "final_solar_training_dataset.csv"
MODEL_FILE = "solar_model.pkl"

# Expected schema columns.
REQUIRED_COLUMNS = {
    "DATE_TIME",
    "AC_POWER",
    "AMBIENT_TEMPERATURE",
    "IRRADIATION",
}

# Selected features and target.
FEATURE_COLUMNS = ["AMBIENT_TEMPERATURE", "IRRADIATION"]
TARGET_COLUMN = "AC_POWER"


def validate_required_columns(df: pd.DataFrame) -> None:
    """Validate dataset schema before training."""
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required column(s): {sorted(missing)}")


def train_model() -> None:
    """Train model, evaluate, and save bundle."""
    # Resolve file paths relative to script location.
    base_dir = Path(__file__).resolve().parent
    dataset_path = base_dir / DATASET_FILE
    model_path = base_dir / MODEL_FILE

    # Fail fast if dataset is not present.
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {dataset_path}")

    # Load dataset.
    df = pd.read_csv(dataset_path)

    # Validate required schema.
    validate_required_columns(df)

    # Keep only required fields and drop nulls.
    model_df = df[FEATURE_COLUMNS + [TARGET_COLUMN]].dropna().copy()

    if model_df.empty:
        raise ValueError("No valid rows remain after dropping nulls.")

    # Input features.
    X = model_df[FEATURE_COLUMNS]

    # Raw target in watts.
    y_raw = model_df[TARGET_COLUMN].astype(float)

    # Use log1p transform to stabilize high-range regression.
    y_log = np.log1p(y_raw)

    # 80/20 split with fixed seed.
    X_train, X_test, y_train_log, y_test_raw = train_test_split(
        X,
        y_log,
        test_size=0.2,
        random_state=42,
    )

    # Train random forest (100 trees retained for simplicity).
    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42,
    )
    model.fit(X_train, y_train_log)

    # Predict in log space, then map back to watts.
    y_pred_log = model.predict(X_test)
    y_pred_raw = np.expm1(y_pred_log)

    # Guard against tiny negative values due to numeric effects.
    y_pred_raw = np.clip(y_pred_raw, 0.0, None)

    # Evaluate in original watts scale for interpretability.
    r2 = r2_score(y_test_raw, y_pred_raw)
    mae = mean_absolute_error(y_test_raw, y_pred_raw)

    print("Training completed successfully.")
    print(f"Rows used: {len(model_df)}")
    print(f"R-squared (R^2): {r2:.4f}")
    print(f"MAE (watts): {mae:.2f}")

    # Save bundle so app can safely decode transform strategy.
    model_bundle = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "target_transform": "log1p",
        "target_unit": "watts",
        "version": 2,
    }
    joblib.dump(model_bundle, model_path)
    print(f"Model saved to: {model_path}")


if __name__ == "__main__":
    try:
        train_model()
    except Exception as exc:
        print(f"Training failed: {exc}")
        raise
