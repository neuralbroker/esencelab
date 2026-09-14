# Architecture

## Runtime topology

Esencelab is split into independent deployable services:

1. `frontend` - Next.js app for students, recruiters, and admins.
2. `backend` - Express API for auth, dashboards, jobs, applications, monitoring, and persistence orchestration.
3. `ai-service` - FastAPI service for resume parsing, matching, and AI-assisted guidance.
4. `supabase` - PostgreSQL schema and persistent data source.

## Scaling boundaries

- The frontend should stay stateless and consume backend APIs through the shared client in `frontend/src/lib/api.ts`.
- The backend owns authorization, validation, audit logging, and persistence decisions.
- The AI service should stay independently scalable because PDF parsing and AI calls can be CPU/network intensive.
- Supabase/Postgres is the source of truth for production data.

## Current refactor direction

The largest future scale improvement is splitting `backend/src/index.ts`
(~6K lines) into modules. Verified pattern (2026-09-14): extract pure,
dependency-free functions first, re-import, then `tsc --noEmit` + RBAC
smoke/stress (`SUPABASE_MOCK=1`, run files separately — joint runs collide
under one process even on main).

- [x] Step 1 — `backend/src/auth/roles.ts`: `CanonicalRole/SupportedRole`,
  `toStorageRole/toCanonicalRole/roleMatches/roleFilterMatches/sanitizeUser`
  (pure; RBAC smoke + stress green individually)
- [ ] Step 2 — `middleware/requestId.ts`: request-ID + error-normalization
  middlewares (depend only on types + `crypto`)
- [ ] Step 3 — `utils/metrics.ts`: `normalizeMetricPath/toPercentile/...`
  (depend on in-memory store shape — pass store as arg, no module closure)
- [ ] Step 4 — `routes/health.ts`: `/api/health` + monitoring endpoints
  (first vertical slice; needs store + config injection)
- [ ] Step 5+ — `routes/` per domain (auth, jobs, applications, recruiter,
  admin), `services/` (matching, audit), `stores/` (memory vs Supabase
  adapters behind one interface)

Rule: never move a function that closes over module-level `db`/limiters
without converting the closure to an argument. Each step must keep
`npm run test:all` green before the next begins.

The AI service should similarly evolve from one large module into:

- `config.py`
- `schemas.py`
- `pdf_parser.py`
- `skills.py`
- `matching.py`
- `assistant.py`
- `routes.py`

## Deployment ownership

- Frontend: Vercel
- Backend: Render Docker service
- AI service: Render Docker service
- Database: Supabase
