# Security Policy

## Supported surface

This repository contains three runtime surfaces:

- Next.js frontend
- Express backend API
- FastAPI AI service

## Reporting vulnerabilities

Do not open a public issue with secrets or exploit details. Report privately to the project maintainers.

## Secret handling

- Never commit production secrets, demo credentials, JWT secrets, service tokens, database keys, or API keys.
- Use `.env.local` for local development and platform-managed environment variables in hosted environments.
- Rotate any token that was ever shared outside a local disposable environment.

## Baseline checks

Before deployment, run:

- `npm --prefix backend audit --omit=dev`
- `npm --prefix frontend audit --omit=dev`
- `npm run build --prefix backend`
- `npm run build --prefix frontend`
- `python -m py_compile ai-service/app/main.py`

## Production expectations

- Backend production must use `DATA_PROVIDER=supabase`.
- `JWT_SECRET` and `AI_INTERNAL_AUTH_TOKEN` must be non-placeholder values with at least 32 and 24 characters respectively.
- Backend-to-AI calls should include the shared internal token.
- Public health endpoints should avoid exposing secrets or detailed runtime internals.
