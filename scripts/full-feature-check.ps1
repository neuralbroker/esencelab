<#
Runs a wider feature-validation pass than the normal smoke test.

This script checks additional routes and flows that are important for team
confidence, including admin moderation, password reset, recruiter analytics,
and detailed candidate/application paths.
#>
param()

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

function Login([string]$email, [string]$password) {
  Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body (@{
      email = $email
      password = $password
    } | ConvertTo-Json)
}

$student = Login "student@esencelab.com" "demo123"
$recruiter = Login "recruiter@esencelab.com" "demo123"
$admin = Login "admin@esencelab.com" "demo123"

$studentHeaders = @{ Authorization = "Bearer $($student.token)" }
$recruiterHeaders = @{ Authorization = "Bearer $($recruiter.token)" }
$adminHeaders = @{ Authorization = "Bearer $($admin.token)" }

$tempEmail = "autocheck.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.com"
$tempPassword = "temp1234"
$tempPassword2 = "temp5678"
$tempUser = $null
$tempStudentHeaders = $null
$tempJobId = $null
$tempApplicationId = $null
$tempCourseId = $null
$tempResumeId = $null

Step "frontend_jobs_new_route" {
  $res = Invoke-WebRequest -Uri "http://localhost:3000/jobs/new" -UseBasicParsing -TimeoutSec 15
  if ($res.StatusCode -ne 200) {
    throw "Expected HTTP 200, got $($res.StatusCode)"
  }
  $res.StatusCode
}

Step "frontend_admin_resumes_route" {
  $res = Invoke-WebRequest -Uri "http://localhost:3000/admin/resumes" -UseBasicParsing -TimeoutSec 15
  if ($res.StatusCode -ne 200) {
    throw "Expected HTTP 200, got $($res.StatusCode)"
  }
  $res.StatusCode
}

Step "auth_me_student" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -Method GET -Headers $studentHeaders
  $response.user.role
}

Step "auth_register_temp_student" {
  $registered = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method POST -ContentType "application/json" -Body (@{
      email = $tempEmail
      password = $tempPassword
      name = "Auto Check"
      role = "student"
    } | ConvertTo-Json)
  $script:tempUser = $registered.user
  $script:tempStudentHeaders = @{ Authorization = "Bearer $($registered.token)" }
  $registered.user.email
}

Step "auth_profile_update_temp" {
  $updated = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/profile" -Method PUT -Headers $tempStudentHeaders -ContentType "application/json" -Body (@{
      name = "Auto Check Updated"
      avatarUrl = "https://example.com/avatar.png"
    } | ConvertTo-Json)
  if ($updated.user.name -ne "Auto Check Updated") {
    throw "Profile update did not persist"
  }
  $updated.user.name
}

Step "auth_password_change_temp" {
  Invoke-RestMethod -Uri "http://localhost:3001/api/auth/password" -Method PUT -Headers $tempStudentHeaders -ContentType "application/json" -Body (@{
      currentPassword = $tempPassword
      newPassword = $tempPassword2
    } | ConvertTo-Json) | Out-Null
  $login = Login $tempEmail $tempPassword2
  $script:tempStudentHeaders = @{ Authorization = "Bearer $($login.token)" }
  $login.user.email
}

Step "auth_password_reset_temp" {
  $forgot = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/password/forgot" -Method POST -ContentType "application/json" -Body (@{
      email = $tempEmail
    } | ConvertTo-Json)
  if (-not $forgot.resetToken) {
    throw "Reset token was not returned"
  }
  Invoke-RestMethod -Uri "http://localhost:3001/api/auth/password/reset" -Method POST -ContentType "application/json" -Body (@{
      token = $forgot.resetToken
      newPassword = $tempPassword
    } | ConvertTo-Json) | Out-Null
  $login = Login $tempEmail $tempPassword
  $script:tempStudentHeaders = @{ Authorization = "Bearer $($login.token)" }
  "reset-ok"
}

