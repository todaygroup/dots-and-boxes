# fix_frontend.ps1
Write-Host "🔧 Fixing Frontend Issues..." -ForegroundColor Cyan

# 1. Kill process on Port 3000
Write-Host "1. Checking Port 3000..." -ForegroundColor Yellow
$p = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($p) { 
    Write-Host "   Killing process $($p.OwningProcess) on port 3000..." -ForegroundColor Red
    Stop-Process -Id $p.OwningProcess -Force
} else { 
    Write-Host "   Port 3000 is free." -ForegroundColor Green
}

# 2. Clean Cache and node_modules
Write-Host "2. Cleaning Frontend Cache & Dependencies..." -ForegroundColor Yellow
cd apps\web
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue

# 3. Reinstall Dependencies
Write-Host "3. Reinstalling Dependencies..." -ForegroundColor Yellow
npm install --force

# 4. Start Dev Server
Write-Host "4. Starting Server..." -ForegroundColor Green
npm run dev
