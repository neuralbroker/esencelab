# Esencelab Competition Deployment

This setup keeps the frontend on Vercel and moves the backend plus AI service
to Render free web services, with Supabase as the real database.

## Architecture

- Frontend: Vercel
- Backend API: Render
- AI service: Render
- Database: Supabase

## 1. Supabase

Create a Supabase project and run:

- [supabase/supabase-schema.sql](C:/Dev/esencelab/supabase/supabase-schema.sql)

Collect these values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2. Render

Use the root-level [render.yaml](C:/Dev/esencelab/render.yaml).

Create a new Blueprint on Render from this repository. It will create:

- `esencelab-backend`
- `esencelab-ai`

When prompted for secret env vars, set:

### Backend

- `JWT_SECRET`: long random string, at least 32 chars
- `AI_SERVICE_URL`: `https://esencelab-ai.onrender.com`
- `AI_INTERNAL_AUTH_TOKEN`: long random shared string, at least 24 chars
- `SUPABASE_URL`: your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: your Supabase service role key
- `INITIAL_ADMIN_EMAIL`: your email
- `INITIAL_ADMIN_PASSWORD`: strong password
- `INITIAL_RECRUITER_EMAIL`: optional recruiter bootstrap email
- `INITIAL_RECRUITER_PASSWORD`: optional recruiter bootstrap password

### AI

- `AI_INTERNAL_AUTH_TOKEN`: exactly the same value as backend
- `GROQ_API_KEY`: optional

After deploy, verify:

- `https://esencelab-backend.onrender.com/api/health`
- `https://esencelab-ai.onrender.com/health`

Expected backend health should report:

- `"dataProvider": "supabase"`

## 3. Vercel

Set frontend env vars in the Vercel project:

- `NEXT_PUBLIC_API_URL=/api`
- `BACKEND_PROXY_TARGET=https://esencelab-backend.onrender.com`
- `AI_PROXY_TARGET=https://esencelab-ai.onrender.com`
- `NEXT_PUBLIC_MAX_RESUME_FILE_SIZE_MB=4`

Then redeploy frontend.

Verify:

- `https://esencelab.vercel.app/api/health`
- `https://esencelab.vercel.app/ai/health`

## 4. Demo Checklist

Before the competition demo:

1. Open the frontend 10 minutes early.
2. Wake the free Render services by visiting:
   - `/api/health`
   - `/ai/health`
3. Verify login works.
4. Verify resume upload works with a small PDF.
5. Verify recruiter can view applicants.
6. Keep one admin and one recruiter login ready.

## 5. Important Note

This codebase can run with real Supabase, but the backend still mirrors runtime
state into in-memory collections. That is acceptable for a competition demo,
but it is not the final architecture for large-scale production.
