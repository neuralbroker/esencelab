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
  [switch]$SmokeTest,
  [switch]$SkipEnvValidation
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

function New-RandomSecret([int]$length = 24) {
  $bytes = New-Object byte[] $length
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  $value = [Convert]::ToBase64String($bytes)
  $value = $value.Replace('+', 'A').Replace('/', 'B').Replace('=', '')
  return $value.Substring(0, [Math]::Min($length, $value.Length))
}

function New-DemoIdentity([string]$slug, [string]$displayName) {
  $suffix = [Guid]::NewGuid().ToString('N').Substring(0, 10)
  return @{
    Email = "$slug.$suffix@esencelab.local"
    Password = New-RandomSecret -length 18
    Name = $displayName
  }
}

function Get-EnvMap([string]$path) {
  $values = @{}
  if (-not (Test-Path $path)) {
    return $values
  }

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
  $isExampleFile = $label -like "*.example"

  if ($isExampleFile) {
    $warnings += "Using example env file $label. Replace placeholder secrets and domains before any public deployment."
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
      if ($isExampleFile) {
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
      if ($isExampleFile) {
        $warnings += $message
      } else {
        $errors += $message
      }
    }

    $serviceRoleKey = Get-EnvValue $values "SUPABASE_SERVICE_ROLE_KEY"
    if (-not $serviceRoleKey) {
      $message = "SUPABASE_SERVICE_ROLE_KEY in $label is required for supabase mode."
      if ($isExampleFile) {
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

if (-not (Test-Path $envPath)) {
  throw "Missing env file: $envPath"
}

if (-not $SkipEnvValidation) {
  Write-Section "Validating deployment env"
  Validate-DeploymentEnv -path $envPath -label $EnvFile
  Write-Host "Deployment env validation passed."
}

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
Set-DefaultEnv "ENABLE_DEMO_DATA" "false"
Set-DefaultEnv "ALLOW_INSECURE_PASSWORD_RESET_TOKEN_RESPONSE" "false"
Set-DefaultEnv "SYNC_DEMO_DATA_TO_SUPABASE" "false"
Set-DefaultEnv "FRONTEND_PORT" $frontendPort
Set-DefaultEnv "BACKEND_PORT" $backendPort
Set-DefaultEnv "AI_PORT" $aiPort

if ($SmokeTest -and -not [Environment]::GetEnvironmentVariable("DEMO_STUDENT_EMAIL", "Process")) {
  $studentDemo = New-DemoIdentity -slug "student" -displayName "Demo Student"
  $recruiterDemo = New-DemoIdentity -slug "recruiter" -displayName "Demo Recruiter"
  $adminDemo = New-DemoIdentity -slug "admin" -displayName "Platform Admin"

  [Environment]::SetEnvironmentVariable("ENABLE_DEMO_DATA", "true", "Process")
  [Environment]::SetEnvironmentVariable("ALLOW_INSECURE_PASSWORD_RESET_TOKEN_RESPONSE", "true", "Process")
  [Environment]::SetEnvironmentVariable("DEMO_STUDENT_EMAIL", $studentDemo.Email, "Process")
  [Environment]::SetEnvironmentVariable("DEMO_STUDENT_PASSWORD", $studentDemo.Password, "Process")
  [Environment]::SetEnvironmentVariable("DEMO_STUDENT_NAME", $studentDemo.Name, "Process")
  [Environment]::SetEnvironmentVariable("DEMO_RECRUITER_EMAIL", $recruiterDemo.Email, "Process")
  [Environment]::SetEnvironmentVariable("DEMO_RECRUITER_PASSWORD", $recruiterDemo.Password, "Process")
  [Environment]::SetEnvironmentVariable("DEMO_RECRUITER_NAME", $recruiterDemo.Name, "Process")
  [Environment]::SetEnvironmentVariable("DEMO_ADMIN_EMAIL", $adminDemo.Email, "Process")
  [Environment]::SetEnvironmentVariable("DEMO_ADMIN_PASSWORD", $adminDemo.Password, "Process")
  [Environment]::SetEnvironmentVariable("DEMO_ADMIN_NAME", $adminDemo.Name, "Process")
}

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
  GROQ_REASONING_EFFORT = [Environment]::GetEnvironmentVariable("GROQ_REASONING_EFFORT", "Process")
  GROQ_SERVICE_TIER = [Environment]::GetEnvironmentVariable("GROQ_SERVICE_TIER", "Process")
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
  ENABLE_DEMO_DATA = [Environment]::GetEnvironmentVariable("ENABLE_DEMO_DATA", "Process")
  ALLOW_INSECURE_PASSWORD_RESET_TOKEN_RESPONSE = [Environment]::GetEnvironmentVariable("ALLOW_INSECURE_PASSWORD_RESET_TOKEN_RESPONSE", "Process")
  SYNC_DEMO_DATA_TO_SUPABASE = [Environment]::GetEnvironmentVariable("SYNC_DEMO_DATA_TO_SUPABASE", "Process")
  DEMO_STUDENT_EMAIL = [Environment]::GetEnvironmentVariable("DEMO_STUDENT_EMAIL", "Process")
  DEMO_STUDENT_PASSWORD = [Environment]::GetEnvironmentVariable("DEMO_STUDENT_PASSWORD", "Process")
  DEMO_STUDENT_NAME = [Environment]::GetEnvironmentVariable("DEMO_STUDENT_NAME", "Process")
  DEMO_RECRUITER_EMAIL = [Environment]::GetEnvironmentVariable("DEMO_RECRUITER_EMAIL", "Process")
  DEMO_RECRUITER_PASSWORD = [Environment]::GetEnvironmentVariable("DEMO_RECRUITER_PASSWORD", "Process")
  DEMO_RECRUITER_NAME = [Environment]::GetEnvironmentVariable("DEMO_RECRUITER_NAME", "Process")
  DEMO_ADMIN_EMAIL = [Environment]::GetEnvironmentVariable("DEMO_ADMIN_EMAIL", "Process")
  DEMO_ADMIN_PASSWORD = [Environment]::GetEnvironmentVariable("DEMO_ADMIN_PASSWORD", "Process")
  DEMO_ADMIN_NAME = [Environment]::GetEnvironmentVariable("DEMO_ADMIN_NAME", "Process")
  INITIAL_ADMIN_EMAIL = [Environment]::GetEnvironmentVariable("INITIAL_ADMIN_EMAIL", "Process")
  INITIAL_ADMIN_PASSWORD = [Environment]::GetEnvironmentVariable("INITIAL_ADMIN_PASSWORD", "Process")
  INITIAL_ADMIN_NAME = [Environment]::GetEnvironmentVariable("INITIAL_ADMIN_NAME", "Process")
  INITIAL_RECRUITER_EMAIL = [Environment]::GetEnvironmentVariable("INITIAL_RECRUITER_EMAIL", "Process")
  INITIAL_RECRUITER_PASSWORD = [Environment]::GetEnvironmentVariable("INITIAL_RECRUITER_PASSWORD", "Process")
  INITIAL_RECRUITER_NAME = [Environment]::GetEnvironmentVariable("INITIAL_RECRUITER_NAME", "Process")
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
