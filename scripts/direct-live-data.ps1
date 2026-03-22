<#
Runs direct deployment with persistent Supabase-backed data.

This is a safety wrapper around direct-deploy.ps1. It validates that the env
file is really configured for Supabase before starting the stack.
#>
param(
  [string]$EnvFile = ".env.live-data",
  [switch]$InstallDeps,
  [switch]$SkipBuild,
  [switch]$SmokeTest
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $repoRoot $EnvFile

if (-not (Test-Path $envPath)) {
  throw "Missing env file: $envPath"
}

$content = Get-Content $envPath -Raw
if ($content -notmatch "(?m)^DATA_PROVIDER=supabase\s*$") {
  throw "DATA_PROVIDER must be set to supabase in $EnvFile"
}
if ($content -match "(?m)^SUPABASE_URL=https://your-project\.supabase\.co\s*$") {
  throw "Replace SUPABASE_URL in $EnvFile before running live-data mode."
}
if ($content -match "(?m)^SUPABASE_SERVICE_ROLE_KEY=\s*$") {
  throw "Set SUPABASE_SERVICE_ROLE_KEY in $EnvFile before running live-data mode."
}

$scriptPath = Join-Path $PSScriptRoot "direct-deploy.ps1"
$arguments = @(
  "-ExecutionPolicy", "Bypass",
  "-File", $scriptPath,
  "-EnvFile", $EnvFile
)

if ($InstallDeps) { $arguments += "-InstallDeps" }
if ($SkipBuild) { $arguments += "-SkipBuild" }
if ($SmokeTest) { $arguments += "-SmokeTest" }

powershell @arguments
exit $LASTEXITCODE
