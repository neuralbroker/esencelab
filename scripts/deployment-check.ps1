<#
Validates production deployment configuration.

This script checks that the production compose file can be resolved from the
selected env file and can optionally build images when Docker Engine is ready.
#>
param(
  [string]$EnvFile = ".env.production.example",
  [switch]$BuildImages
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$composeFile = Join-Path $repoRoot "docker-compose.production.yml"
$envPath = Join-Path $repoRoot $EnvFile

function Ensure-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $name"
  }
}

function Write-Section([string]$message) {
  Write-Host ""
  Write-Host "== $message =="
}

Ensure-Command "docker"

if (-not (Test-Path $composeFile)) {
  throw "Missing compose file: $composeFile"
}

if (-not (Test-Path $envPath)) {
  throw "Missing env file: $envPath"
}

Write-Section "Validating compose config"
docker compose --env-file $envPath -f $composeFile config | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "docker compose config failed"
}
Write-Host "Compose config is valid."

Write-Section "Checking Docker daemon"
cmd /c "docker info >nul 2>nul"
if ($LASTEXITCODE -ne 0) {
  if ($BuildImages) {
    throw "Docker daemon is not running."
  }
  Write-Host "Docker daemon is not running. Skipping image build validation."
  Write-Section "Deployment check complete"
  exit 0
}
Write-Host "Docker daemon is available."

if ($BuildImages) {
  Write-Section "Building production images"
  docker compose --env-file $envPath -f $composeFile build
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose build failed"
  }
  Write-Host "Production images built successfully."
}

Write-Section "Deployment check complete"
