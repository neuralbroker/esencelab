# Contributing

## Development principles

- Keep secrets out of source control. Use `.env.local` or platform-managed environment variables.
- Prefer small, cohesive modules over large mixed-responsibility files.
- Validate backend, frontend, and AI service changes before opening a PR.
- Do not commit generated artifacts such as `node_modules`, `.next`, `dist`, logs, PDFs, or local DB files.
- Keep deployment ownership clear: frontend on Vercel, backend and AI service on Render, data on Supabase.

## Required checks before commit

- Backend build: `npm run build --prefix backend`
- Frontend build: `npm run build --prefix frontend`
- AI syntax check: `python -m py_compile ai-service/app/main.py`
- Backend audit: `npm --prefix backend audit --omit=dev`
- Frontend audit: `npm --prefix frontend audit --omit=dev`

## Code style

- TypeScript: keep request parsing, business logic, and persistence separate where practical.
- Python: keep route handlers thin and move reusable logic into service modules as the AI service grows.
- UI: extract repeated dashboard/form patterns into shared components before adding new copies.
