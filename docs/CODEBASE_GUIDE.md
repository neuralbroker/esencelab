# Codebase Guide

## Purpose
This guide explains the project in direct English for team members who need to
read, debug, and extend the system quickly.

The platform has three running parts:

1. `frontend/`: Next.js app for landing, auth, student, recruiter, and admin UI
2. `backend/`: Express API for auth, dashboards, jobs, applications, admin, and career logic
3. `ai-service/`: FastAPI service for resume parsing, matching, and the student AI coach

## Keys You Need To Provide
These are the environment keys that matter for a real local live-data run.

Required:

- `JWT_SECRET`: signs backend JWT tokens
- `SUPABASE_URL`: points to your Supabase project
- `SUPABASE_SERVICE_ROLE_KEY`: lets the backend read and write live data
- `DATA_PROVIDER=supabase`: turns on persistent mode

Required if you want Groq-powered student AI instead of fallback guidance:

- `GROQ_API_KEY`

Recommended:

- `SUPABASE_ANON_KEY`: useful if a client-side flow needs it later
- `GROQ_MODEL`: defaults to `openai/gpt-oss-120b`
- `GROQ_REASONING_EFFORT`: defaults to `high`
- `FRONTEND_URLS`: allowed frontend origins for backend CORS
- `AI_ALLOWED_ORIGINS`: allowed frontend origins for AI service CORS
- `STUDENT_ASSISTANT_CACHE_TTL_SEC`: short cache for repeated student AI prompts
- `TRUST_PROXY=1`: recommended when the app sits behind a proxy

## Runtime Flow
### Login and auth
- The frontend stores the JWT and current user in local storage
- The backend validates the token on protected routes
- Role checks decide whether a request is student, recruiter, or admin only

### Student flow
- Student uploads resume
- Backend forwards PDF to AI service
- AI service extracts text, parses fields, and returns structured data
- Backend stores parsed resume and computes related scores and recommendations
- Student dashboard reads overview, roadmap, learning plan, AI coach, and recommendations

### Recruiter flow
- Recruiter creates a job
- Backend scores students against the job
- Recruiter pages read ranked candidates and candidate detail data

### Admin flow
- Admin pages read monitoring, users, resumes, courses, and moderation data
- Backend exposes system overview and CRUD endpoints for admin operations

## File Guide
### Backend
- `backend/src/index.ts`
  - Main API server
- Holds route definitions, auth middleware, in-memory runtime state, and wiring to Supabase
  - If you want to understand request flow first, start here
- `backend/src/careerEngine.ts`
  - Pure business logic for resume scoring, roadmap generation, learning plans, and mock interviews
  - This is the safest place to change recommendation logic without touching routes
- `backend/src/supabaseStore.ts`
  - Adapter that keeps the existing in-memory runtime model compatible with Supabase persistence
  - Use this file when data exists in Supabase but not in the local in-memory store

### AI service
- `ai-service/app/main.py`
  - Resume parser, skill extractor, match engine, and Groq-backed student assistant
  - Contains both the external AI call and the local fallback logic

### Frontend shared layers
- `frontend/src/lib/api.ts`
  - Shared Axios client, auth token handling, response cache, and request deduping
- `frontend/src/lib/dashboardApi.ts`
  - Named frontend API helpers for dashboard pages
  - Use this before adding raw `api.get()` calls inside components
- `frontend/src/lib/studentResources.ts`
  - Curated free learning resources for the student page
  - Keeps resource quality stable instead of scraping unstable external pages at runtime
- `frontend/src/types/index.ts`
  - Shared frontend data contracts
  - Update this when the backend response shape changes
- `frontend/src/contexts/AuthContext.tsx`
  - Stores logged-in user state and exposes login/register/logout actions

### Frontend components
- `frontend/src/components/StudentUpskillingHub.tsx`
  - Main student workspace
  - Largest student-facing component: resume upload, roadmap, learning plan, AI coach, and resources
- `frontend/src/components/Navbar.tsx`
  - Main authenticated navigation
- `frontend/src/components/UISoundLayer.tsx`
  - Global UI sound handling for interactive clicks
- `frontend/src/components/Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `Select.tsx`, `Progress.tsx`, `Skeleton.tsx`
  - Shared UI building blocks
- `frontend/src/components/EsencelabLogo.tsx`
  - Reusable brand mark

### Frontend routes
- `frontend/src/app/page.tsx`
  - Public landing page
- `frontend/src/app/login/page.tsx`
  - Login screen
- `frontend/src/app/register/page.tsx`
  - Registration screen
- `frontend/src/app/(dashboard)/layout.tsx`
  - Shared shell for authenticated pages
- `frontend/src/app/(dashboard)/dashboard/page.tsx`
  - Role-aware main dashboard entry
- `frontend/src/app/(dashboard)/resume/page.tsx`
  - Student resume workflow
- `frontend/src/app/(dashboard)/applications/page.tsx`
  - Student application tracker
- `frontend/src/app/(dashboard)/interview/page.tsx`
  - Student mock interview page
- `frontend/src/app/(dashboard)/courses/page.tsx`
  - Shared course and resource browsing
- `frontend/src/app/(dashboard)/jobs/page.tsx`
  - Job list page
- `frontend/src/app/(dashboard)/jobs/new/page.tsx`
  - Recruiter job creation page
- `frontend/src/app/(dashboard)/jobs/[id]/page.tsx`
  - Single job detail page
- `frontend/src/app/(dashboard)/applicants/page.tsx`
  - Recruiter candidate list page
- `frontend/src/app/(dashboard)/applicants/[id]/page.tsx`
  - Recruiter candidate detail page
- `frontend/src/app/(dashboard)/users/page.tsx`
  - Admin user management page
- `frontend/src/app/(dashboard)/admin/resumes/page.tsx`
  - Admin resume monitoring and moderation page

### Scripts
- `scripts/direct-deploy.ps1`
  - Production-style local run script without Docker
- `scripts/direct-live-data.ps1`
  - Safe wrapper for live Supabase mode
- `scripts/direct-deploy.ps1`
- Production-style local runner for the full stack
- `scripts/local-smoke.ps1`
  - Fast end-to-end smoke suite
- `scripts/full-check.ps1`
  - Lint, build, and runtime validation
- `scripts/full-feature-check.ps1`
  - Wider feature coverage for local validation
- `scripts/deployment-check.ps1`
  - Deployment configuration validation

## Where To Start When Debugging
If the issue is:

- auth or roles: start with `backend/src/index.ts` and `frontend/src/contexts/AuthContext.tsx`
- student dashboard data: start with `frontend/src/components/StudentUpskillingHub.tsx`, then `frontend/src/lib/dashboardApi.ts`, then `backend/src/index.ts`
- AI coach or resume parsing: start with `ai-service/app/main.py`
- live data problems: start with `backend/src/supabaseStore.ts` and the root env file used by the run script
- local startup problems: start with `scripts/direct-live-data.ps1` and `scripts/direct-deploy.ps1`

## Team Rule Of Thumb
When you change behavior:

1. update the shared type if the response shape changes
2. update the backend route or AI service
3. update the frontend helper
4. run the local smoke or full check scripts

That keeps the stack aligned and reduces hidden breakage.
