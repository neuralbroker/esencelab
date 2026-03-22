<#
Validates production deployment configuration.

This script checks that the production compose file can be resolved from the
selected env file and can optionally build images when Docker Engine is ready.
#>
param(
  [string]$EnvFile = ".env.production",
  [switch]$BuildImages,
  [switch]$SkipEnvValidation
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

function Get-EnvMap([string]$path) {
  $values = @{}
  foreach ($line in Get-Content $path) {
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
      $values[$name] = $value
    }
  }
  return $values
}

function Get-EnvValue([hashtable]$values, [string]$name) {
  if ($values.ContainsKey($name)) {
    return [string]$values[$name]
  }
  return ""
}

function Test-PlaceholderValue([string]$value, [string[]]$markers) {
  if (-not $value) {
    return $false
  }

  foreach ($marker in $markers) {
    if ($value -like "*$marker*") {
      return $true
    }
  }

  return $false
}

function Validate-DeploymentEnv([string]$path, [string]$label) {
  $values = Get-EnvMap $path
  $warnings = @()
  $errors = @()
  $isTemplateFile = $label -like "*.example"

  if ($isTemplateFile) {
    $warnings += "Using template env file $label. Replace placeholder secrets and domains before any public deployment."
  }

  $placeholderRules = @(
    @{
      Key = "JWT_SECRET"
      Markers = @("change-this-before-production", "change-this-before-real-use", "your-super-secret-jwt-key-change-in-production")
      Message = "Set JWT_SECRET to a strong unique secret."
    },
    @{
      Key = "FRONTEND_URLS"
      Markers = @("your-frontend-domain.example", "your-frontend-project.vercel.app")
      Message = "Replace FRONTEND_URLS with your real frontend domain(s)."
    },
    @{
      Key = "AI_ALLOWED_ORIGINS"
      Markers = @("your-frontend-domain.example", "your-frontend-project.vercel.app")
      Message = "Replace AI_ALLOWED_ORIGINS with your real frontend domain(s)."
    }
  )

  foreach ($rule in $placeholderRules) {
    $value = Get-EnvValue $values $rule.Key
    if (Test-PlaceholderValue $value $rule.Markers) {
      $message = "$($rule.Key) in $label still uses a placeholder value. $($rule.Message)"
      if ($isTemplateFile) {
        $warnings += $message
      } else {
        $errors += $message
      }
    }
  }

  $provider = (Get-EnvValue $values "DATA_PROVIDER").Trim().ToLowerInvariant()
  if ($provider -and $provider -notin @("memory", "supabase")) {
    $errors += "DATA_PROVIDER in $label must be either memory or supabase."
  }

  if ($provider -eq "supabase") {
    $supabaseUrl = Get-EnvValue $values "SUPABASE_URL"
    if (-not $supabaseUrl -or (Test-PlaceholderValue $supabaseUrl @("your-project.supabase.co"))) {
      $message = "SUPABASE_URL in $label must point to a real Supabase project."
      if ($isTemplateFile) {
        $warnings += $message
      } else {
        $errors += $message
      }
    }

    $serviceRoleKey = Get-EnvValue $values "SUPABASE_SERVICE_ROLE_KEY"
    if (-not $serviceRoleKey) {
      $message = "SUPABASE_SERVICE_ROLE_KEY in $label is required for supabase mode."
      if ($isTemplateFile) {
        $warnings += $message
      } else {
        $errors += $message
      }
    }
  }

  foreach ($warning in $warnings) {
    Write-Warning $warning
  }

  if ($errors.Count -gt 0) {
    throw ("Production env validation failed:`n - " + ($errors -join "`n - "))
  }
}

Ensure-Command "docker"

if (-not (Test-Path $composeFile)) {
  throw "Missing compose file: $composeFile"
}

if (-not (Test-Path $envPath)) {
  throw "Missing env file: $envPath"
}

if (-not $SkipEnvValidation) {
  Write-Section "Validating deployment env"
  Validate-DeploymentEnv -path $envPath -label $EnvFile
  Write-Host "Deployment env validation passed."
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
