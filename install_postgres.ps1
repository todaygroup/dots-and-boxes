# PostgreSQL 17 Installation Script

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Dots and Boxes - PostgreSQL Installer" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check for existing installation
$installPath = "C:\Program Files\PostgreSQL\17"
if (Test-Path $installPath) {
    Write-Host "⚠️  PostgreSQL 17 appears to be already installed at $installPath" -ForegroundColor Yellow
    $response = Read-Host "Do you want to continue and re-configure? (y/n)"
    if ($response -ne 'y') {
        exit
    }
}

# 2. Install PostgreSQL 17 via Winget
Write-Host "`n🚀 Starting PostgreSQL 17 installation..." -ForegroundColor Green
Write-Host "The installer window will open. Please follow these steps:" -ForegroundColor White
Write-Host "1. Click 'Next' on welcome screens" -ForegroundColor Gray
Write-Host "2. Set Password to: password (simple for development)" -ForegroundColor Yellow
Write-Host "3. Keep Port as: 5432" -ForegroundColor Gray
Write-Host "4. Leave Locale as Default" -ForegroundColor Gray
Write-Host "5. Click 'Next' until installation starts" -ForegroundColor Gray

# Run winget interactively
winget install PostgreSQL.PostgreSQL.17 --interactive

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Installation failed or was cancelled." -ForegroundColor Red
    Write-Host "Please try installing manually from: https://www.postgresql.org/download/windows/"
    exit
}

# 3. Update .env file
Write-Host "`n📝 Configuring application environment..." -ForegroundColor Green
$envPath = "apps\api\.env"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    $newDbUrl = 'DATABASE_URL="postgresql://postgres:password@localhost:5432/dots_and_boxes"'
    
    # Update DATABASE_URL
    $envContent = $envContent | ForEach-Object {
        if ($_ -match "^DATABASE_URL=") {
            $newDbUrl
        } else {
            $_
        }
    }
    
    $envContent | Set-Content $envPath
    Write-Host "✅ Updated .env with new credentials" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found at $envPath" -ForegroundColor Yellow
}

Write-Host "`n🎉 Setup Complete!" -ForegroundColor Cyan
Write-Host "Please restart your terminal and run: npm run start:dev" -ForegroundColor White
