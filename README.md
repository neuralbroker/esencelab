# EsenceLab

Hiring loop: resume in, structured skills out, job match + recruiter shortlist.

## Problem

Students can't map resumes to skill gaps; recruiters screen manually; admins lack one control surface.

## Solution

Three deployables demonstrating multi-service product engineering, kept to one meaningful AI workflow (resume parse + match). Secondary LMS/coach/admin features are de-emphasized.

## Architecture

```text
Frontend (Next.js)
  ↓
API (Express, JWT + RBAC, rate limits, request IDs)
  ↓
PostgreSQL (Supabase-managed: users, resumes, candidates, jobs, applications)
  ↓
AI service (FastAPI: /ai/parse-resume, /ai/match)
```

Service calls are synchronous `fetch` with `x-internal-service-token` and 8–12s timeouts (no queues yet).

## Key Engineering Decisions

1. Supabase as managed PostgreSQL; authorization in Express (RLS policies are permissive `USING(true)` — documented, not relied on).
2. Gated recruiter onboarding: request → admin approve → temp password → login.
3. Deterministic parse/match first (`overlap*0.55 + TF-IDF*0.45` with fallbacks); Groq optional with local fallback, removable.
4. Per-endpoint in-memory metrics + `/api/health`; no external APM (documented gap).
5. Docker per service + `render.yaml` + Vercel frontend + 4-job CI.

## Tech Stack

TypeScript · Next.js · Express · Python FastAPI · PostgreSQL · Docker

## Features

1. Auth + RBAC (student/recruiter/admin)
2. Resume upload (PDF, 4MB) + structured parse
3. Jobs CRUD + applications
4. Skill-overlap + TF-IDF match with explanations
5. Gated recruiter flow + admin review
6. Health/monitoring endpoints

## Running Locally

```powershell
# Windows PowerShell (ports 3100/3101/3102)
.\run-frontend-3100.ps1
.\run-backend-3101.ps1
.\run-ai-3102.ps1
```

Linux: `cd frontend && npm ci && npm run dev`; `cd backend && npm ci && npm run dev`; `cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --port 3102`. Configure `JWT_SECRET`, `AI_INTERNAL_AUTH_TOKEN`, `SUPABASE_*`, `AI_SERVICE_URL`.

## Testing

```bash
cd backend && npm run test:all   # RBAC smoke + stress (SUPABASE_MOCK=1)
cd ../ai-service && python -m unittest tests.smoke_test
node scripts/verify-supabase-schema.js
```

## Performance

No published benchmarks. Only thresholds (e.g. slow-endpoint 1200ms, p95 alert 2500ms) — not measurements.

## Limitations

`backend/src/index.ts` is a ~6K-line monolith (split planned in `docs/ARCHITECTURE.md`); no background workers; RLS permissive; monitoring in-memory; secondary features (roadmaps, courses, mock interviews, coach, analytics) hidden from this story.

## Future Improvements

Split API into routes/services/stores; harden RLS or document managed-PG choice; add queue for AI calls; external observability; expand tests beyond RBAC/smoke.
