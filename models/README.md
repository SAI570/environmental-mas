# Models Directory

This directory stores trained machine learning models for anomaly detection.

## Artifacts
- `isolation_forest.joblib`: Scikit-Learn `IsolationForest` model trained on synthetic normal environmental baseline readings with standard variations.
- `scaler.joblib` or metadata configuration: Parameter profiles used for normalization if applicable.

## Generation
Generate the model locally by running:
```powershell
# From backend directory
python scripts/train_model.py
```
This ensures zero external download dependencies.