Step "auth_logout_temp" {
  Invoke-RestMethod -Uri "http://localhost:3001/api/auth/logout" -Method POST -Headers $tempStudentHeaders | Out-Null
  try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -Method GET -Headers $tempStudentHeaders | Out-Null
    throw "Revoked token still allowed access"
  } catch {
    if (-not $_.Exception.Response) {
      throw
    }
    $status = [int]$_.Exception.Response.StatusCode
    if ($status -ne 401) {
      throw "Expected HTTP 401 after logout, got $status"
    }
  }
  $login = Login $tempEmail $tempPassword
  $script:tempStudentHeaders = @{ Authorization = "Bearer $($login.token)" }
  "revoked"
}

Step "admin_user_detail_update_deactivate_reactivate" {
  $detail = Invoke-RestMethod -Uri ("http://localhost:3001/api/users/{0}" -f $tempUser.id) -Method GET -Headers $adminHeaders
  if ($detail.data.email -ne $tempEmail) {
    throw "Admin user detail returned wrong record"
  }
  $updated = Invoke-RestMethod -Uri ("http://localhost:3001/api/users/{0}" -f $tempUser.id) -Method PUT -Headers $adminHeaders -ContentType "application/json" -Body (@{
      name = "Admin Updated Name"
      isActive = $false
    } | ConvertTo-Json)
  if ($updated.data.isActive -ne $false) {
    throw "Deactivate failed"
  }
  $reactivated = Invoke-RestMethod -Uri ("http://localhost:3001/api/users/{0}" -f $tempUser.id) -Method PUT -Headers $adminHeaders -ContentType "application/json" -Body (@{
      isActive = $true
    } | ConvertTo-Json)
  if ($reactivated.data.isActive -ne $true) {
    throw "Reactivate failed"
  }
  $reactivated.data.name
}

Step "student_target_role_update" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/career/target-role" -Method POST -Headers $studentHeaders -ContentType "application/json" -Body (@{
      roleId = "frontend_developer"
    } | ConvertTo-Json)
  $response.data.roleId
}

Step "student_learning_plan_regenerate" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/career/learning-plan" -Method POST -Headers $studentHeaders -ContentType "application/json" -Body (@{
      roleId = "frontend_developer"
      durationDays = 60
    } | ConvertTo-Json)
  @($response.data.planData.weeks).Count
}

Step "student_mock_session_list" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/career/mock-interview/sessions" -Method GET -Headers $studentHeaders
  @($response.data).Count
}

Step "recruiter_create_update_get_analytics" {
  $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $created = Invoke-RestMethod -Uri "http://localhost:3001/api/jobs" -Method POST -Headers $recruiterHeaders -ContentType "application/json" -Body (@{
      title = "ExtraCheck Job $stamp"
      company = "Esencelab"
      location = "Remote"
      description = "Extra coverage job"
      requirements = @("Python", "SQL")
      skills = @("Python", "SQL")
      salaryMin = 1000
      salaryMax = 2000
      jobType = "full_time"
    } | ConvertTo-Json)
  $script:tempJobId = $created.data.id

  $detail = Invoke-RestMethod -Uri ("http://localhost:3001/api/jobs/{0}" -f $tempJobId) -Method GET -Headers $recruiterHeaders
  if ($detail.data.id -ne $tempJobId) {
    throw "Job detail lookup failed"
  }

  $updated = Invoke-RestMethod -Uri ("http://localhost:3001/api/jobs/{0}" -f $tempJobId) -Method PUT -Headers $recruiterHeaders -ContentType "application/json" -Body (@{
      title = "Updated ExtraCheck Job $stamp"
      company = "Esencelab"
      location = "Remote"
      description = "Updated description"
      requirements = @("Python", "SQL", "Docker")
      skills = @("Python", "SQL", "Docker")
      salaryMin = 1200
      salaryMax = 2200
      jobType = "full_time"
      status = "active"
    } | ConvertTo-Json)

  $analytics = Invoke-RestMethod -Uri ("http://localhost:3001/api/recruiter/jobs/{0}/analytics" -f $tempJobId) -Method GET -Headers $recruiterHeaders
  if ($updated.data.title -notlike "Updated ExtraCheck Job*") {
    throw "Job update failed"
  }
  if ($analytics.data.jobId -ne $tempJobId) {
    throw "Recruiter analytics did not match temp job"
  }
  $updated.data.title
}

