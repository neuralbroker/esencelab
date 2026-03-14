# Vercel Deployment Guide

This codebase should be deployed to Vercel as three separate projects.

## Why three projects
The repository has three runtimes:

1. `frontend/` -> Next.js app
2. `backend/` -> Express API
3. `ai-service/` -> FastAPI AI service

Vercel can host all three, but not as one standard project without using beta
multi-service features. The stable setup is three Vercel projects.

## Project 1: AI service
Create a Vercel project with:

- Root Directory: `ai-service`
- Framework Preset: Other

Files already added for this:

- [app/index.py](C:/Dev/Projects/Esencelab/ai-service/app/index.py)
- [vercel.json](C:/Dev/Projects/Esencelab/ai-service/vercel.json)
- [.python-version](C:/Dev/Projects/Esencelab/ai-service/.python-version)
- [.env.vercel.example](C:/Dev/Projects/Esencelab/ai-service/.env.vercel.example)

Set these env vars in Vercel:

- `AI_ALLOWED_ORIGINS=https://<your-frontend-domain>`
- `GROQ_API_KEY=<your-groq-key>`
- `GROQ_MODEL=openai/gpt-oss-120b`
- `GROQ_REASONING_EFFORT=high`
- `GROQ_SERVICE_TIER=auto`
- `STUDENT_ASSISTANT_CACHE_TTL_SEC=300`

After deploy, note the public URL:

- Example: `https://esencelab-ai.vercel.app`

## Project 2: Backend API
Create a second Vercel project with:

- Root Directory: `backend`
- Framework Preset: Other

Files already added for this:

- [vercel.json](C:/Dev/Projects/Esencelab/backend/vercel.json)
- [.env.vercel.example](C:/Dev/Projects/Esencelab/backend/.env.vercel.example)

Set these env vars in Vercel:

- `JWT_SECRET=<strong-secret>`
- `AI_SERVICE_URL=https://<your-ai-project>.vercel.app`
- `FRONTEND_URL=https://<your-frontend-project>.vercel.app`
- `FRONTEND_URLS=https://<your-frontend-project>.vercel.app`
- `TRUST_PROXY=1`
- `DATA_PROVIDER=supabase`
- `ENABLE_DEMO_DATA=false`
- `ALLOW_INSECURE_PASSWORD_RESET_TOKEN_RESPONSE=false`
- `SYNC_DEMO_DATA_TO_SUPABASE=false`
- `INITIAL_ADMIN_EMAIL=<your-admin-email>`
- `INITIAL_ADMIN_PASSWORD=<strong-admin-password>`
- `INITIAL_ADMIN_NAME=Platform Admin`
- `INITIAL_RECRUITER_EMAIL=<optional-recruiter-email>`
- `INITIAL_RECRUITER_PASSWORD=<optional-recruiter-password>`
- `INITIAL_RECRUITER_NAME=Initial Recruiter`
- `SUPABASE_URL=<your-supabase-url>`
- `SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>`
- `SUPABASE_ANON_KEY=<optional>`
- `GROQ_API_KEY=<your-groq-key>`
- `GROQ_MODEL=openai/gpt-oss-120b`
- `GROQ_REASONING_EFFORT=high`
- `GROQ_SERVICE_TIER=auto`
- `STUDENT_ASSISTANT_CACHE_TTL_SEC=300`
- `MAX_RESUME_FILE_SIZE_MB=4`

After deploy, verify:

- `https://<your-backend-project>.vercel.app/api/health`
- log in with the initial admin account you set in env vars

Important:

- Demo data is no longer seeded automatically for hosted environments.
- Public signup remains student-only.
- Admin and recruiter access should be bootstrapped from the backend env vars above.

## Project 3: Frontend
Create a third Vercel project with:

- Root Directory: `frontend`
- Framework Preset: Next.js

Files already added for this:

- [.env.vercel.example](C:/Dev/Projects/Esencelab/frontend/.env.vercel.example)

Set these env vars in Vercel:

- `NEXT_PUBLIC_API_URL=/api`
- `BACKEND_PROXY_TARGET=https://<your-backend-project>.vercel.app`
- `AI_PROXY_TARGET=https://<your-ai-project>.vercel.app`
- `NEXT_PUBLIC_MAX_RESUME_FILE_SIZE_MB=4`

The frontend will proxy `/api/*` to the backend project. That keeps browser
requests same-origin and avoids client-side CORS problems.

## Deploy order
Deploy in this order:

1. AI service
2. Backend API
3. Frontend

That order matters because backend needs the AI URL, and frontend needs the
backend URL.

## Validation after deploy
Check:

- frontend home page loads
- login and register work
- student dashboard loads
- resume upload accepts PDFs up to 4 MB
- backend health route returns `200`
- AI health route returns `200`

## Important note
This repo is now prepared for Vercel, but the actual production deployment
still requires either:

- `vercel login` on this machine, or
- a Vercel token supplied securely

Without that, I can prepare and verify the deployment files, but I cannot push
the projects to your Vercel account from here.
