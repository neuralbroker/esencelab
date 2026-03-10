<#
Runs the app directly in production-style mode without Docker.

This script builds the frontend and backend, syntax-checks the AI service,
starts all three services as background processes, and can run the smoke test
against that production-like stack.
#>
param(
  [string]$EnvFile = ".env.production.example",
  [switch]$InstallDeps,
  [switch]$SkipBuild,
  [switch]$SmokeTest
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$frontendDir = Join-Path $repoRoot "frontend"
$backendDir = Join-Path $repoRoot "backend"
$aiDir = Join-Path $repoRoot "ai-service"
$smokeScript = Join-Path $PSScriptRoot "local-smoke.ps1"
$envPath = Join-Path $repoRoot $EnvFile
$frontendPort = [Environment]::GetEnvironmentVariable("FRONTEND_PORT", "Process")
$backendPort = [Environment]::GetEnvironmentVariable("BACKEND_PORT", "Process")
$aiPort = [Environment]::GetEnvironmentVariable("AI_PORT", "Process")

if (-not $frontendPort) { $frontendPort = "3000" }
if (-not $backendPort) { $backendPort = "3001" }
if (-not $aiPort) { $aiPort = "3002" }

function Write-Section([string]$message) {
  Write-Host ""
  Write-Host "== $message =="
}

function Ensure-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $name"
  }
}

function Invoke-Checked([string]$command, [string]$workingDir) {
  Push-Location $workingDir
  try {
    cmd /c $command
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed (exit code $LASTEXITCODE): $command"
    }
  } finally {
    Pop-Location
  }
}

function Stop-PortProcess([int]$port) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($connections) {
    $owners = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($owner in $owners) {
      Stop-Process -Id $owner -Force -ErrorAction SilentlyContinue
    }
  }
}

function Stop-ProcessByPattern([string]$pattern) {
  $processes = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and $_.CommandLine -match $pattern
  }
  foreach ($process in $processes) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }
}

function Wait-ForUrl([string]$name, [string]$url, [int]$timeoutSeconds = 120) {
  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $timeoutSeconds) {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 8
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        Write-Host "$name is up at $url"
        return $true
      }
    } catch {
      if ($_.Exception.Response) {
        $code = [int]$_.Exception.Response.StatusCode
        if ($code -ge 200 -and $code -lt 500) {
          Write-Host "$name is up at $url (HTTP $code)"
          return $true
        }
      }
    }
    Start-Sleep -Seconds 2
  }

  Write-Host "$name failed to start at $url"
  return $false
}

function Load-EnvFile([string]$path) {
  if (-not (Test-Path $path)) {
    return
  }

  $lines = Get-Content $path
  foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) {
      continue
    }
    $parts = $trimmed -split '=', 2
    if ($parts.Count -ne 2) {
      continue
    }
    $name = $parts[0].Trim()
    $value = $parts[1].Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if ($name) {
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
}

