$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Import-EnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return }
  foreach ($rawLine in Get-Content $Path) {
    $line = $rawLine.Trim()
    if (-not $line -or $line.StartsWith('#') -or -not $line.Contains('=')) { continue }
    $parts = $line.Split('=', 2)
    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    if ($key) { [Environment]::SetEnvironmentVariable($key, $value, 'Process') }
  }
}

function Set-DefaultEnv {
  param([string]$Name, [string]$Value)
  if (-not [Environment]::GetEnvironmentVariable($Name, 'Process')) {
    [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
  }
}

function Require-Env {
  param([string]$Name)
  if (-not [Environment]::GetEnvironmentVariable($Name, 'Process')) {
    throw "$Name must be set in your environment or .env.local before starting the AI service."
  }
}

Import-EnvFile (Join-Path $Root '.env.local')
Import-EnvFile (Join-Path $Root 'ai-service\.env.local')

Set-DefaultEnv 'NODE_ENV' 'development'
Set-DefaultEnv 'AI_ALLOWED_ORIGINS' 'http://127.0.0.1:3100,http://localhost:3100,http://127.0.0.1:3101'
Require-Env 'AI_INTERNAL_AUTH_TOKEN'

Set-Location (Join-Path $Root 'ai-service')
python -m uvicorn app.main:app --host 127.0.0.1 --port 3102
