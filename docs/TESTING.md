# Testing Strategy

## Current required checks

- Backend TypeScript build
- Frontend Next.js production build
- AI service Python syntax compile
- Backend production dependency audit
- Frontend production dependency audit

## Recommended next tests

### Backend

- Auth registration/login/logout/password flows
- Role-based authorization middleware
- Resume upload and fallback parsing behavior
- Job CRUD and recruiter authorization boundaries
- Application status transitions
- Admin user/resume moderation routes

### Frontend

- Auth redirects and protected dashboard routing
- Student resume upload flow
- Recruiter job creation flow
- Admin moderation pages
- Shared API client 401 handling

### AI service

- PDF text extraction fallback behavior
- Skill extraction normalization
- Resume/job match scoring
- Student assistant fallback when Groq is unavailable
- Internal service token enforcement

## CI recommendation

Add a CI workflow that runs builds, audits, and AI syntax checks on every pull request before merge.
