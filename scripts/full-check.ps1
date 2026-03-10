<#
Runs the main project validation suite.

This script combines static checks and runtime checks:
- frontend lint and build
- backend TypeScript build
- AI service syntax validation
- local runtime smoke test
#>
param(
  [switch]$InstallDeps,
  [switch]$KeepRunning
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$frontendDir = Join-Path $repoRoot "frontend"
$backendDir = Join-Path $repoRoot "backend"
$aiDir = Join-Path $repoRoot "ai-service"
$localDemoScript = Join-Path $PSScriptRoot "local-demo.ps1"

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

Ensure-Command "node"
Ensure-Command "npm"
Ensure-Command "python"

if ($InstallDeps) {
  Write-Section "Installing dependencies"
  Invoke-Checked "npm install" $frontendDir
  Invoke-Checked "npm install" $backendDir
  Invoke-Checked "python -m pip install -r requirements.txt" $aiDir
}

Write-Section "Static checks"
Invoke-Checked "npm run lint" $frontendDir
Invoke-Checked "npm run build" $frontendDir
Invoke-Checked "npm run build" $backendDir
Invoke-Checked "python -m py_compile app/main.py" $aiDir

Write-Section "Runtime smoke checks"
if (-not (Test-Path $localDemoScript)) {
  throw "Missing script: $localDemoScript"
}
& $localDemoScript -SmokeTest
if ($LASTEXITCODE -ne 0) {
  throw "Runtime smoke checks failed."
}

if (-not $KeepRunning) {
  Write-Section "Stopping services on ports 3000, 3001, 3002"
  Stop-PortProcess -port 3000
  Stop-PortProcess -port 3001
  Stop-PortProcess -port 3002
}

Write-Section "Full check complete"
Write-Host "Frontend build/lint, backend build, AI syntax, and runtime smoke checks passed."
