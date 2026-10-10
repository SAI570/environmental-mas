"""
anomaly_detector.py

Reusable Anomaly Detection Module using Scikit-Learn Isolation Forest.
Detects whether multivariate sensor readings deviate from normal baseline behavior.
"""

import os
import joblib
import numpy as np
from typing import Dict, Any, List, Optional

# Expected feature keys in consistent order
FEATURE_KEYS = [
    "temperature",
    "humidity",
    "smoke",
    "co2",
    "aqi",
    "soil_moisture"
]


class AnomalyDetector:
    """
    Wraps the trained Isolation Forest model for evaluating agent sensor readings.
    """

    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            # Resolve relative to backend/app/core
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
            model_path = os.path.join(base_dir, "models", "isolation_forest.joblib")

        self.model_path = model_path
        self.model = None
        self._load_model()

    def _load_model(self) -> None:
        """
        Loads the pre-trained Isolation Forest model from disk.
        """
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
            except Exception as e:
                print(f"[AnomalyDetector] Warning: Could not load model from {self.model_path}: {e}")
                self.model = None
        else:
            self.model = None

    def is_model_loaded(self) -> bool:
        return self.model is not None

    def validate_reading(self, reading: Dict[str, Any]) -> List[float]:
        """
        Validates presence and numeric type of all 6 required environmental features.
        Returns ordered float vector: [temp, humidity, smoke, co2, aqi, soil_moisture]
        """
        vector = []
        for key in FEATURE_KEYS:
            if key not in reading:
                raise ValueError(f"Missing required sensor feature: '{key}'")
            try:
                val = float(reading[key])
                vector.append(val)
            except (ValueError, TypeError):
                raise ValueError(f"Sensor feature '{key}' must be numeric, got: {reading[key]}")
        return vector

    def detect(self, reading: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs anomaly detection on a single agent's environmental sensor reading.

        Returns:
            {
                "is_anomaly": bool,
                "decision": "ANOMALY" | "NORMAL",
                "raw_decision_score": float,  # IsolationForest decision_function value
                "anomaly_score": float,       # Normalized 0.0 to 1.0 (higher = more anomalous)
                "features_analyzed": dict
            }
        """
        features = self.validate_reading(reading)

        if self.model is None:
            # Try reloading once in case trained dynamically
            self._load_model()

        if self.model is None:
            # Fallback heuristic if model file hasn't been generated yet
            # Allows initial startup sanity check while guiding to run train_model.py
            temp, hum, smoke, co2, aqi, soil = features
            heuristic_anomaly = (
                temp > 40.0 or temp < 10.0 or
                smoke > 0.15 or
                co2 > 750.0 or
                aqi > 130.0 or
                hum < 25.0
            )
            score = 0.85 if heuristic_anomaly else 0.15
            return {
                "is_anomaly": heuristic_anomaly,
                "decision": "ANOMALY" if heuristic_anomaly else "NORMAL",
                "raw_decision_score": -0.1 if heuristic_anomaly else 0.1,
                "anomaly_score": score,
                "features_analyzed": dict(zip(FEATURE_KEYS, features)),
                "model_status": "heuristic_fallback (run train_model.py to load ML model)"
            }

        # Model is loaded: run scikit-learn IsolationForest
        X = [features]
        pred = self.model.predict(X)[0]  # 1 for normal, -1 for anomaly
        decision_val = float(self.model.decision_function(X)[0])

        is_anomaly = bool(pred == -1)

        # Normalize decision function to [0.0, 1.0] severity score
        # For IsolationForest, decision_function returns ~ +0.15 for typical normal,
        # 0.0 at the boundary, and negative values (-0.25) for strong anomalies.
        # Logistic-style sigmoid transformation: 1 / (1 + exp(15 * decision_val))
        # gives close to 0 for positive decision_val (normal) and close to 1 for negative (anomaly).
        normalized_score = float(1.0 / (1.0 + np.exp(12.0 * decision_val)))
        normalized_score = round(float(np.clip(normalized_score, 0.0, 1.0)), 4)

        return {
            "is_anomaly": is_anomaly,
            "decision": "ANOMALY" if is_anomaly else "NORMAL",
            "raw_decision_score": round(float(decision_val), 4),
            "anomaly_score": normalized_score,
            "features_analyzed": dict(zip(FEATURE_KEYS, [float(f) for f in features])),
            "model_status": "isolation_forest_ml"
        }
