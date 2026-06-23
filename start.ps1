<#
.SYNOPSIS
    Starts the yuloStores server (Fastify, :3000) and client (Vite, :5173).

.DESCRIPTION
    Installs npm dependencies if missing, warns if the server .env is absent,
    then launches each app in its own PowerShell window so you see separate logs.

.PARAMETER NoInstall
    Skip the dependency-install check (use when node_modules are known-good).

.EXAMPLE
    .\start.ps1
    .\start.ps1 -NoInstall
#>
param(
    [switch]$NoInstall
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$server = Join-Path $root "server"
$client = Join-Path $root "client"

function Ensure-Deps($path, $name) {
    if ($NoInstall) { return }
    if (-not (Test-Path (Join-Path $path "node_modules"))) {
        Write-Host "Installing $name dependencies..." -ForegroundColor Cyan
        Push-Location $path
        npm install
        Pop-Location
    }
}

# Sanity checks
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is not installed or not on PATH."
}

if (-not (Test-Path (Join-Path $server ".env"))) {
    Write-Host "WARNING: server\.env not found. The server needs a MongoDB connection string (dotenv) and will fail to connect without it." -ForegroundColor Yellow
}

Ensure-Deps $server "server"
Ensure-Deps $client "client"

# Launch each app in its own window
Write-Host "Starting server (http://localhost:3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$server'; Write-Host 'yuloStores SERVER :3000' -ForegroundColor Green; npm start"
)

Write-Host "Starting client (http://localhost:5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$client'; Write-Host 'yuloStores CLIENT :5173' -ForegroundColor Green; npm run dev"
)

Write-Host ""
Write-Host "Both processes launched in separate windows." -ForegroundColor Cyan
Write-Host "  Server: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Client: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Close those windows (or Ctrl+C in each) to stop." -ForegroundColor Cyan
