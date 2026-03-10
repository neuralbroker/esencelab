<#
Runs a fast end-to-end smoke test against a locally running stack.

The checks cover health endpoints, auth, key student flows, recruiter flows,
admin flows, resume upload, and AI matching endpoints.
#>
param(
  [switch]$Json
)

$ErrorActionPreference = "Stop"
$hasFailures = $false
$result = [ordered]@{}

function Step([string]$name, [scriptblock]$action) {
  try {
    $value = & $action
    $result[$name] = [ordered]@{
      ok = $true
      value = $value
    }
  } catch {
    $script:hasFailures = $true
    $result[$name] = [ordered]@{
      ok = $false
      error = $_.Exception.Message
    }
  }
}

function Get-Status([string]$url) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    return [int]$response.StatusCode
  } catch {
    if ($_.Exception.Response) {
      return [int]$_.Exception.Response.StatusCode
    }
    return -1
  }
}

function Get-StableStatus([string]$url, [int]$attempts = 5, [int]$delaySeconds = 1) {
  $status = -1
  for ($i = 0; $i -lt $attempts; $i++) {
    $status = Get-Status $url
    if ($status -eq 200) {
      return $status
    }
    Start-Sleep -Seconds $delaySeconds
  }
  return $status
}

$studentToken = $null
$employerToken = $null
$adminToken = $null
$tempJobId = $null
$tempCourseId = $null
$resumeId = $null
$appId = $null

Step "health_frontend" {
  $status = Get-StableStatus "http://localhost:3000/"
  if ($status -ne 200) {
    throw "Frontend health check failed with HTTP $status"
  }
  $status
}
Step "health_backend" { Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 20 }
Step "health_ai" { Invoke-RestMethod -Uri "http://localhost:3002/health" -Method GET -TimeoutSec 20 }

Step "auth_student" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body (@{ email = "student@esencelab.com"; password = "demo123" } | ConvertTo-Json)
  $script:studentToken = $response.token
  $response.user.role
}

Step "auth_employer" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body (@{ email = "recruiter@esencelab.com"; password = "demo123" } | ConvertTo-Json)
  $script:employerToken = $response.token
  $response.user.role
}

Step "auth_admin" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body (@{ email = "admin@esencelab.com"; password = "demo123" } | ConvertTo-Json)
  $script:adminToken = $response.token
  $response.user.role
}

Step "frontend_routes" {
  $routes = @("/", "/login", "/register", "/dashboard", "/jobs", "/resume", "/applications", "/courses", "/applicants", "/users")
  $map = [ordered]@{}
  foreach ($route in $routes) {
    $status = Get-StableStatus ("http://localhost:3000" + $route)
    if ($status -ne 200) {
      throw "Route $route returned HTTP $status"
    }
    $map[$route] = $status
  }
  $map
}

Step "jobs_list" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/jobs" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  @($response.data.jobs).Count
}

Step "recommendations" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/recommendations" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  @($response.data.PSObject.Properties.Name)
}

Step "career_roles" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/career/roles" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  @($response.data).Count
}

Step "career_overview" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/career/overview" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  @($response.data.PSObject.Properties.Name)
}

Step "career_ai_coach" {
  $body = @{ feature = "skill_gap"; prompt = "Help me prioritize skills for backend role" } | ConvertTo-Json
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/career/ai-coach" -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $studentToken" } -Body $body
  @($response.data.PSObject.Properties.Name)
}

Step "career_roadmap_update" {
  $roadmapResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/career/roadmap" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  $roadmap = @($roadmapResponse.data.roadmap)
  if ($roadmap.Count -eq 0) { throw "No roadmap entries found" }
  $skill = $roadmap[0].skill
  $updateBody = @{ roleId = $roadmapResponse.data.role.id; skillName = $skill; status = "in_progress" } | ConvertTo-Json
  $updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/career/roadmap/skill" -Method PUT -ContentType "application/json" -Headers @{ Authorization = "Bearer $studentToken" } -Body $updateBody
  @($updateResponse.data.roadmap).Count
}

Step "career_learning_plan" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/career/learning-plan?durationDays=30" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  @($response.data.planData.weeks).Count
}

Step "career_mock_interview" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/career/mock-interview" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  @($response.data.technical).Count
}

Step "career_mock_session_save" {
  $body = @{ roleId = "backend_developer"; question = "Sample mock question"; answer = "Sample mock answer"; rating = 4 } | ConvertTo-Json
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/career/mock-interview/session" -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $studentToken" } -Body $body
  $response.data.id
}

Step "create_temp_job" {
  $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $body = @{
    title = "SmokeTest Job $stamp"
    company = "EsenceLab Test"
    location = "Remote"
    description = "Temporary smoke test job"
    requirements = @("Python", "React", "SQL")
    skills = @("Python", "React", "SQL")
    salaryMin = 1200
    salaryMax = 2400
    jobType = "full_time"
  } | ConvertTo-Json

  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/jobs" -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $employerToken" } -Body $body
  $script:tempJobId = $response.data.id
  $script:tempJobId
}

Step "candidate_matches" {
  $response = Invoke-RestMethod -Uri ("http://localhost:3001/api/jobs/{0}/candidate-matches" -f $tempJobId) -Method GET -Headers @{ Authorization = "Bearer $employerToken" }
  @($response.data).Count
}

Step "career_job_tracker_save" {
  $saveResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/career/job-tracker/save" -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $studentToken" } -Body (@{ jobId = $tempJobId } | ConvertTo-Json)
  $trackerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/career/job-tracker" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  if (@($trackerResponse.data.savedJobs).Count -lt 1) {
    throw "Saved jobs missing in tracker response"
  }
  Invoke-RestMethod -Uri ("http://localhost:3001/api/career/job-tracker/save/{0}" -f $tempJobId) -Method DELETE -Headers @{ Authorization = "Bearer $studentToken" } | Out-Null
  $saveResponse.data.id
}

