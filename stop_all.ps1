# stop_all.ps1 - Gracefully stop both Backend and Frontend servers
Write-Host "==========================================================" -ForegroundColor Red
Write-Host "Stopping Environmental MAS Servers (Ports 8000 & 3000)..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Red

# Find and terminate processes listening on ports 8000 (Backend) and 3000 (Frontend)
$connections = Get-NetTCPConnection -LocalPort 8000, 3000 -ErrorAction SilentlyContinue

if ($connections) {
    foreach ($conn in $connections) {
        $procId = $conn.OwningProcess
        if ($procId -and $procId -ne 0) {
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "[*] Stopping $($proc.ProcessName) (PID: $procId) on port $($conn.LocalPort)..." -ForegroundColor Cyan
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            } catch {
                # Ignore process already stopped
            }
        }
    }
    Write-Host "[✓] All Environmental MAS servers stopped successfully." -ForegroundColor Green
} else {
    Write-Host "[i] No servers currently running on port 8000 or 3000." -ForegroundColor Gray
}