Step "recruiter_overview" {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/api/recruiter/overview" -Method GET -Headers $recruiterHeaders
  @($response.data.PSObject.Properties.Name).Count
}

Step "recruiter_applications_and_candidates" {
  $apps = Invoke-RestMethod -Uri "http://localhost:3001/api/applications" -Method GET -Headers $recruiterHeaders
  $candidates = Invoke-RestMethod -Uri "http://localhost:3001/api/candidates" -Method GET -Headers $recruiterHeaders
  if (@($candidates.data).Count -lt 1) {
    throw "No candidates returned"
  }
  $candidateId = @($candidates.data)[0].id
  $detail = Invoke-RestMethod -Uri ("http://localhost:3001/api/candidates/{0}?jobId={1}" -f $candidateId, $tempJobId) -Method GET -Headers $recruiterHeaders
  "apps=$(@($apps.data).Count); candidates=$(@($candidates.data).Count); detail=$($detail.data.id)"
}

Step "recruiter_candidate_create_update" {
  $created = Invoke-RestMethod -Uri "http://localhost:3001/api/candidates" -Method POST -Headers $recruiterHeaders -ContentType "application/json" -Body (@{
      userId = $tempUser.id
      name = "Temp Candidate"
      email = $tempEmail
      skills = "[]"
      education = "[]"
      experience = "[]"
    } | ConvertTo-Json)
  $updated = Invoke-RestMethod -Uri ("http://localhost:3001/api/candidates/{0}" -f $created.data.id) -Method PUT -Headers $recruiterHeaders -ContentType "application/json" -Body (@{
      status = "reviewed"
    } | ConvertTo-Json)
  $updated.data.status
}

Step "student_apply_update_tracker_delete" {
  $created = Invoke-RestMethod -Uri "http://localhost:3001/api/applications" -Method POST -Headers $studentHeaders -ContentType "application/json" -Body (@{
      jobId = $tempJobId
      notes = "extra coverage apply"
    } | ConvertTo-Json)
  $script:tempApplicationId = $created.data.id
  $updated = Invoke-RestMethod -Uri ("http://localhost:3001/api/career/job-tracker/application/{0}" -f $tempApplicationId) -Method PUT -Headers $studentHeaders -ContentType "application/json" -Body (@{
      status = "interviewing"
      notes = "tracker update ok"
    } | ConvertTo-Json)
  if ($updated.data.trackerStatus -ne "interviewing") {
    throw "Tracker status did not update"
  }
  Invoke-RestMethod -Uri ("http://localhost:3001/api/career/job-tracker/application/{0}" -f $tempApplicationId) -Method DELETE -Headers $studentHeaders | Out-Null
  $script:tempApplicationId = $null
  "deleted"
}

Step "courses_detail" {
  $courses = Invoke-RestMethod -Uri "http://localhost:3001/api/courses" -Method GET -Headers $studentHeaders
  $courseId = @($courses.data)[0].id
  $detail = Invoke-RestMethod -Uri ("http://localhost:3001/api/courses/{0}" -f $courseId) -Method GET -Headers $studentHeaders
  $detail.data.id
}

Step "admin_application_summary_logs_monitoring" {
  $summary = Invoke-RestMethod -Uri "http://localhost:3001/api/admin/applications/summary" -Method GET -Headers $adminHeaders
  $logs = Invoke-RestMethod -Uri "http://localhost:3001/api/admin/logs" -Method GET -Headers $adminHeaders
  $monitoring = Invoke-RestMethod -Uri "http://localhost:3001/api/admin/monitoring" -Method GET -Headers $adminHeaders
  "summary=$($summary.data.totalApplications); logs=$(@($logs.data).Count); users=$($monitoring.data.totalUsers)"
}