Step "student_apply" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/applications" -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $studentToken" } -Body (@{ jobId = $tempJobId } | ConvertTo-Json)
  $script:appId = $response.data.id
  [ordered]@{
    appId = $script:appId
    status = $response.data.status
    matchScore = $response.data.matchScore
  }
}

Step "employer_update_application_status" {
  $response = Invoke-RestMethod -Uri ("http://localhost:3001/api/applications/{0}/status" -f $appId) -Method PUT -ContentType "application/json" -Headers @{ Authorization = "Bearer $employerToken" } -Body (@{ status = "shortlisted" } | ConvertTo-Json)
  $response.data.status
}

Step "student_my_applications" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/applications/my" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  @($response.data).Count
}

Step "courses_list" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/courses" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  @($response.data).Count
}

Step "admin_course_crud" {
  $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $createBody = @{
    title = "Smoke Course $stamp"
    description = "Temporary smoke test course"
    provider = "EsenceLab"
    url = "https://example.com/course"
    skills = @("Python")
    duration = "2h"
    level = "beginner"
    rating = 4.2
  } | ConvertTo-Json

  $created = Invoke-RestMethod -Uri "http://localhost:3001/api/courses" -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" } -Body $createBody
  $script:tempCourseId = $created.data.id

  $updated = Invoke-RestMethod -Uri ("http://localhost:3001/api/courses/{0}" -f $script:tempCourseId) -Method PUT -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" } -Body (@{ title = "Updated Smoke Course $stamp" } | ConvertTo-Json)
  Invoke-RestMethod -Uri ("http://localhost:3001/api/courses/{0}" -f $script:tempCourseId) -Method DELETE -Headers @{ Authorization = "Bearer $adminToken" } | Out-Null
  $script:tempCourseId = $null
  $updated.data.title
}

Step "admin_users_list" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/users" -Method GET -Headers @{ Authorization = "Bearer $adminToken" }
  @($response.data).Count
}

Step "resume_upload_get_delete" {
  $tmpPdf = Join-Path $env:TEMP "esencelab-smoke.pdf"
  Set-Content -Path $tmpPdf -Value "Fake PDF for smoke test" -Encoding ascii

  $uploadRaw = curl.exe -s -X POST "http://localhost:3001/api/resume/upload" -H "Authorization: Bearer $studentToken" -F "file=@$tmpPdf;type=application/pdf"
  $upload = $uploadRaw | ConvertFrom-Json
  if (-not $upload.data.id) {
    throw "Resume upload failed: $uploadRaw"
  }

  $script:resumeId = $upload.data.id
  $getResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/resume" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  if (-not $getResponse.data.id) {
    throw "Resume get failed"
  }

  Invoke-RestMethod -Uri ("http://localhost:3001/api/resume/{0}" -f $script:resumeId) -Method DELETE -Headers @{ Authorization = "Bearer $studentToken" } | Out-Null
  $script:resumeId = $null
  Remove-Item -Path $tmpPdf -Force -ErrorAction SilentlyContinue
  "ok"
}

Step "dashboard_stats_student" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/dashboard/stats" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
  @($response.data.PSObject.Properties.Name)
}

Step "dashboard_stats_employer" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/dashboard/stats" -Method GET -Headers @{ Authorization = "Bearer $employerToken" }
  @($response.data.PSObject.Properties.Name)
}

Step "dashboard_stats_admin" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/dashboard/stats" -Method GET -Headers @{ Authorization = "Bearer $adminToken" }
  @($response.data.PSObject.Properties.Name)
}

Step "ai_extract_skills" {
  $response = Invoke-RestMethod -Uri "http://localhost:3002/ai/extract-skills" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "text=python react docker"
  @($response.skills).Count
}

Step "ai_match" {
  $body = @{ resumeSkills = @("Python", "React"); jobRequirements = "Need Python React SQL"; includeExplanation = $true } | ConvertTo-Json
  $response = Invoke-RestMethod -Uri "http://localhost:3002/ai/match" -Method POST -ContentType "application/json" -Body $body
  [ordered]@{
    score = $response.matchScore
    matched = @($response.matchedSkills).Count
    missing = @($response.missingSkills).Count
  }
}

# Cleanup best effort
if ($tempJobId) {
  try { Invoke-RestMethod -Uri ("http://localhost:3001/api/jobs/{0}" -f $tempJobId) -Method DELETE -Headers @{ Authorization = "Bearer $employerToken" } | Out-Null } catch {}
}
if ($tempCourseId) {
  try { Invoke-RestMethod -Uri ("http://localhost:3001/api/courses/{0}" -f $tempCourseId) -Method DELETE -Headers @{ Authorization = "Bearer $adminToken" } | Out-Null } catch {}
}
if ($resumeId) {
  try { Invoke-RestMethod -Uri ("http://localhost:3001/api/resume/{0}" -f $resumeId) -Method DELETE -Headers @{ Authorization = "Bearer $studentToken" } | Out-Null } catch {}
}

if ($Json) {
  $result | ConvertTo-Json -Depth 10
} else {
  foreach ($entry in $result.GetEnumerator()) {
    if ($entry.Value.ok) {
      Write-Host "[PASS] $($entry.Key)"
    } else {
      Write-Host "[FAIL] $($entry.Key) -> $($entry.Value.error)"
    }
  }
}

if ($hasFailures) {
  exit 1
}

exit 0

