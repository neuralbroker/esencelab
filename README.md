# Esencelab

Esencelab is a full-stack AI-assisted hiring and career intelligence platform built around three role-based experiences:

- Students upload resumes, measure readiness, identify skill gaps, follow learning plans, and track applications.
- Recruiters post jobs, rank candidates by fit, and review structured resume insights instead of screening manually.
- Admins monitor users, resumes, applications, moderation flows, and platform health from a single control surface.

The project is split into a Next.js frontend, an Express API, and a FastAPI AI service. For local development, the platform can run entirely in `memory` mode with seeded demo users and no external database dependency.

## Product Scope

### Student module

- Authentication, protected dashboard access, and profile management
- Resume upload, parsing, and structured profile extraction
- Resume strength scoring and career readiness overview
- Skill-gap analysis against target roles
- Job recommendations and job match visibility
- Skill roadmap tracking
- 30-day and 60-day learning plan generation
- Mock interview questions and saved practice sessions
- Saved jobs, application tracking, and progress history
- Optional AI career coach backed by Groq with local fallback guidance

### Recruiter module

- Recruiter login and protected recruiter flows
- Job posting, editing, deletion, and listing
- Candidate ranking by match score
- Candidate match breakdowns for each job
- Applicant views and recruiter analytics endpoints
- Faster shortlisting workflow through structured candidate summaries

### Admin module

- Admin-only authentication and route protection
- User management
- Resume monitoring and moderation actions
- Course management
- Application summaries
- System monitoring and audit log endpoints
- Platform-level dashboard statistics

## Architecture

```text
Next.js frontend (frontend)
    ->
Express API (backend)
    ->
FastAPI AI service (ai-service)
    ->
Memory store for local demo OR Supabase/Postgres for persistence
```

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide React |
| Backend | Node.js, Express, TypeScript, JWT, bcrypt, multer, compression, helmet, rate limiting |
| AI service | FastAPI, Python, pdfplumber, PyPDF2 |
| Data | In-memory seeded store for local demo, optional Supabase integration |
| Tooling | PowerShell run scripts, npm, TypeScript compiler, ESLint |

## Repository Layout

```text
Esencelab/
|- frontend/              # Next.js app
|- backend/               # Express API and data-provider layer
|- ai-service/            # FastAPI AI and resume processing service
|- docs/                  # Build specs and implementation plans
|- scripts/               # Local run, smoke-test, and full-check scripts
|- supabase-schema.sql    # Schema for persistent mode
|- supabase-seed.sql      # Optional seed data
|- SPEC.md                # Product and system specification
```

## Quick Start

### Prerequisites

- Node.js 18+ with `npm`
- Python 3.11+ with `pip`
- PowerShell on Windows

The bundled scripts are optimized for Windows PowerShell. The fastest path for local evaluation is the one-command demo flow below.

### One-command local run

Install dependencies, start all services, and run the smoke test:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local-demo.ps1 -InstallDeps -SmokeTest
```

Run again without reinstalling dependencies:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local-demo.ps1 -SmokeTest
```

### Local URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/api`
- AI service: `http://localhost:3002`

### Demo accounts

- Student: `student@esencelab.com` / `demo123`
- Recruiter: `recruiter@esencelab.com` / `demo123`
- Admin: `admin@esencelab.com` / `demo123`

## Manual Development Setup

### 1. Install dependencies

```powershell
cd .\frontend
npm install
```

```powershell
cd .\backend
npm install
```

```powershell
cd .\ai-service
python -m pip install -r requirements.txt
```

### 2. Configure backend environment