Step "temp_student_resume_upload_admin_moderation_delete" {
  $tmpPdf = Join-Path $env:TEMP "esencelab-extra-check.pdf"
  Set-Content -Path $tmpPdf -Value "Fake PDF for extra check" -Encoding ascii
  $bearer = $tempStudentHeaders.Authorization
  $uploadRaw = curl.exe -s -X POST "http://localhost:3001/api/resume/upload" -H "Authorization: $bearer" -F "file=@$tmpPdf;type=application/pdf"
  $upload = $uploadRaw | ConvertFrom-Json
  if (-not $upload.data.id) {
    throw "Resume upload failed: $uploadRaw"
  }
  $script:tempResumeId = $upload.data.id
  $list = Invoke-RestMethod -Uri "http://localhost:3001/api/admin/resumes" -Method GET -Headers $adminHeaders
  $detail = Invoke-RestMethod -Uri ("http://localhost:3001/api/admin/resumes/{0}" -f $tempResumeId) -Method GET -Headers $adminHeaders
  $moderated = Invoke-RestMethod -Uri ("http://localhost:3001/api/admin/resumes/{0}/moderation" -f $tempResumeId) -Method PUT -Headers $adminHeaders -ContentType "application/json" -Body (@{
      status = "flagged"
      notes = "extra coverage moderation"
    } | ConvertTo-Json)
  if ($moderated.data.moderationStatus -ne "flagged") {
    throw "Resume moderation did not update"
  }
  Invoke-RestMethod -Uri ("http://localhost:3001/api/admin/resumes/{0}" -f $tempResumeId) -Method DELETE -Headers $adminHeaders | Out-Null
  $script:tempResumeId = $null
  Remove-Item -Path $tmpPdf -Force -ErrorAction SilentlyContinue
  "resumes=$(@($list.data).Count); detail=$($detail.data.id)"
}

Step "admin_create_delete_course" {
  $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $created = Invoke-RestMethod -Uri "http://localhost:3001/api/courses" -Method POST -Headers $adminHeaders -ContentType "application/json" -Body (@{
      title = "Extra Course $stamp"
      description = "extra check"
      provider = "Esencelab"
      url = "https://example.com"
      skills = @("Python")
      duration = "1h"
      level = "beginner"
      rating = 4.5
    } | ConvertTo-Json)
  $script:tempCourseId = $created.data.id
  Invoke-RestMethod -Uri ("http://localhost:3001/api/courses/{0}" -f $tempCourseId) -Method DELETE -Headers $adminHeaders | Out-Null
  $script:tempCourseId = $null
  "created-deleted"
}

Step "admin_delete_temp_user" {
  $response = Invoke-RestMethod -Uri ("http://localhost:3001/api/users/{0}" -f $tempUser.id) -Method DELETE -Headers $adminHeaders
  $response.message
}

if ($tempApplicationId) {
  try {
    Invoke-RestMethod -Uri ("http://localhost:3001/api/career/job-tracker/application/{0}" -f $tempApplicationId) -Method DELETE -Headers $studentHeaders | Out-Null
  } catch {}
}

if ($tempJobId) {
  try {
    Invoke-RestMethod -Uri ("http://localhost:3001/api/jobs/{0}" -f $tempJobId) -Method DELETE -Headers $recruiterHeaders | Out-Null
  } catch {}
}

if ($tempCourseId) {
  try {
    Invoke-RestMethod -Uri ("http://localhost:3001/api/courses/{0}" -f $tempCourseId) -Method DELETE -Headers $adminHeaders | Out-Null
  } catch {}
}

if ($tempResumeId) {
  try {
    Invoke-RestMethod -Uri ("http://localhost:3001/api/admin/resumes/{0}" -f $tempResumeId) -Method DELETE -Headers $adminHeaders | Out-Null
  } catch {}
}

if ($tempUser) {
  try {
    Invoke-RestMethod -Uri ("http://localhost:3001/api/users/{0}?soft=true" -f $tempUser.id) -Method DELETE -Headers $adminHeaders | Out-Null
  } catch {}
}

foreach ($entry in $result.GetEnumerator()) {
  if ($entry.Value.ok) {
    Write-Host "[PASS] $($entry.Key)"
  } else {
    Write-Host "[FAIL] $($entry.Key) -> $($entry.Value.error)"
  }
}

if ($hasFailures) {
  exit 1
}

exit 0
