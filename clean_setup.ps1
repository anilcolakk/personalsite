Write-Host "Stopping any running Node.js processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Cleaning cache and dependencies..."
if (Test-Path node_modules) {
    Remove-Item -Path node_modules -Recurse -Force
}
if (Test-Path .astro) {
    Remove-Item -Path .astro -Recurse -Force
}
if (Test-Path package-lock.json) {
    Remove-Item -Path package-lock.json -Force
}

Write-Host "Installing dependencies..."
npm install

Write-Host "Setup complete! You can now run 'npm run dev'"
