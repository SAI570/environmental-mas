# Data Directory

This directory stores generated synthetic environmental monitoring datasets used for AI training, validation, and historical export.

## Features Generated
- `temperature`: Degrees Celsius (plausible range: 15°C – 45°C)
- `humidity`: Relative humidity percentage (plausible range: 20% – 95%)
- `smoke`: Normalized particulate/smoke sensor reading (0.00 – 1.00)
- `co2`: Carbon dioxide concentration in parts per million (350 ppm – 2000 ppm)
- `aqi`: Air Quality Index (0 – 500)
- `soil_moisture`: Volumetric soil moisture percentage (5% – 70%)

Data is generated automatically when running:
```powershell
python scripts/train_model.py
```
