# Quick PATH Fix for Node.js
Write-Host "Adding Node.js to current PowerShell session..." -ForegroundColor Yellow
$env:Path += ";C:\Program Files\nodejs"

Write-Host "Testing Node.js..." -ForegroundColor Yellow
node --version
npm --version

Write-Host ""
Write-Host "✓ Node.js is now available in this session!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run the setup:" -ForegroundColor Cyan
Write-Host "  .\setup-project.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Or manually:" -ForegroundColor Cyan
Write-Host "  npm install" -ForegroundColor White
Write-Host "  npm run prisma:generate" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  npm run format" -ForegroundColor White
Write-Host "  npm run lint" -ForegroundColor White
Write-Host "  npm run test" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host '  git commit -m "chore: initial project setup"' -ForegroundColor White
Write-Host ""
