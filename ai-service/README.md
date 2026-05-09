# Esencelab AI Service

FastAPI service for resume parsing, skill extraction, resume-to-job matching, and optional Groq-backed student assistant responses.

## Local run

Install dependencies:

`python -m pip install -r requirements.txt`

Run the service from this directory:

`python -m uvicorn app.main:app --host 127.0.0.1 --port 3102`

## Required production settings

- `AI_ALLOWED_ORIGINS`
- `AI_INTERNAL_AUTH_TOKEN`

Optional Groq settings:

- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_REASONING_EFFORT`
- `GROQ_SERVICE_TIER`
