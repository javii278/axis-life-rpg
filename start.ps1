# Axis — script de arranque
# Ejecutar desde la raíz del proyecto: .\start.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n=== AXIS: The Life RPG ===" -ForegroundColor Magenta
Write-Host "Iniciando backend y frontend...`n" -ForegroundColor Gray

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
  cd '$root'
  Write-Host 'Backend iniciando...' -ForegroundColor Cyan
  python -m uvicorn backend.main:app --reload --port 8000
"@

Start-Sleep -Seconds 2

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
  cd '$root\frontend'
  Write-Host 'Frontend iniciando...' -ForegroundColor Green
  npm run dev
"@

Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "`nAmbas ventanas se abren en terminales separadas.`n" -ForegroundColor Gray
