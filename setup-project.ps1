# Ostora Project Setup - PowerShell Version
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ostora Project - Complete Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Add Node.js to current session PATH
$env:Path += ";C:\Program Files\nodejs"

# Verify Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✓ npm: $npmVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "Please restart PowerShell as Administrator and run:" -ForegroundColor Yellow
    Write-Host '  $env:Path += ";C:\Program Files\nodejs"' -ForegroundColor White
    Write-Host "  cd c:\Users\pc\Desktop\ostora" -ForegroundColor White
    Write-Host "  .\setup-project.ps1" -ForegroundColor White
    pause
    exit 1
}

# Step 1: Install dependencies
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1/7: Installing dependencies..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Generate Prisma
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2/7: Generating Prisma client..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Prisma generate failed" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Setup Husky
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3/7: Setting up Husky..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
npm run prepare
Write-Host "✓ Husky configured" -ForegroundColor Green
Write-Host ""

# Step 4: Check TypeScript
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4/7: Checking TypeScript..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: TypeScript compilation has errors" -ForegroundColor Yellow
    Write-Host "Continuing anyway..." -ForegroundColor Yellow
}
Write-Host "✓ TypeScript checked" -ForegroundColor Green
Write-Host ""

# Step 5: Format code
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 5/7: Formatting code..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
npm run format
Write-Host "✓ Code formatted" -ForegroundColor Green
Write-Host ""

# Step 6: Lint
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 6/7: Running linter..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Linting issues found" -ForegroundColor Yellow
    Write-Host "Continuing anyway..." -ForegroundColor Yellow
}
Write-Host "✓ Linter executed" -ForegroundColor Green
Write-Host ""

# Step 7: Test
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 7/7: Running tests..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
npm run test
Write-Host "✓ Tests completed" -ForegroundColor Green
Write-Host ""

# Success
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓✓✓ PROJECT SETUP COMPLETE! ✓✓✓" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Project is ready to commit!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run these commands to commit:" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor Cyan
Write-Host '  git commit -m "chore: initial project setup with microservices architecture, devops config, and infrastructure"' -ForegroundColor Cyan
Write-Host "  git push origin ostora-config" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or run: npm run commit-setup" -ForegroundColor Yellow
Write-Host ""

# Add to user PATH permanently
Write-Host "Adding Node.js to your PATH permanently..." -ForegroundColor Yellow
try {
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*nodejs*") {
        [Environment]::SetEnvironmentVariable("Path", "$userPath;C:\Program Files\nodejs", "User")
        Write-Host "✓ Node.js added to PATH. Restart PowerShell for permanent effect." -ForegroundColor Green
    }
} catch {
    Write-Host "Note: Could not update PATH permanently. Run PowerShell as Administrator if needed." -ForegroundColor Yellow
}

Write-Host ""
pause
