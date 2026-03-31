# Esencelab

Esencelab is a full-stack AI-assisted hiring and career intelligence platform built around three role-based experiences:

- Students upload resumes, measure readiness, identify skill gaps, follow learning plans, and track applications.
- Recruiters post jobs, rank candidates by fit, and review structured resume insights instead of screening manually.
- Admins monitor users, resumes, applications, moderation flows, and platform health from a single control surface.

The project is split into a Next.js frontend, an Express API, and a FastAPI AI service, with Supabase/Postgres used for persistent production data.

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
Supabase/Postgres persistence
```

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide React |
| Backend | Node.js, Express, TypeScript, JWT, bcryptjs, multer, compression, helmet, rate limiting |
| AI service | FastAPI, Python, pdfplumber, pypdf |
| Data | Supabase/Postgres persistence with local in-memory runtime state |
| Tooling | PowerShell run scripts, npm, TypeScript compiler, ESLint |

## Repository Layout

```text
Esencelab/
|- frontend/              # Next.js app
|- backend/               # Express API and data-provider layer
|- ai-service/            # FastAPI AI and resume processing service
|- supabase/              # Supabase config and schema
|- docs/                  # Build specs and implementation plans
|- scripts/               # Deployment, smoke-test, and validation scripts
|- SPEC.md                # Product and system specification
```

## Quick Start

### Prerequisites

- Node.js 18+ with `npm`
- Python 3.11+ with `pip`
- PowerShell on Windows

The bundled scripts are optimized for Windows PowerShell. The fastest production-style validation flow is the direct deployment path below.

### Production-style local run

Copy the production env template, fill in real values, and start the stack:

```powershell
Copy-Item .\.env.production.example .\.env.production
powershell -ExecutionPolicy Bypass -File .\scripts\direct-deploy.ps1 -EnvFile .env.production -InstallDeps -SmokeTest
```

Run again without reinstalling dependencies:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\direct-deploy.ps1 -EnvFile .env.production -SmokeTest
```

### Local URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/api`
- AI service: `http://localhost:3002`

## Live Deployment

The repository now includes two production-ready deployment paths:

- Direct process-based deployment without Docker
- Container-based deployment with Docker Compose

### Direct run

Build and run the stack directly on the host machine:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\direct-deploy.ps1 -EnvFile .env.production -SmokeTest
```

That command:

- builds frontend and backend in production mode
- syntax-checks the AI service
- starts `next start`, `node dist/index.js`, and `uvicorn`
- runs the end-to-end smoke suite against the production-like stack

### Direct run with live data

For persistent data backed by Supabase:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\direct-live-data.ps1 -EnvFile .env.live-data
```

Fill in real Supabase values before running. The wrapper will stop if the env
file is still using placeholder values.

### Vercel deployment

The stable Vercel setup for this repo uses three separate projects:

- `frontend/` for the Next.js app
- `backend/` for the Express API
- `ai-service/` for the FastAPI AI service

Use [VERCEL_DEPLOYMENT.md](C:/Dev/Projects/Esencelab/docs/VERCEL_DEPLOYMENT.md)
for the exact env variables, project roots, and deploy order.

### Docker path

The container deployment assets are also included:

- [docker-compose.production.yml](C:/Dev/Projects/Esencelab/docker-compose.production.yml)
- [frontend/Dockerfile](C:/Dev/Projects/Esencelab/frontend/Dockerfile)
- [backend/Dockerfile](C:/Dev/Projects/Esencelab/backend/Dockerfile)
- [ai-service/Dockerfile](C:/Dev/Projects/Esencelab/ai-service/Dockerfile)
- [.env.production.example](C:/Dev/Projects/Esencelab/.env.production.example)
- [LIVE_DEPLOYMENT.md](C:/Dev/Projects/Esencelab/docs/LIVE_DEPLOYMENT.md)
- [CODEBASE_GUIDE.md](C:/Dev/Projects/Esencelab/docs/CODEBASE_GUIDE.md)
- [VERCEL_DEPLOYMENT.md](C:/Dev/Projects/Esencelab/docs/VERCEL_DEPLOYMENT.md)

Quick production flow:

```powershell
Copy-Item .\.env.production.example .\.env.production
docker compose --env-file .env.production -f .\docker-compose.production.yml up --build -d
```

