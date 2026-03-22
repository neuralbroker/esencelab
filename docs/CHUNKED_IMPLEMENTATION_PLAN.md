# Chunked Implementation Plan

This plan converts the master spec into build chunks with clear acceptance criteria.

## Chunk Status Legend
- `pending`
- `in_progress`
- `done`

## Chunk 1 - Core Foundation (`done`)
Scope:
- Auth hardening and role compatibility
- Reusable auth/RBAC middleware
- Profile/security endpoints
- Password reset (optional secure flow)

Acceptance criteria:
- Register/login supports student/recruiter/admin (with legacy employer compatibility)
- JWT rejected when invalid or explicitly revoked
- `/api/auth/me`, `/api/auth/logout`, `/api/auth/profile`, `/api/auth/password` work
- `/api/users` admin controls remain functional

## Chunk 2 - Resume Ingestion + Parsing (`done`)
Scope:
- Student PDF upload reliability and validation
- AI parsing handoff and structured storage
- Raw file lifecycle cleanup

Acceptance criteria:
- PDF-only enforcement + size limits
- Parsed JSON persisted in resume domain object
- Upload replacement path preserves latest resume

## Chunk 3 - Scoring + Skill Gap + Recommendations (`done`)
Scope:
- Resume strength scoring
- TF-IDF/cosine gap analysis pipeline
- Job recommendation ranking and explanation output

Acceptance criteria:
- Score 0-100 with section breakdown
- Human-readable matching/missing skills and impact hints
- Top recommendations sorted by descending match

## Chunk 4 - Student Career Ops (`done`)
Scope:
- Skill roadmap
- 30/60-day learning plans
- Mock interview packs + session persistence
- Application tracker lifecycle

Acceptance criteria:
- Roadmap supports completion states
- Learning plans persist and reload by role/duration
- Application statuses editable with notes

## Chunk 5 - Recruiter Experience (`done`)
Scope:
- Recruiter job posting workflows
- Candidate ranking and profile review

Acceptance criteria:
- Recruiters can only manage owned jobs
- Candidate ranking view includes match %, top skills, and profile link

## Chunk 6 - Admin Control Plane (`done`)
Scope:
- User moderation
- Job moderation
- System monitoring statistics

Acceptance criteria:
- Admin can disable/delete users safely
- Admin dashboard reports users/resumes/jobs/applications counts

## Chunk 7 - Frontend Integration + UX Hardening (`pending`)
Scope:
- Role-by-role dashboard alignment
- Clear student/recruiter/admin navigation behavior
- Error states and loading polish

Acceptance criteria:
- End-to-end flows work across all modules
- Responsive behavior verified
- Human-readable UI messaging for AI outputs

## Chunk 8 - Scale & Deployment Readiness (`pending`)
Scope:
- Service boundaries and deployment contracts
- Observability hooks and runtime safeguards

Acceptance criteria:
- Environment-driven configuration for services
- Production-safe startup behavior and health checks
- Documented deployment path for microservice mode