function Set-DefaultEnv([string]$name, [string]$value) {
  if (-not [Environment]::GetEnvironmentVariable($name, "Process")) {
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

function Start-DetachedPowerShell([string]$workingDir, [string]$command, [hashtable]$envVars) {
  $assignments = @()
  foreach ($entry in $envVars.GetEnumerator()) {
    $safeValue = [string]$entry.Value
    $safeValue = $safeValue.Replace("'", "''")
    $assignments += "`$env:$($entry.Key)='$safeValue'"
  }
  $scriptBody = ($assignments + $command) -join "; "
  Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile", "-Command", $scriptBody -WorkingDirectory $workingDir -WindowStyle Hidden
}

Ensure-Command "node"
Ensure-Command "npm"
Ensure-Command "python"

Load-EnvFile $envPath

Set-DefaultEnv "NODE_ENV" "production"
Set-DefaultEnv "NEXT_PUBLIC_API_URL" "/api"
Set-DefaultEnv "BACKEND_PROXY_TARGET" "http://localhost:3001"
Set-DefaultEnv "AI_PROXY_TARGET" "http://localhost:3002"
Set-DefaultEnv "AI_ALLOWED_ORIGINS" "http://localhost:3000"
Set-DefaultEnv "FRONTEND_URLS" "http://localhost:3000"
Set-DefaultEnv "FRONTEND_URL" "http://localhost:3000"
Set-DefaultEnv "AI_SERVICE_URL" "http://localhost:3002"
Set-DefaultEnv "DATA_PROVIDER" "memory"
Set-DefaultEnv "FRONTEND_PORT" $frontendPort
Set-DefaultEnv "BACKEND_PORT" $backendPort
Set-DefaultEnv "AI_PORT" $aiPort

if ($InstallDeps) {
  Write-Section "Installing dependencies"
  Invoke-Checked "npm install" $frontendDir
  Invoke-Checked "npm install" $backendDir
  Invoke-Checked "python -m pip install -r requirements.txt" $aiDir
}

if (-not $SkipBuild) {
  Write-Section "Building frontend"
  Invoke-Checked "npm run build" $frontendDir

  Write-Section "Building backend"
  Invoke-Checked "npm run build" $backendDir

  Write-Section "Checking AI service"
  Invoke-Checked "python -m py_compile app/main.py" $aiDir
}

Write-Section "Stopping existing services on ports 3000, 3001, 3002"
Stop-ProcessByPattern "uvicorn app\.main:app"
Stop-ProcessByPattern "node dist/index\.js"
Stop-ProcessByPattern "next start"
Stop-ProcessByPattern "next dev"
Stop-ProcessByPattern "ts-node-dev.+src/index\.ts"
Stop-PortProcess -port 3000
Stop-PortProcess -port 3001
Stop-PortProcess -port 3002
Start-Sleep -Seconds 1

Write-Section "Starting AI service"
Start-DetachedPowerShell -workingDir $aiDir -command "python -m uvicorn app.main:app --host 0.0.0.0 --port $aiPort" -envVars @{
  AI_ALLOWED_ORIGINS = [Environment]::GetEnvironmentVariable("AI_ALLOWED_ORIGINS", "Process")
  GROQ_API_KEY = [Environment]::GetEnvironmentVariable("GROQ_API_KEY", "Process")
  GROQ_MODEL = [Environment]::GetEnvironmentVariable("GROQ_MODEL", "Process")
  STUDENT_ASSISTANT_CACHE_TTL_SEC = [Environment]::GetEnvironmentVariable("STUDENT_ASSISTANT_CACHE_TTL_SEC", "Process")
}

Write-Section "Starting backend"
Start-DetachedPowerShell -workingDir $backendDir -command "npm run start" -envVars @{
  NODE_ENV = "production"
  PORT = $backendPort
  JWT_SECRET = [Environment]::GetEnvironmentVariable("JWT_SECRET", "Process")
  AI_SERVICE_URL = "http://localhost:$aiPort"
  FRONTEND_URL = "http://localhost:$frontendPort"
  FRONTEND_URLS = [Environment]::GetEnvironmentVariable("FRONTEND_URLS", "Process")
  TRUST_PROXY = [Environment]::GetEnvironmentVariable("TRUST_PROXY", "Process")
  DATA_PROVIDER = [Environment]::GetEnvironmentVariable("DATA_PROVIDER", "Process")
  SUPABASE_URL = [Environment]::GetEnvironmentVariable("SUPABASE_URL", "Process")
  SUPABASE_ANON_KEY = [Environment]::GetEnvironmentVariable("SUPABASE_ANON_KEY", "Process")
  SUPABASE_SERVICE_ROLE_KEY = [Environment]::GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY", "Process")
}

Write-Section "Starting frontend"
Start-DetachedPowerShell -workingDir $frontendDir -command "npm run start" -envVars @{
  NODE_ENV = "production"
  PORT = $frontendPort
  NEXT_PUBLIC_API_URL = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_API_URL", "Process")
  BACKEND_PROXY_TARGET = [Environment]::GetEnvironmentVariable("BACKEND_PROXY_TARGET", "Process")
  AI_PROXY_TARGET = [Environment]::GetEnvironmentVariable("AI_PROXY_TARGET", "Process")
}

Write-Section "Waiting for services"
$frontendOk = Wait-ForUrl -name "Frontend" -url "http://localhost:$frontendPort/"
$backendOk = Wait-ForUrl -name "Backend" -url "http://localhost:$backendPort/api/health"
$aiOk = Wait-ForUrl -name "AI Service" -url "http://localhost:$aiPort/health"

if (-not ($frontendOk -and $backendOk -and $aiOk)) {
  throw "One or more production services failed to start."
}

Write-Section "Direct deployment is ready"
Write-Host "Frontend : http://localhost:$frontendPort"
Write-Host "Backend  : http://localhost:$backendPort"
Write-Host "AI       : http://localhost:$aiPort"

if ($SmokeTest) {
  if (-not (Test-Path $smokeScript)) {
    throw "Smoke test script not found: $smokeScript"
  }
  Write-Section "Running smoke test"
  powershell -ExecutionPolicy Bypass -File $smokeScript
  if ($LASTEXITCODE -ne 0) {
    throw "Smoke test failed."
  }
}
