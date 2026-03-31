# Live Deployment Guide

This project now includes two deployment paths for the full stack:

- direct host-based deployment without Docker
- container-based deployment with Docker Compose

## Direct deployment

Run the stack directly on the host:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\direct-deploy.ps1 -EnvFile .env.production -SmokeTest
```

For a real deployment, copy the template file first:

```powershell
Copy-Item .\.env.production.example .\.env.production
powershell -ExecutionPolicy Bypass -File .\scripts\direct-deploy.ps1 -EnvFile .env.production -SmokeTest
```

This starts:

- frontend via `next start`
- backend via `node dist/index.js`
- AI service via `uvicorn`

## Direct deployment with live data

If you want local hosting with persistent Supabase-backed data
data, use Supabase-backed mode:

```powershell
Copy-Item .\.env.live-data.example .\.env.live-data
powershell -ExecutionPolicy Bypass -File .\scripts\direct-live-data.ps1 -EnvFile .env.live-data
```

Before running this mode, set real values for:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

## Docker deployment

This path uses:

- `frontend/Dockerfile`
- `backend/Dockerfile`
- `ai-service/Dockerfile`
- `docker-compose.production.yml`
- `.env.production.example`

## Recommended deployment shape

Run the three services together:

- `frontend` on port `3000`
- `backend` on port `3001`
- `ai-service` on port `3002`

For production, place a reverse proxy such as Nginx, Caddy, or a cloud load balancer in front of the frontend container and expose only the public frontend domain.

## 1. Prepare environment

Copy the example:

```powershell
Copy-Item .\.env.production.example .\.env.production
```

Required values:

- `JWT_SECRET`
- `FRONTEND_URLS`
- `AI_ALLOWED_ORIGINS`

Optional values:

- `DATA_PROVIDER=supabase`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`

## 2. Start the stack

```powershell
docker compose --env-file .env.production -f .\docker-compose.production.yml up --build -d
```

## 3. Verify health

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001/api/health`
- AI service: `http://localhost:3002/health`

## 4. Persistent data option

The compose file defaults to `DATA_PROVIDER=memory` for a simple first deployment.

To persist data:

1. Set `DATA_PROVIDER=supabase`
2. Configure `SUPABASE_URL`
3. Configure `SUPABASE_SERVICE_ROLE_KEY`
4. Apply `supabase/supabase-schema.sql`
5. Apply only the schema and any environment-specific bootstrap records you intend to own long term.

## 5. Frontend API routing

The frontend supports two production modes:

- Same-domain proxy mode:
  - Keep `NEXT_PUBLIC_API_URL=/api`
  - Use `BACKEND_PROXY_TARGET` and `AI_PROXY_TARGET` at build time
- Direct API mode:
- Set `NEXT_PUBLIC_API_URL` to a public backend URL such as `https://api.your-domain.com/api`

## 6. Security notes

- Set a strong production JWT secret before deployment.
- Restrict `FRONTEND_URLS` and `AI_ALLOWED_ORIGINS` to real domains.
- Do not commit `.env.production`.
- If you deploy behind a proxy or ingress, keep `TRUST_PROXY=1`.
