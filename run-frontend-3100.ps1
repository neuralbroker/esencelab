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

Import-EnvFile (Join-Path $Root '.env.local')
Import-EnvFile (Join-Path $Root 'frontend\.env.local')

Set-DefaultEnv 'PORT' '3100'
Set-DefaultEnv 'NEXT_PUBLIC_API_URL' 'http://127.0.0.1:3101/api'

Set-Location (Join-Path $Root 'frontend')
npm run dev -- --hostname 127.0.0.1 --port 3100
