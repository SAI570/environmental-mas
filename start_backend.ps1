# start_backend.ps1 - Start FastAPI Backend on Windows
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Starting FastAPI Multi-Agent System Backend" -ForegroundColor Green
Write-Host "Documentation: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

Set-Location -Path "$PSScriptRoot\backend"
if (-Not (Test-Path "venv")) {
    Write-Host "[*] Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
}

.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

if (-Not (Test-Path "..\models\isolation_forest.joblib")) {
    Write-Host "[*] Training AI Anomaly Detector model..." -ForegroundColor Cyan
    python scripts/train_model.py
}

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
