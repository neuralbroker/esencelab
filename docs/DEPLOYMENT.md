# Deployment Guide

## Recommended hosting

- Frontend: Vercel
- Backend: Render Docker service using `backend/Dockerfile`
- AI service: Render Docker service using `ai-service/Dockerfile`
- Database: Supabase/Postgres

## Backend required production variables

- `NODE_ENV=production`
- `DATA_PROVIDER=supabase`
- `JWT_SECRET`
- `AI_SERVICE_URL`
- `AI_INTERNAL_AUTH_TOKEN`
- `FRONTEND_URLS`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## AI service required production variables

- `NODE_ENV=production`
- `AI_ALLOWED_ORIGINS`
- `AI_INTERNAL_AUTH_TOKEN`

Optional:

- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_REASONING_EFFORT`
- `GROQ_SERVICE_TIER`

## Frontend variables

- `NEXT_PUBLIC_API_URL`
- `BACKEND_PROXY_TARGET` when using same-domain proxy rewrites
- `AI_PROXY_TARGET` when using same-domain proxy rewrites

## Release validation

Run all validation commands in `docs/RUNBOOK.md` before promoting a release.
