# Scaling Roadmap

## Near-term priorities

1. Split large backend and AI service files into routers/services/config modules.
2. Add automated tests around auth, resume upload, job posting, applications, and AI fallback behavior.
3. Add CI that runs builds, audits, and Python syntax checks on every pull request.
4. Move expensive recommendation and parsing workflows toward background jobs if traffic grows.
5. Add production observability: request tracing, structured logs, error alerts, and slow-endpoint dashboards.

## Data scaling

- Keep Supabase schema as the production source of truth.
- Add indexes alongside new query patterns.
- Keep audit logs append-only and prune/export old operational metrics when needed.
- Avoid storing large raw files directly in database rows; use object storage for uploaded assets.

## API scaling

- Keep request handlers thin.
- Add pagination to any list endpoint before exposing it to high-volume users.
- Cache read-heavy public/reference data with clear invalidation rules.
- Use strict request validation for all write endpoints.

## AI-service scaling

- Keep AI service stateless.
- Limit upload sizes and request timeouts.
- Cache assistant responses briefly for repeated prompts.
- Move heavy parsing/matching jobs to a queue if request latency becomes unacceptable.

## Team scaling

- Keep frontend, backend, AI, and data ownership explicit.
- Require builds and audits before merges.
- Document every production environment variable and owner.
