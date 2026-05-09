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

The largest future scale improvement is splitting `backend/src/index.ts` into modules:

- `config/` for environment parsing and production safety checks
- `middleware/` for auth, request IDs, logging, rate limits, and error handling
- `routes/` for auth, users, resumes, jobs, applications, career, recruiter, admin, health
- `services/` for matching, recommendations, monitoring, bootstrap, and audit logging
- `stores/` for memory and Supabase persistence adapters

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
