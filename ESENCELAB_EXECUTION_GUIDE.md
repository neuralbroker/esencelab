# Esencelab Execution Guide

This guide turns the generic prompt library in [PROMPTS.md](/C:/Dev/esencelab/PROMPTS.md)
into practical workflows for Esencelab.

Use this file when you want prompts that already understand:
- the repo layout
- the product roles
- the deployment setup
- the competition priorities
- the current architecture tradeoffs

## Project Truths

Treat these as current working assumptions unless the code changes:

- Frontend lives in [frontend](/C:/Dev/esencelab/frontend) and is the public-facing Next.js app.
- Backend lives in [backend](/C:/Dev/esencelab/backend) and the runtime source of truth is [index.ts](/C:/Dev/esencelab/backend/src/index.ts).
- Student scoring, roadmap, and learning-plan logic live in [careerEngine.ts](/C:/Dev/esencelab/backend/src/careerEngine.ts).
- AI parsing and matching live in [main.py](/C:/Dev/esencelab/ai-service/app/main.py).
- Supabase schema lives in [supabase-schema.sql](/C:/Dev/esencelab/supabase/supabase-schema.sql).
- Current hosted architecture is `Vercel + Render + Supabase`.
- `/api/*` is the current compatibility surface and should not be broken casually.
- Prisma files are stale reference material unless the task is explicitly about Prisma migration.

## Working Principles

- Prefer the smallest correct change over a redesign.
- Reuse existing abstractions before inventing new ones.
- Preserve current API compatibility under `/api/*` unless the task explicitly allows breaking changes.
- After impactful changes, test student, recruiter, and admin flows, not just one page.
- Bias toward practical product improvements that help the competition story:
  - impact
  - practicality
  - implementation quality
  - presentation clarity

## Best Prompt To Use When

- You need a feature plan: use `Feature planning` from [PROMPTS.md](/C:/Dev/esencelab/PROMPTS.md)
- You need a technical design: use `Technical specification`
- You need a small implementation: use `Implement a feature`
- You need debugging help: use `General debugging` or `Production bug`
- You need a review of risky changes: use `General code review` or `Security review`
- You need competition-focused advice: use the prompts in the `Competition workflows` section below

## Ready-To-Use Prompts

### 1. Role-Based Feature Planning
> Convert this Esencelab feature request into an execution-ready plan.
>
> Context:
> - frontend is in `frontend`
> - backend runtime logic is mainly in `backend/src/index.ts`
> - student intelligence logic is in `backend/src/careerEngine.ts`
> - types are shared in `frontend/src/types/index.ts`
> - current roles are student, employer, and admin
>
> Requirements:
> - follow existing patterns
> - preserve `/api/*` compatibility
> - call out student, recruiter, and admin impact separately when relevant
> - include data model changes, API changes, UI changes, tests, risks, and rollout notes
> - prefer the smallest valuable version

### 2. Backend Change Prompt
> Implement the smallest correct backend change for Esencelab.
>
> Before changing code:
> - inspect `backend/src/index.ts`, `backend/src/careerEngine.ts`, and `backend/src/supabaseStore.ts`
> - identify existing route patterns and role checks
> - preserve current `/api/*` contracts unless explicitly told otherwise
>
> Then:
> - make the smallest safe change
> - update persistence behavior if needed
> - handle role-based access correctly
> - add or recommend the highest-value tests
> - mention any impact on student, recruiter, or admin flows

### 3. Frontend Change Prompt
> Implement this frontend change in Esencelab using existing page and component patterns.
>
> Before changing code:
> - inspect the relevant page under `frontend/src/app`
> - inspect `frontend/src/lib/dashboardApi.ts`
> - inspect `frontend/src/types/index.ts`
> - reuse shared UI components where possible
>
> Constraints:
> - preserve existing role-aware navigation
> - keep the visual style consistent with the current public and dashboard UI
> - prefer integration over new abstraction
> - include obvious loading, empty, and error states

### 4. Auth / Role Bug Debugging Prompt
> Debug this Esencelab auth or role-access issue systematically.
>
> Investigate:
> - `frontend/src/contexts/AuthContext.tsx`
> - `frontend/src/lib/useRoleAccess.ts`
> - `backend/src/index.ts` auth routes and `requireRoles`
> - deployment env assumptions if the issue only happens in hosted environments
>
> I want:
> - the observed symptom
> - the exact affected code path
> - the most likely root cause
> - the smallest safe fix
> - how to validate it across student, recruiter, and admin