Use the example file as the base:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
```

For the default local workflow, keep these values:

```env
PORT=3001
AI_SERVICE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3000
DATA_PROVIDER=memory
```

### 3. Start each service

Frontend:

```powershell
cd .\frontend
npm run dev
```

Backend:

```powershell
cd .\backend
npm run dev
```

AI service:

```powershell
cd .\ai-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 3002
```

## Environment Variables

### Backend

Use [backend/.env.example](C:/Dev/Projects/Esencelab/backend/.env.example) as the starting point.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | API port, defaults to `3001` |
| `JWT_SECRET` | Yes for non-demo use | JWT signing secret |
| `AI_SERVICE_URL` | No | FastAPI base URL |
| `FRONTEND_URL` | No | Allowed frontend origin |
| `DATA_PROVIDER` | Yes | `memory` for local demo, `supabase` for persistent mode |
| `SUPABASE_URL` | Only for Supabase mode | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Only for Supabase mode | Server-side Supabase key |
| `SUPABASE_ANON_KEY` | Optional fallback | Alternate Supabase key input |
| `SLOW_ENDPOINT_THRESHOLD_MS` | No | Monitoring threshold for slow requests |

### AI service

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Optional | Enables the student AI coach using Groq |
| `GROQ_MODEL` | Optional | Groq model name, defaults to `llama-3.1-8b-instant` |
| `STUDENT_ASSISTANT_CACHE_TTL_SEC` | Optional | Cache TTL for assistant responses |

Example PowerShell session variables:

```powershell
$env:GROQ_API_KEY="your_groq_api_key"
$env:GROQ_MODEL="llama-3.1-8b-instant"
```

If `GROQ_API_KEY` is not set, the AI coach falls back to local guidance logic instead of external completions.

## Data Provider Modes

### Memory mode

`memory` mode is the default for local work. It provides:

- Seeded student, recruiter, and admin accounts
- Seeded jobs, recommendations, and dashboard data
- No dependency on a running external database
- Fast startup for testing and presentations

### Supabase mode

Use Supabase when you want persisted data across runs.

Required changes:

1. Set `DATA_PROVIDER=supabase` in `backend/.env`.
2. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Apply [supabase-schema.sql](C:/Dev/Projects/Esencelab/supabase-schema.sql).
4. Optionally load [supabase-seed.sql](C:/Dev/Projects/Esencelab/supabase-seed.sql).

## Validation and Testing

### Smoke test

Starts from already-running services and verifies the core flows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local-smoke.ps1
```

The smoke suite covers:

- Frontend, backend, and AI health checks
- Student, recruiter, and admin authentication
- Frontend route availability
- Recommendations, career overview, roadmap, learning plan, and mock interview APIs
- Recruiter job creation and candidate matching
- Student application flow
- Admin course and user management flows
- Resume upload, retrieval, and deletion
- Dashboard stats and AI skill extraction endpoints

### Full readiness check

Runs static checks and runtime checks together:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\full-check.ps1
```

Install dependencies as part of the run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\full-check.ps1 -InstallDeps
```

Keep services running after the checks:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\full-check.ps1 -KeepRunning
```

`full-check.ps1` currently validates:

- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `backend`: `npm run build`
- `ai-service`: Python syntax compile
- End-to-end runtime smoke tests

## API Overview

The backend currently exposes grouped endpoints for:

- Auth: register, login, me, logout, profile update, password reset flow
- Users: admin listing, lookup, update, deactivate/delete
- Resume: upload, fetch current student resume, delete resume
- Admin resume moderation: list, inspect, moderate, remove
- Jobs: list, detail, create, update, delete
- Applications: create, list, my applications, recruiter status updates
- Recommendations: student recommendation feed
- Career engine: roles, target role, overview, roadmap, AI coach, learning plans, mock interview, saved jobs, application tracker
- Recruiter analytics: recruiter overview, candidate matches, job analytics
- Courses: list plus admin CRUD
- Admin monitoring: dashboard stats, application summary, monitoring, audit logs
- Health: API health endpoint

The main API implementation lives in [backend/src/index.ts](C:/Dev/Projects/Esencelab/backend/src/index.ts).

## Frontend Surface

The frontend includes:

- Public landing page
- Login and registration
- Shared dashboard shell
- Student dashboard, resume, applications, courses, interview, and jobs pages
- Recruiter applicants and job details pages
- Admin resume review page

The frontend app router lives under [frontend/src/app](C:/Dev/Projects/Esencelab/frontend/src/app).

## Documentation

- [MASTER_BUILD_SPEC.md](C:/Dev/Projects/Esencelab/docs/MASTER_BUILD_SPEC.md)
- [CHUNKED_IMPLEMENTATION_PLAN.md](C:/Dev/Projects/Esencelab/docs/CHUNKED_IMPLEMENTATION_PLAN.md)
- [STUDENT_AI_MODEL_PLAN.md](C:/Dev/Projects/Esencelab/docs/STUDENT_AI_MODEL_PLAN.md)
- [SPEC.md](C:/Dev/Projects/Esencelab/SPEC.md)

## Operational Notes

- The local demo scripts automatically configure the backend for `memory` mode.
- The AI service is required for resume parsing and match-related flows.
- JWT secrets and external API keys should be set through environment variables and never committed.
- PowerShell scripts stop and restart ports `3000`, `3001`, and `3002` to keep the local stack predictable.

## Team

- Abdulla Sajad - backend development, database implementation, system architecture
- Harikrishnan K - frontend development, UI design
- Adwaith PC - documentation, system design support, presentation planning
- Jishnu MR - testing, validation, research support

## License

No license file is currently included in this repository.
