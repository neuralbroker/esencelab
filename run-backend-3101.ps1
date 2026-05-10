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
    throw "$Name must be set in your environment or .env.local before starting the backend."
  }
}

Import-EnvFile (Join-Path $Root '.env.local')
Import-EnvFile (Join-Path $Root 'backend\.env.local')

Set-DefaultEnv 'PORT' '3101'
Set-DefaultEnv 'NODE_ENV' 'development'
Set-DefaultEnv 'AI_SERVICE_URL' 'http://127.0.0.1:3102'
Set-DefaultEnv 'FRONTEND_URL' 'http://127.0.0.1:3100'
Set-DefaultEnv 'FRONTEND_URLS' 'http://127.0.0.1:3100,http://localhost:3100'
Set-DefaultEnv 'DATA_PROVIDER' 'supabase'

Require-Env 'JWT_SECRET'
Require-Env 'AI_INTERNAL_AUTH_TOKEN'
Require-Env 'SUPABASE_URL'
Require-Env 'SUPABASE_SERVICE_ROLE_KEY'

Set-Location (Join-Path $Root 'backend')
npm run dev