### 5. Deployment Troubleshooting Prompt
> Troubleshoot this Esencelab deployment issue for the current hosted setup:
> - frontend on Vercel
> - backend on Render
> - AI service on Render
> - database on Supabase
>
> Check:
> - frontend rewrites in `frontend/next.config.js`
> - backend health at `/api/health`
> - AI health at `/health`
> - required env variables
> - whether the issue is local to deployment or present in code
>
> Give:
> - likely root cause
> - immediate mitigation
> - permanent fix
> - exact validation steps

### 6. Test Gap Prompt
> Review this Esencelab change and identify the highest-value missing tests.
>
> Focus on:
> - role-based access
> - student resume and career flows
> - recruiter job/applicant flows
> - admin monitoring/moderation flows
> - deployment-sensitive behavior
> - regression-prone paths in `backend/src/index.ts`
>
> Prioritize tests by user impact and likelihood of breakage.

### 7. Competition Product Audit Prompt
> Audit Esencelab as a competition product for a tier-3 college setting.
>
> Evaluate:
> - sustainability
> - impact
> - technical depth
> - implementation quality
> - design and practicality
> - scalability
> - presentation strength
> - novelty
>
> Base the audit on the current codebase, not imagined features.
> Then recommend the top 5 improvements that increase judging strength fastest.

## Competition Workflows

### Turn The Product Into A Tier-3 College Story
> Based on the current Esencelab codebase, reposition the product for a tier-3 college placement context.
>
> Do not invent an alumni-heavy or enterprise-heavy strategy.
> Instead focus on:
> - placement readiness
> - resume quality
> - skill-gap visibility
> - structured preparation
> - recruiter shortlisting efficiency
> - placement-cell practicality
>
> Show:
> - what already exists in the codebase
> - what should be emphasized in the pitch
> - what small additions would increase judging strength

### Identify Demo Risks Before Presentation
> Review Esencelab for demo-day risk.
>
> Focus on:
> - hosted deployment health
> - login issues
> - missing seed/demo data
> - empty states
> - routes likely to fail on first use
> - role-based flows that need manual setup
>
> Give:
> - the top likely demo failures
> - how to prevent each one
> - a recommended pre-demo checklist

### Generate Judge-Facing Summary
> Summarize Esencelab for innovation-competition judges.
>
> Use the current implemented system.
> Explain:
> - the real user problem
> - how the system works
> - what makes it useful in a tier-3 college context
> - what is technically strong
> - what makes it more than just a job portal
>
> Keep it practical, concrete, and credible.

## Review And Analysis Prompts

### Code Review For This Stack
> Review this Esencelab change like a senior product engineer.
>
> Focus on:
> - correctness
> - role-based behavior
> - persistence consistency
> - frontend-backend contract alignment
> - deployment implications
> - regression risk in `backend/src/index.ts`
>
> Prioritize findings by real product risk, not stylistic preference.

### Architecture Reality Check
> Evaluate the current Esencelab architecture honestly.
>
> Cover:
> - what is clean and stable
> - what is brittle
> - what scales for demo vs production
> - how Supabase is used today
> - where the current source of truth actually lives
> - what should not be overclaimed in a competition presentation

## Team Workflow Suggestions

- Use [PROMPTS.md](/C:/Dev/esencelab/PROMPTS.md) when you need a generic engineering prompt.
- Use this guide when the work is specific to Esencelab’s codebase or competition goals.
- When using an AI coding tool, include:
  - the exact user goal
  - the target role or workflow
  - the success criteria
  - whether the task is local, deployed, or competition-facing

## Recommended Default Prompt For Daily Use

> Implement the smallest correct change in the existing Esencelab codebase.
>
> First inspect the relevant files and reuse current patterns.
> Preserve `/api/*` compatibility unless explicitly asked to change it.
> Treat `backend/src/index.ts` and `backend/src/careerEngine.ts` as runtime sources of truth.
> Treat Prisma as stale unless the task is explicitly about migrating Prisma.
> Handle role-based access correctly for student, recruiter, and admin.
> Add or recommend the highest-value tests.
> Keep the change practical, reversible, and competition-safe.
