$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"
$backendEnv = Join-Path $backendPath ".env"
$frontendEnv = Join-Path $frontendPath ".env"
$concurrentlyPath = Join-Path $root "node_modules\.bin\concurrently.cmd"

function Write-Step($message) {
  Write-Host "==> $message" -ForegroundColor Cyan
}

Write-Step "Starting project from $root"

if (-not (Test-Path $backendEnv)) {
  Write-Warning "File backend/.env was not found."
}

if (-not (Test-Path $frontendEnv)) {
  Write-Warning "File frontend/.env was not found."
}

$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerCommand) {
  try {
    $containerExists = docker ps -a --format "{{.Names}}" | Where-Object { $_ -eq "ndt-postgres" }

    if ($containerExists) {
      Write-Step "Trying to start ndt-postgres"
      docker start ndt-postgres | Out-Null
      Write-Host "PostgreSQL container ndt-postgres is running." -ForegroundColor Green
    } else {
      Write-Warning "Container ndt-postgres was not found. Create it first if your database is not set up yet."
    }
  } catch {
    Write-Warning "Docker was found, but ndt-postgres could not be started. Make sure Docker Desktop is running."
  }
} else {
  Write-Warning "Docker was not found in PATH. If your database runs in Docker, start Docker Desktop and the ndt-postgres container first."
}

Write-Step "Starting backend and frontend in one terminal"
& $concurrentlyPath `
  "--names" "backend,frontend" `
  "--prefix-colors" "cyan,magenta" `
  "--kill-others-on-fail" `
  "cd /d $backendPath && npm run dev" `
  "cd /d $frontendPath && npm run dev"

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "Backend:  http://localhost:4000"
Write-Host "Frontend: http://localhost:5173"
Write-Host ""
Write-Host "If this is your first run after database setup, you may still need:"
Write-Host "  cd backend"
Write-Host "  npm run prisma:push"
Write-Host "  npm run prisma:seed"
