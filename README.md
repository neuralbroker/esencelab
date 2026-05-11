# Esencelab

Esencelab is a full-stack AI-assisted hiring and career intelligence platform built around three role-based experiences:

- Students upload resumes, discover skill gaps, follow roadmaps and learning plans, and track applications.
- Recruiters post jobs, rank candidates by fit, and review structured resume insights instead of screening manually.
- Admins monitor users, resumes, applications, moderation flows, and platform health from a single control surface.

The project is split into a Next.js frontend, an Express API, and a FastAPI AI service, with Supabase/Postgres used for persistent production data.

## Product Scope

### Student module

- Authentication, protected dashboard access, and profile management
- Beginner onboarding with domain discovery and guided resume starting points
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

- Recruiter login and protected recruiter flows after admin approval
- Public recruiter access request submission for teams that want to join the platform
- Job posting, editing, deletion, and listing
- Candidate ranking by match score
- Candidate match breakdowns for each job
- Applicant views and recruiter analytics endpoints
- Faster shortlisting workflow through structured candidate summaries

### Admin module

- Admin-only authentication and route protection
- User management
- Recruiter access request review, approval, rejection, and temporary-password issuance
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
| Data | Supabase/Postgres persistence |
| Tooling | PowerShell helper scripts, npm, TypeScript compiler, ESLint |

## Repository Layout

```text
Esencelab/
|- frontend/                     # Next.js app
|- backend/                      # Express API and data-provider layer
|- ai-service/                   # FastAPI AI and resume processing service
|- supabase/                     # Supabase config and schema
|- render.yaml                   # Render service blueprint
|- run-frontend-3100.ps1         # Local frontend launcher
|- run-backend-3101.ps1          # Local backend launcher
|- run-ai-3102.ps1               # Local AI launcher
```

## Security Note

No public credentials are documented in this repository.

- Create the first local admin through backend bootstrap environment variables such as `INITIAL_ADMIN_*`.
- Create student accounts through the normal registration flow.
- Recruiters should submit the public recruiter access request form; admins approve requests before recruiter login and hiring tools are enabled. `INITIAL_RECRUITER_*` remains available only for trusted bootstrap/admin-controlled environments.
- Do not commit or publish real passwords, login pairs, or production secrets in the README or any tracked file.

## Quick Start

### Prerequisites

- Node.js 18+ with `npm`
- Python 3.11+ with `pip`
- PowerShell on Windows

### Install dependencies

Frontend:

```powershell
cd .\frontend
npm ci
```

Backend:

```powershell
cd .\backend
npm ci
```

AI service:

```powershell
cd .\ai-service
python -m pip install -r requirements.txt
```

### Configure local environment

Backend template:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
```

Frontend template:

```powershell
Copy-Item .\frontend\.env.example .\frontend\.env.local
```

AI service template:

```powershell
Copy-Item .\ai-service\.env.example .\ai-service\.env
```

The root launchers load `.env.local` first, then service-specific `.env.local` files. Set local secrets and Supabase credentials there instead of editing the scripts:

```env
JWT_SECRET=replace-with-a-local-32-character-minimum-secret
AI_INTERNAL_AUTH_TOKEN=replace-with-a-shared-local-internal-token
DATA_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-your-service-role-key
```

### Run the local stack

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-ai-3102.ps1
```

```powershell
powershell -ExecutionPolicy Bypass -File .\run-backend-3101.ps1
```

```powershell
powershell -ExecutionPolicy Bypass -File .\run-frontend-3100.ps1
```

### Local URLs

- Frontend: `http://127.0.0.1:3100`
- Backend API: `http://127.0.0.1:3101/api`
- AI service: `http://127.0.0.1:3102`

## Environment Variables

### Backend

Use [backend/.env.example](backend/.env.example) as the starting point.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | API port, defaults to `3001` |
| `JWT_SECRET` | Yes | JWT signing secret |
| `AI_SERVICE_URL` | No | FastAPI base URL |
| `AI_INTERNAL_AUTH_TOKEN` | Recommended | Shared backend-to-AI auth token |
| `FRONTEND_URL` | No | Allowed frontend origin |
| `FRONTEND_URLS` | Recommended for production | Comma-separated allowed frontend origins |
| `TRUST_PROXY` | Recommended behind ingress | Enables correct proxy-aware request handling |
| `DATA_PROVIDER` | Yes | Must be `supabase` |
| `ALLOW_INSECURE_PASSWORD_RESET_TOKEN_RESPONSE` | No | Local-only reset token echo for private development scripts |
| `INITIAL_ADMIN_EMAIL` | Optional | Creates the first admin account if missing |
| `INITIAL_ADMIN_PASSWORD` | Optional | Password for the first admin account |
| `INITIAL_ADMIN_NAME` | No | Display name for the first admin account |
| `INITIAL_RECRUITER_EMAIL` | Optional | Creates an initial recruiter account if missing |
| `INITIAL_RECRUITER_PASSWORD` | Optional | Password for the initial recruiter account |
| `INITIAL_RECRUITER_NAME` | No | Display name for the initial recruiter account |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side Supabase service-role key |
| `SLOW_ENDPOINT_THRESHOLD_MS` | No | Monitoring threshold for slow requests |

