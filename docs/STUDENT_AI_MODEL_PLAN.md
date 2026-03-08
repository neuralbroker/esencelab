# Student AI Model Plan

## Objective
Embed an AI model inside the student module to provide practical career guidance while keeping cost near zero and latency low.

## Selected Free AI Provider
**Provider:** Groq API  
**Reason chosen:** best balance of free usage + fast inference + OpenAI-compatible API shape.

### Comparison (free-tier focused)
1. **Groq**
   - Free developer plan available (`$0` shown in billing plans).
   - OpenAI-compatible chat endpoint.
   - Optimized low-latency inference.
2. **Hugging Face Inference Providers**
   - Free monthly credits, but small budget and quickly exhausted for chat-heavy usage.
3. **OpenRouter free models**
   - Has free model variants, but practical throughput/rate limits are lower for continuous student assistant usage.

For this project scope (student coaching + repeated dashboard usage), Groq is the most practical free provider.

## Implemented Architecture
`Frontend (Student dashboard) -> Backend (/api/career/ai-coach, auth + context) -> FastAPI AI service (/ai/student-assistant) -> Groq API`

### Why this architecture
- Keeps API keys on server side only.
- Reuses existing auth and student profile context from backend.
- Allows fallback guidance if external model is unavailable.
- Supports future provider swap without frontend changes.

## Student AI Features Added
1. **Skill Gap Coach**
   - Prioritized missing-skill actions.
2. **Resume Improvement**
   - ATS-friendly and impact-focused improvement checklist.
3. **Interview Prep**
   - Technical + behavioral preparation workflow.
4. **Project Ideas**
   - Role-aligned portfolio project direction.
5. **Study Plan**
   - Actionable short plan for weekly progress.

## Performance-Safe Design
- AI call is on-demand (student clicks “Generate guidance”), not auto-triggered on page load.
- AI service response cache (TTL) to reduce repeated cost and latency.
- Backend timeout + graceful fallback to local guidance.
- Existing frontend/backend caching retained for non-AI dashboard calls.

## Configuration
Set environment variables before running AI service:

- `GROQ_API_KEY=<your_key>`
- `GROQ_MODEL=llama-3.1-8b-instant` (optional override)
- `STUDENT_ASSISTANT_CACHE_TTL_SEC=300` (optional)

If key is not set, system automatically serves fallback guidance so student flow still works.

## Next Extension Ideas
1. Add conversation history persistence per student.
2. Add role-specific prompt templates by domain (backend/frontend/data/ML).
3. Add resource links generation (free courses/docs) with quality filters.
4. Add confidence score and “verify with mentor” hints for critical advice.

