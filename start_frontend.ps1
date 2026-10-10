# start_frontend.ps1 - Start Next.js Operations Console on Windows
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting Next.js Environmental Operations Console" -ForegroundColor Cyan
Write-Host "Console URL: http://localhost:3000" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\frontend"
if (-Not (Test-Path "node_modules")) {
    Write-Host "[*] Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

npm run dev
