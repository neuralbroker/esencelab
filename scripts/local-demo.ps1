<#
Starts the full stack in local demo mode.

This script uses in-memory data, starts the frontend, backend, and AI service,
and can optionally install dependencies and run the smoke test.
#>
param(
  [switch]$InstallDeps,
  [switch]$SmokeTest
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$frontendDir = Join-Path $repoRoot "frontend"
$backendDir = Join-Path $repoRoot "backend"
$aiDir = Join-Path $repoRoot "ai-service"
$aiEnvPath = Join-Path $aiDir ".env"
$backendEnvPath = Join-Path $backendDir ".env"
$backendEnvExamplePath = Join-Path $backendDir ".env.example"
$smokeScript = Join-Path $PSScriptRoot "local-smoke.ps1"

function Write-Section([string]$message) {
  Write-Host ""
  Write-Host "== $message =="
}

function Ensure-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $name"
  }
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
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
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

function Ensure-BackendEnv {
  if (-not (Test-Path $backendEnvPath)) {
    Copy-Item $backendEnvExamplePath $backendEnvPath
  }

  $content = Get-Content $backendEnvPath -Raw
  if ($content -match "(?m)^DATA_PROVIDER=") {
    $content = [regex]::Replace($content, "(?m)^DATA_PROVIDER=.*$", "DATA_PROVIDER=memory")
  } else {
    $content = $content.TrimEnd() + "`r`nDATA_PROVIDER=memory`r`n"
  }

  if ($content -match "(?m)^AI_SERVICE_URL=") {
    $content = [regex]::Replace($content, "(?m)^AI_SERVICE_URL=.*$", "AI_SERVICE_URL=http://localhost:3002")
  } else {
    $content = $content.TrimEnd() + "`r`nAI_SERVICE_URL=http://localhost:3002`r`n"
  }

  if ($content -match "(?m)^FRONTEND_URL=") {
    $content = [regex]::Replace($content, "(?m)^FRONTEND_URL=.*$", "FRONTEND_URL=http://localhost:3000")
  } else {
    $content = $content.TrimEnd() + "`r`nFRONTEND_URL=http://localhost:3000`r`n"
  }

  Set-Content -Path $backendEnvPath -Value $content
}

function Load-AiEnv {
  if (-not (Test-Path $aiEnvPath)) {
    return
  }

  $lines = Get-Content $aiEnvPath
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

$studentDemo = New-DemoIdentity -slug "student" -displayName "Demo Student"
$recruiterDemo = New-DemoIdentity -slug "recruiter" -displayName "Demo Recruiter"
$adminDemo = New-DemoIdentity -slug "admin" -displayName "Platform Admin"

[Environment]::SetEnvironmentVariable("JWT_SECRET", (New-RandomSecret -length 32), "Process")
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

Ensure-Command "node"
Ensure-Command "npm"
Ensure-Command "python"

if ($InstallDeps) {
  Write-Section "Installing dependencies"
  Invoke-Checked "npm install" $frontendDir
  Invoke-Checked "npm install" $backendDir
  Invoke-Checked "python -m pip install -r requirements.txt" $aiDir
}

Write-Section "Configuring backend for local demo DB"
Ensure-BackendEnv
Load-AiEnv

Write-Section "Stopping existing services on ports 3000, 3001, 3002"
Stop-ProcessByPattern "uvicorn app\.main:app"
Stop-ProcessByPattern "ts-node-dev.+src/index\.ts"
Stop-ProcessByPattern "next dev"
Stop-PortProcess -port 3000
Stop-PortProcess -port 3001
Stop-PortProcess -port 3002
Start-Sleep -Seconds 1

Write-Section "Starting AI service"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "python -m uvicorn app.main:app --host 0.0.0.0 --port 3002" -WorkingDirectory $aiDir -WindowStyle Hidden

Write-Section "Starting backend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WorkingDirectory $backendDir -WindowStyle Hidden

Write-Section "Starting frontend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WorkingDirectory $frontendDir -WindowStyle Hidden

Write-Section "Waiting for services"
$frontendOk = Wait-ForUrl -name "Frontend" -url "http://localhost:3000/"
$backendOk = Wait-ForUrl -name "Backend" -url "http://localhost:3001/api/health"
$aiOk = Wait-ForUrl -name "AI Service" -url "http://localhost:3002/health"

if (-not ($frontendOk -and $backendOk -and $aiOk)) {
  throw "One or more services failed to start."
}

Write-Section "Local demo is ready"
Write-Host "Frontend : http://localhost:3000"
Write-Host "Backend  : http://localhost:3001"
Write-Host "AI       : http://localhost:3002"
Write-Host ""
Write-Host "Generated local credentials:"
Write-Host "  Student  : $($studentDemo.Email) / $($studentDemo.Password)"
Write-Host "  Employer : $($recruiterDemo.Email) / $($recruiterDemo.Password)"
Write-Host "  Admin    : $($adminDemo.Email) / $($adminDemo.Password)"

if ($SmokeTest) {
  if (-not (Test-Path $smokeScript)) {
    throw "Smoke test script not found: $smokeScript"
  }
  Write-Section "Running smoke test"
  powershell -ExecutionPolicy Bypass -File $smokeScript
}
