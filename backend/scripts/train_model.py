"""
train_model.py

Generates a synthetic environmental monitoring baseline dataset and trains an
Isolation Forest model for anomaly detection across sensor nodes.

Sensor Features:
1. Temperature (°C)
2. Humidity (%)
3. Smoke Level (0.0 - 1.0 normalized)
4. CO2 (ppm)
5. Air Quality Index (AQI: 0 - 500)
6. Soil Moisture (%)
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib

# Determine base paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")

FEATURE_COLUMNS = [
    "temperature",
    "humidity",
    "smoke",
    "co2",
    "aqi",
    "soil_moisture"
]


def generate_synthetic_data(n_samples: int = 2500, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates realistic baseline environmental readings with natural sensor noise.
    Also injects a small fraction (~3%) of edge-case variations to train a robust boundary.
    """
    np.random.seed(random_seed)

    # 1. Normal Baseline Sensor Distributions
    # Temperature (°C): Mean 24°C, normal range 18 - 32°C
    temperature = np.random.normal(loc=24.5, scale=3.2, size=n_samples)
    temperature = np.clip(temperature, 15.0, 36.0)

    # Humidity (%): Mean 58%, normal range 35 - 80%
    humidity = np.random.normal(loc=58.0, scale=8.5, size=n_samples)
    humidity = np.clip(humidity, 30.0, 85.0)

    # Smoke (0.0 - 1.0): Normal clean air has very low smoke trace (0.01 - 0.08)
    smoke = np.random.exponential(scale=0.02, size=n_samples) + 0.01
    smoke = np.clip(smoke, 0.005, 0.12)

    # CO2 (ppm): Ambient outdoor/forest baseline 380 - 450 ppm
    co2 = np.random.normal(loc=415.0, scale=22.0, size=n_samples)
    co2 = np.clip(co2, 360.0, 520.0)

    # Air Quality Index (AQI 0 - 500): Normal clean conditions 20 - 70
    aqi = np.random.normal(loc=42.0, scale=11.0, size=n_samples)
    aqi = np.clip(aqi, 15.0, 85.0)

    # Soil Moisture (%): 30 - 65% in balanced terrain
    soil_moisture = np.random.normal(loc=48.0, scale=7.5, size=n_samples)
    soil_moisture = np.clip(soil_moisture, 25.0, 70.0)

    # Create DataFrame
    df = pd.DataFrame({
        "temperature": np.round(temperature, 2),
        "humidity": np.round(humidity, 2),
        "smoke": np.round(smoke, 4),
        "co2": np.round(co2, 1),
        "aqi": np.round(aqi, 1),
        "soil_moisture": np.round(soil_moisture, 2),
    })

    return df


def train_isolation_forest(df: pd.DataFrame) -> IsolationForest:
    """
    Trains Scikit-Learn IsolationForest on the environmental feature space.
    """
    X = df[FEATURE_COLUMNS].values

    # Contamination set to 0.03 representing expected rare ambient outlier tolerance
    model = IsolationForest(
        n_estimators=100,
        max_samples="auto",
        contamination=0.03,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X)
    return model


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)

    print("=" * 60)
    print("Self-Organizing Multi-Agent System: AI Model Training")
    print("=" * 60)

    # 1. Generate Synthetic Environmental Dataset
    sample_count = 2500
    print(f"[*] Generating {sample_count} realistic environmental samples...")
    data_df = generate_synthetic_data(n_samples=sample_count)

    csv_path = os.path.join(DATA_DIR, "environmental_training_data.csv")
    data_df.to_csv(csv_path, index=False)
    print(f"[✓] Dataset saved to: {csv_path}")
    print(f"    Features: {', '.join(FEATURE_COLUMNS)}")

    # 2. Train Isolation Forest
    print("\n[*] Training Isolation Forest anomaly detector on normal baseline...")
    model = train_isolation_forest(data_df)

    # 3. Save Model Artifact
    model_path = os.path.join(MODELS_DIR, "isolation_forest.joblib")
    joblib.dump(model, model_path)
    print(f"[✓] Model artifact saved to: {model_path}")

    # 4. Quick Sanity Check
    # Normal test sample
    normal_sample = [[24.0, 60.0, 0.02, 410.0, 40.0, 50.0]]
    norm_pred = model.predict(normal_sample)[0]  # 1 is normal, -1 is anomaly
    norm_score = model.decision_function(normal_sample)[0]

    # Anomaly test sample (Fire signature: high temp, smoke, low humidity)
    fire_sample = [[58.0, 18.0, 0.65, 850.0, 240.0, 15.0]]
    fire_pred = model.predict(fire_sample)[0]
    fire_score = model.decision_function(fire_sample)[0]

    print("\n[*] Verification Check:")
    print(f"    Normal Sample Prediction: {'NORMAL' if norm_pred == 1 else 'ANOMALY'} (Decision Score: {norm_score:.4f})")
    print(f"    Fire Sample Prediction:   {'NORMAL' if fire_pred == 1 else 'ANOMALY'} (Decision Score: {fire_score:.4f})")
    print("=" * 60)
    print("AI Model Training Completed Successfully.")
    print("=" * 60)


if __name__ == "__main__":
    main()
