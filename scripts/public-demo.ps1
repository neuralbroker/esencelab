<#
Opens a public tunnel to the local frontend so the full app can be shared as a live URL.

This script assumes the frontend is running on localhost:3000. Because the Next.js
frontend already proxies backend and AI routes, exposing the frontend port is
enough to make the whole stack reachable through one public URL.

Use this when you need a fast live demo link before setting up permanent hosting.
#>
param(
  [int]$Port = 3000,
  [int]$TimeoutSeconds = 45
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$logPath = Join-Path $repoRoot "public-demo.log"
$pidPath = Join-Path $repoRoot "public-demo.pid"

function Stop-ExistingTunnel {
  if (Test-Path $pidPath) {
    try {
      $existingPid = [int](Get-Content $pidPath -Raw).Trim()
      Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
    } catch {
      # Ignore stale PID files.
    }
    Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
  }
}

function Wait-ForTunnelUrl {
  param(
    [string]$FilePath,
    [int]$TimeoutSec
  )

  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSec) {
    if (Test-Path $FilePath) {
      $content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
      if ($content -match 'https://[^\s]+') {
        return $matches[0]
      }
    }
    Start-Sleep -Seconds 1
  }

  return $null
}

function Wait-ForLocalFrontend {
  param(
    [int]$LocalPort,
    [int]$TimeoutSec
  )

  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSec) {
    try {
      Invoke-WebRequest -Uri "http://localhost:$LocalPort" -UseBasicParsing -TimeoutSec 5 | Out-Null
      return $true
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  return $false
}

if (-not (Wait-ForLocalFrontend -LocalPort $Port -TimeoutSec 60)) {
  throw "Frontend is not reachable on http://localhost:$Port. Start the app first."
}

Stop-ExistingTunnel
Remove-Item $logPath -Force -ErrorAction SilentlyContinue

$command = "npx -y localtunnel --port $Port 2>&1 | Tee-Object -FilePath '$logPath'"
$process = Start-Process -FilePath "powershell.exe" `
  -ArgumentList "-NoProfile", "-Command", $command `
  -WorkingDirectory $repoRoot `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $pidPath -Value $process.Id

$publicUrl = Wait-ForTunnelUrl -FilePath $logPath -TimeoutSec $TimeoutSeconds
if (-not $publicUrl) {
  throw "Public tunnel did not return a URL within $TimeoutSeconds seconds. Check $logPath."
}

Write-Host ""
Write-Host "Public demo URL: $publicUrl"
Write-Host "Tunnel PID     : $($process.Id)"
Write-Host "Log file       : $logPath"
Write-Host ""
Write-Host "Keep this machine and the local app running while the public URL is in use."
