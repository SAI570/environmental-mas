# run_tests.ps1 - Automated verification of MAS backend test suite
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Running Environmental MAS Automated Pytest Suite" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\backend"
.\venv\Scripts\Activate.ps1
pytest tests -v
Set-Location -Path "$PSScriptRoot"
