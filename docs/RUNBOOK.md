# Operations Runbook

## Local startup

Create local env files before running the root launchers:

- `.env.local` for shared local secrets
- `frontend/.env.local` for frontend-only overrides
- `backend/.env.local` for backend-only overrides
- `ai-service/.env.local` for AI-service-only overrides

Minimum shared local values:

- `JWT_SECRET`
- `AI_INTERNAL_AUTH_TOKEN`

Start services from the repository root:

- `powershell -ExecutionPolicy Bypass -File .\run-ai-3102.ps1`
- `powershell -ExecutionPolicy Bypass -File .\run-backend-3101.ps1`
- `powershell -ExecutionPolicy Bypass -File .\run-frontend-3100.ps1`

## Validation

Run these before release:

- `npm ci --prefix backend`
- `npm run build --prefix backend`
- `npm --prefix backend audit --omit=dev`
- `npm ci --prefix frontend`
- `npm run build --prefix frontend`
- `npm --prefix frontend audit --omit=dev`
- `python -m pip install -r ai-service/requirements.txt`
- `python -m py_compile ai-service/app/main.py`

## Health checks

- Backend: `/api/health`
- AI service: `/health`
- Frontend: load the hosted root URL and verify login/register pages render.

## Incident checklist

1. Check Render/Vercel service status and recent deploy logs.
2. Check backend `/api/health` and AI `/health`.
3. Verify Supabase connectivity and recent database errors.
4. Confirm environment variables were not removed or rotated incorrectly.
5. Roll back the most recent deploy if startup or auth is broken.