### AI service

Use [ai-service/.env.example](ai-service/.env.example) for AI-specific deployment values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_ALLOWED_ORIGINS` | Recommended for production | Comma-separated origins allowed to call the AI service |
| `AI_INTERNAL_AUTH_TOKEN` | Recommended | Shared backend-to-AI auth token |
| `GROQ_API_KEY` | Optional | Enables the student AI coach using Groq |
| `GROQ_MODEL` | Optional | Groq model name, defaults to `openai/gpt-oss-120b` |
| `GROQ_REASONING_EFFORT` | Optional | Reasoning level for Groq models that support it |
| `GROQ_SERVICE_TIER` | Optional | Groq service tier, defaults to `auto` |
| `STUDENT_ASSISTANT_CACHE_TTL_SEC` | Optional | Cache TTL for assistant responses |

### Frontend

Use [frontend/.env.example](frontend/.env.example) for build-time frontend settings.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | Public API base URL used by the browser |
| `BACKEND_PROXY_TARGET` | If using same-domain proxy mode | Internal backend target for Next.js rewrites |
| `AI_PROXY_TARGET` | If using same-domain proxy mode | Internal AI target for Next.js rewrites |
| `NEXT_PUBLIC_MAX_RESUME_FILE_SIZE_MB` | Optional | Client-side resume upload limit |

## Data Provider

The backend uses Supabase/Postgres as the required source of truth. Before running the backend, set `DATA_PROVIDER=supabase`, configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and apply [supabase/supabase-schema.sql](supabase/supabase-schema.sql).

## Deployment

### Recommended hosted setup

This repo is currently designed to run best as:

- Frontend on Vercel
- Backend on Render
- AI service on Render
- Database on Supabase

Use these files as the starting point:

- [render.yaml](render.yaml)
- [frontend/vercel.json](frontend/vercel.json)

### Container assets

The repo also includes Dockerfiles for each service:

- [frontend/Dockerfile](frontend/Dockerfile)
- [backend/Dockerfile](backend/Dockerfile)
- [ai-service/Dockerfile](ai-service/Dockerfile)

## Validation And Testing

### Static checks

Frontend:

```powershell
cd .\frontend
npm run build
```

Backend:

```powershell
cd .\backend
npm run build
```

AI service syntax check:

```powershell
cd .\ai-service
python -m py_compile .\app\main.py
```

### Runtime checks

After starting the local stack, verify:

- Frontend: [http://127.0.0.1:3100](http://127.0.0.1:3100)
- Backend health: [http://127.0.0.1:3101/api/health](http://127.0.0.1:3101/api/health)
- AI health: [http://127.0.0.1:3102/health](http://127.0.0.1:3102/health)

Automated launch validation commands:

- Backend RBAC smoke + stress: `npm --prefix backend run test:all`
- Frontend production build/type/lint: `npm --prefix frontend run build`
- Frontend lint only: `npm --prefix frontend run lint`
- Backend dependency audit: `npm --prefix backend audit --audit-level=moderate`
- Frontend dependency audit: `npm --prefix frontend audit --audit-level=moderate`
- AI smoke tests: `python ai-service/tests/smoke_test.py`
- AI audit tool setup: `python -m pip install -r ai-service/requirements-dev.txt`
- AI dependency audit: `python -m pip_audit -r ai-service/requirements.txt`

Recommended manual workflow checks:

- Student registration and login
- Recruiter request submission, admin approval, and approved recruiter login
- Beginner onboarding and target-role save
- Resume upload and parsed profile retrieval
- Career overview, roadmap, learning plan, AI coach, and mock interview
- Approved recruiter login and job creation
- Student job visibility and application submission
- Recruiter applicant visibility and status updates
- Admin monitoring, users, and resume views

## API Overview

The backend currently exposes grouped endpoints for:

- Auth: student register, login, me, logout, profile update, password reset flow
- Recruiter access requests: public submit plus admin list/review/approve/reject
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

The main API implementation lives in [backend/src/index.ts](backend/src/index.ts).

## Frontend Surface

The frontend includes:

- Public landing page
- Login, student registration, and recruiter access request pages
- Shared dashboard shell
- Student dashboard, resume, applications, courses, interview, jobs, and roadmaps
- Recruiter applicants and job details pages
- Admin recruiter request review, resume review, and user management pages

The frontend app router lives under [frontend/src/app](frontend/src/app).



## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Operations Runbook](docs/RUNBOOK.md)
- [Scaling Roadmap](docs/SCALING.md)
- [Testing Strategy](docs/TESTING.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

## Operational Notes

- Local and hosted backend environments require `DATA_PROVIDER=supabase`.
- The AI service is required for resume parsing and match-related flows.
- JWT secrets and external API keys should be set through environment variables and never committed.
- Use your own local users or bootstrap users through env vars; do not publish credentials in docs.



## Contributing

Contributions are welcome!
