# start-server.ps1
# WVSGH HR Portal Node Server Starter Script

$port = 80

# Check for Admin rights (needed to bind to port 80 on Windows)
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: Please run PowerShell as ADMINISTRATOR." -ForegroundColor Red
    pause
    exit
}

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed or not in the PATH." -ForegroundColor Red
    Write-Host "Please install Node.js (LTS version recommended) from https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "Initializing SQLite Database..." -ForegroundColor Cyan
node init-db.js
Write-Host "----------------------------------------------------" -ForegroundColor Green

Write-Host "Starting WVSGH HR Portal Node Server on Port $port..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host "----------------------------------------------------" -ForegroundColor Green

# Set PORT environment variable for the node process
$env:PORT = $port

# Run Node Server
node server.js