Validate the production compose file before deploying:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deployment-check.ps1 -EnvFile .env.production
```

Before deploying publicly:

- Replace `JWT_SECRET`
- Set `FRONTEND_URLS` to your real frontend domain
- Set `AI_ALLOWED_ORIGINS` to your real frontend domain
- Set the same strong `AI_INTERNAL_AUTH_TOKEN` in both `backend` and `ai-service`
- Switch `DATA_PROVIDER=supabase` if you want persistent data

## API Versioning And Contracts

- The current public backend surface is the `/api/*` compatibility contract and should be treated as `v1`.
- Any future breaking API changes should be introduced under `/api/v2/*` rather than changing existing `v1` payloads in place.
- The AI service exposes a live OpenAPI/Swagger contract through FastAPI at `/docs` and `/openapi.json`.

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

Use the env template as the base:

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
| `JWT_SECRET` | Yes | JWT signing secret |
| `AI_SERVICE_URL` | No | FastAPI base URL |
| `FRONTEND_URL` | No | Allowed frontend origin |
| `FRONTEND_URLS` | Recommended for production | Comma-separated allowed frontend origins |
| `TRUST_PROXY` | Recommended behind ingress | Enables correct proxy-aware request handling |
| `DATA_PROVIDER` | Yes | `memory` for local-only mode, `supabase` for persistent mode |
| `ALLOW_INSECURE_PASSWORD_RESET_TOKEN_RESPONSE` | No | Local-only reset token echo for test scripts |
| `INITIAL_ADMIN_EMAIL` | Recommended for first hosted boot | Creates the first admin account if missing |
| `INITIAL_ADMIN_PASSWORD` | Recommended for first hosted boot | Password for the first admin account |
| `INITIAL_ADMIN_NAME` | No | Display name for the first admin account |
| `INITIAL_RECRUITER_EMAIL` | Optional | Creates an initial recruiter account if missing |
| `INITIAL_RECRUITER_PASSWORD` | Optional | Password for the initial recruiter account |
| `INITIAL_RECRUITER_NAME` | No | Display name for the initial recruiter account |
| `SUPABASE_URL` | Only for Supabase mode | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Only for Supabase mode | Server-side Supabase key |
| `SUPABASE_ANON_KEY` | Optional fallback | Alternate Supabase key input |
| `SLOW_ENDPOINT_THRESHOLD_MS` | No | Monitoring threshold for slow requests |

### AI service

Use [ai-service/.env.example](C:/Dev/Projects/Esencelab/ai-service/.env.example) for AI-specific deployment values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_ALLOWED_ORIGINS` | Recommended for production | Comma-separated origins allowed to call the AI service |
| `GROQ_API_KEY` | Optional | Enables the student AI coach using Groq |
| `GROQ_MODEL` | Optional | Groq model name, defaults to `openai/gpt-oss-120b` |
| `GROQ_REASONING_EFFORT` | Optional | Reasoning level for Groq models that support it |
| `GROQ_SERVICE_TIER` | Optional | Groq service tier, defaults to `auto` |
| `STUDENT_ASSISTANT_CACHE_TTL_SEC` | Optional | Cache TTL for assistant responses |

### Frontend

Use [frontend/.env.example](C:/Dev/Projects/Esencelab/frontend/.env.example) for build-time frontend settings.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | Public API base URL used by the browser |
| `BACKEND_PROXY_TARGET` | If using same-domain proxy mode | Internal backend target for Next.js rewrites |
| `AI_PROXY_TARGET` | If using same-domain proxy mode | Internal AI target for Next.js rewrites |

PowerShell session variables:

```powershell
$env:GROQ_API_KEY="your_groq_api_key"
$env:GROQ_MODEL="openai/gpt-oss-120b"
$env:GROQ_REASONING_EFFORT="high"
```

If `GROQ_API_KEY` is not set, the AI coach falls back to local guidance logic instead of external completions.

## Data Provider Modes

### Memory mode

`memory` mode is the default for local work. It provides:

- Empty runtime state without an external database
- No dependency on a running external database
- Fast startup for development and debugging

### Supabase mode

Use Supabase when you want persisted data across runs.

Required changes:

1. Set `DATA_PROVIDER=supabase` in `backend/.env`.
2. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Apply [supabase-schema.sql](supabase/supabase-schema.sql).

## Validation and Testing

### Smoke test

Starts from already-running services and verifies the core flows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local-smoke.ps1
```

Set these environment variables before running the smoke suite:

```powershell
$env:SMOKE_STUDENT_EMAIL="student@your-domain.com"
$env:SMOKE_STUDENT_PASSWORD="..."
$env:SMOKE_RECRUITER_EMAIL="recruiter@your-domain.com"
$env:SMOKE_RECRUITER_PASSWORD="..."
$env:SMOKE_ADMIN_EMAIL="admin@your-domain.com"
$env:SMOKE_ADMIN_PASSWORD="..."
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

Runs a wider set of feature checks on top of a running local stack:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\full-feature-check.ps1
```

This goes beyond the normal smoke test and covers password reset, logout
revocation, recruiter analytics, admin moderation, and deeper CRUD paths.

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
- [LIVE_DEPLOYMENT.md](C:/Dev/Projects/Esencelab/docs/LIVE_DEPLOYMENT.md)
- [VERCEL_DEPLOYMENT.md](C:/Dev/Projects/Esencelab/docs/VERCEL_DEPLOYMENT.md)
- [SPEC.md](C:/Dev/Projects/Esencelab/SPEC.md)

## Operational Notes

- Local development can use `memory` mode, but hosted environments should use `supabase`.
- The AI service is required for resume parsing and match-related flows.
- JWT secrets and external API keys should be set through environment variables and never committed.
- PowerShell scripts stop and restart ports `3000`, `3001`, and `3002` to keep the local stack predictable.

## Team

- Abdulla Sajad - backend development, database implementation, system architecture
- Harikrishnan K - frontend development, UI design
- Adwaith PC - documentation, system design support, presentation planning
- Jishnu MR - testing, validation, research support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
