from __future__ import annotations

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

"""
Main AI service used by the backend.

This module is the single AI-focused backend for the platform. It handles:

1. Resume parsing from uploaded PDF files
2. Skill extraction from raw resume text
3. Resume-to-job matching
4. Student assistant calls that use Groq when a key is available

The service is intentionally defensive:
- it falls back when optional NLP libraries are missing
- it returns safe default guidance when the external AI provider is unavailable
- it caches student assistant responses briefly to reduce latency and cost
"""

import io
import json
import hashlib
import logging
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

try:
    import numpy as np
except Exception:  # pragma: no cover
    np = None

try:
    import pdfplumber
except Exception:  # pragma: no cover
    pdfplumber = None

try:
    import PyPDF2
except Exception:  # pragma: no cover
    PyPDF2 = None

try:
    import spacy
except Exception:  # pragma: no cover
    spacy = None

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except Exception:  # pragma: no cover
    TfidfVectorizer = None
    cosine_similarity = None

app = FastAPI(title="EsenceLab AI Service")
NODE_ENV = str(os.getenv("NODE_ENV", "development")).strip().lower()
IS_PRODUCTION = NODE_ENV == "production"
AI_INTERNAL_AUTH_TOKEN = str(os.getenv("AI_INTERNAL_AUTH_TOKEN", "")).strip()
MAX_RESUME_FILE_SIZE_MB = max(1, min(8, int(os.getenv("AI_MAX_UPLOAD_MB", "4"))))
MAX_RESUME_FILE_SIZE_BYTES = MAX_RESUME_FILE_SIZE_MB * 1024 * 1024
LOG_LEVEL = str(os.getenv("LOG_LEVEL", "INFO")).strip().upper() or "INFO"

logging.basicConfig(level=getattr(logging, LOG_LEVEL, logging.INFO), format="%(message)s")
logger = logging.getLogger("esencelab.ai")


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _log_event(level: str, event: str, **payload: Any) -> None:
    entry = {
        "ts": _timestamp(),
        "level": level.lower(),
        "event": event,
        **payload,
    }
    getattr(logger, level.lower(), logger.info)(json.dumps(entry, ensure_ascii=True))


def _serialize_error(error: Exception) -> Dict[str, Any]:
    return {
        "type": error.__class__.__name__,
        "message": str(error),
    }


def _load_local_env() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return
    try:
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value
    except Exception:
        # Non-blocking for local demos if env parsing fails.
        return


_load_local_env()


def _parse_allowed_origins() -> List[str]:
    raw = os.getenv("AI_ALLOWED_ORIGINS", "").strip()
    if not raw:
        return ["*"] if not IS_PRODUCTION else []
    if raw == "*":
        return ["*"]
    return [entry.strip() for entry in raw.split(",") if entry.strip()]


ALLOWED_ORIGINS = _parse_allowed_origins()
ALLOW_CREDENTIALS = ALLOWED_ORIGINS != ["*"]


def _looks_like_placeholder_value(value: str) -> bool:
    normalized = value.strip().lower()
    if not normalized:
        return True
    return (
        normalized.startswith("change-this")
        or normalized.startswith("your-")
        or "example" in normalized
        or normalized == "xxx"
    )


def _assert_production_safety() -> None:
    if not IS_PRODUCTION:
        return
    if not ALLOWED_ORIGINS or ALLOWED_ORIGINS == ["*"]:
        raise RuntimeError("Production requires explicit AI_ALLOWED_ORIGINS values.")
    if not AI_INTERNAL_AUTH_TOKEN or len(AI_INTERNAL_AUTH_TOKEN) < 24 or _looks_like_placeholder_value(AI_INTERNAL_AUTH_TOKEN):
        raise RuntimeError("Production requires AI_INTERNAL_AUTH_TOKEN with at least 24 non-placeholder characters.")
    for origin in ALLOWED_ORIGINS:
        parsed = urllib.parse.urlparse(origin)
        if not parsed.scheme or not parsed.netloc:
            raise RuntimeError(f"Invalid AI_ALLOWED_ORIGINS origin: {origin}")
        is_local = parsed.hostname in {"localhost", "127.0.0.1"}
        if not is_local and parsed.scheme != "https":
            raise RuntimeError(f"Production AI_ALLOWED_ORIGINS must use https: {origin}")


_assert_production_safety()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", "").strip() or uuid4().hex
    request.state.request_id = request_id

    if AI_INTERNAL_AUTH_TOKEN and request.url.path.startswith("/ai/"):
        provided_token = request.headers.get("x-internal-service-token", "").strip()
        if provided_token != AI_INTERNAL_AUTH_TOKEN:
            _log_event(
                "warning",
                "auth.internal_token_rejected",
                requestId=request_id,
                method=request.method,
                path=request.url.path,
            )
            return JSONResponse(
                status_code=401,
                content={
                    "error": "not_authenticated",
                    "message": "Not authenticated",
                    "code": "NOT_AUTHENTICATED",
                    "requestId": request_id,
                },
            )

    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:
        duration_ms = round((time.perf_counter() - started) * 1000)
        _log_event(
            "error",
            "http.request.failed",
            requestId=request_id,
            method=request.method,
            path=request.url.path,
            latencyMs=duration_ms,
            error=_serialize_error(exc),
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_server_error",
                "message": "Internal server error",
                "code": "INTERNAL_SERVER_ERROR",
                "requestId": request_id,
            },
        )

    duration_ms = round((time.perf_counter() - started) * 1000)
    level = "info"
    if response.status_code >= 500:
        level = "error"
    elif response.status_code >= 400 or duration_ms >= 1200:
        level = "warning"
    _log_event(
        level,
        "http.request.completed",
        requestId=request_id,
        method=request.method,
        path=request.url.path,
        statusCode=response.status_code,
        latencyMs=duration_ms,
    )
    response.headers["X-Request-Id"] = request_id
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    message = str(exc.detail or "Request failed")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "request_failed" if exc.status_code < 500 else "internal_server_error",
            "message": message if exc.status_code < 500 else "Internal server error",
            "code": "REQUEST_FAILED" if exc.status_code < 500 else "INTERNAL_SERVER_ERROR",
            "requestId": getattr(request.state, "request_id", None),
        },
    )

NLP_MODEL = None
if spacy:
    try:
        NLP_MODEL = spacy.load("en_core_web_sm")
    except Exception:
        NLP_MODEL = None

SKILL_KEYWORDS = [
    "python", "javascript", "typescript", "java", "c++", "c#", "ruby", "go", "rust", "php",
    "react", "angular", "vue", "node.js", "express", "django", "flask", "spring", "rails",
    "html", "css", "sass", "tailwind", "bootstrap",
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "git",
    "machine learning", "deep learning", "tensorflow", "pytorch", "keras", "scikit-learn",
    "data analysis", "data science", "data engineering", "etl", "pandas", "numpy",
    "nlp", "natural language processing", "computer vision", "opencv",
    "agile", "scrum", "jira", "confluence",
    "rest api", "graphql", "microservices",
    "linux", "unix", "bash", "shell scripting",
    "testing", "unit testing", "integration testing", "selenium", "jest",
    "ci/cd", "devops", "firebase", "figma",
]

EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z|a-z]{2,}\b")
PHONE_REGEX = re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")
YEAR_REGEX = re.compile(r"\b(?:19|20)\d{2}\b")

EDUCATION_KEYWORDS = [
    "education",
    "academic",
    "qualification",
]

EXPERIENCE_KEYWORDS = [
    "experience",
    "work history",
    "employment",
    "internship",
]

SUPPORTED_STUDENT_FEATURES = {
    "skill_gap",
    "resume_improvement",
    "interview_prep",
    "project_ideas",
    "study_plan",
}

STUDENT_ASSISTANT_PROMPTS = {
    "skill_gap": "Analyze skill gaps and suggest high-impact next skills with practical actions.",
    "resume_improvement": "Improve resume quality with precise, ATS-friendly and recruiter-friendly suggestions.",
    "interview_prep": "Generate technical and behavioral interview prep advice with actionable practice steps.",
    "project_ideas": "Suggest portfolio-worthy project ideas aligned to the target role and missing skills.",
    "study_plan": "Create a concise weekly study plan with milestones and realistic outcomes.",
}

ASSISTANT_CACHE_TTL_SEC = int(os.getenv("STUDENT_ASSISTANT_CACHE_TTL_SEC", "300"))
_assistant_cache: Dict[str, Dict[str, Any]] = {}


class ResumeParseResponse(BaseModel):
    parsedData: Dict[str, Any]
    skills: List[str]


class MatchRequest(BaseModel):
    resumeSkills: List[str]
    jobRequirements: str
    jobRequiredSkills: Optional[List[str]] = None
    includeExplanation: bool = False


class MatchResponse(BaseModel):
    matchScore: float
    matchedSkills: List[str]
    missingSkills: List[str]
    explanation: Optional[str] = None


class StudentAssistantRequest(BaseModel):
    feature: str
    prompt: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)


class StudentAssistantResponse(BaseModel):
    provider: str
    model: Optional[str] = None
    feature: str
    title: str
    summary: str
    actionItems: List[str]
    followUpQuestions: List[str]


def extract_text_from_pdf_bytes(content: bytes) -> str:
    text_chunks: List[str] = []

    if pdfplumber is not None:
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    text_chunks.append(page.extract_text() or "")
            extracted = "\n".join(text_chunks).strip()
            if extracted:
                return extracted
        except Exception:
            pass

    if PyPDF2 is not None:
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in reader.pages:
                text_chunks.append(page.extract_text() or "")
            return "\n".join(text_chunks).strip()
        except Exception:
            pass

    raise ValueError("Could not extract text from PDF")


def preprocess_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def extract_name(lines: List[str], normalized_text: str) -> Optional[str]:
    if NLP_MODEL:
        try:
            doc = NLP_MODEL(normalized_text[:5000])
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    candidate = ent.text.strip()
                    if len(candidate.split()) <= 4:
                        return candidate
        except Exception:
            pass

    for line in lines[:10]:
        clean = line.strip()
        if not clean:
            continue
        if any(token in clean.lower() for token in ["resume", "curriculum", "vitae", "email", "phone"]):
            continue
        if len(clean.split()) <= 4 and len(clean) <= 40:
            return clean

    return None


def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found_skills: List[str] = []

    for skill in SKILL_KEYWORDS:
        if skill in text_lower:
            formatted = skill.title() if len(skill) > 3 else skill.upper()
            if formatted not in found_skills:
                found_skills.append(formatted)

    return found_skills


def split_sections(lines: List[str]) -> Dict[str, List[str]]:
    sections: Dict[str, List[str]] = {
        "education": [],
        "experience": [],
        "summary": [],
    }
    current_section: Optional[str] = None

    for line in lines:
        lower = line.lower()
        if any(keyword in lower for keyword in EDUCATION_KEYWORDS):
            current_section = "education"
            continue
        if any(keyword in lower for keyword in EXPERIENCE_KEYWORDS):
            current_section = "experience"
            continue
        if any(keyword in lower for keyword in ["summary", "objective", "profile"]):
            current_section = "summary"
            continue

        if current_section and line.strip():
            sections[current_section].append(line.strip())

    return sections


def parse_education_entries(lines: List[str]) -> List[Dict[str, str]]:
    entries: List[Dict[str, str]] = []
    for line in lines[:8]:
        year_match = YEAR_REGEX.search(line)
        year = year_match.group(0) if year_match else ""
        cleaned = line.replace(year, "").strip(" ,-") if year else line.strip()
        if not cleaned:
            continue
        entries.append(
            {
                "institution": cleaned,
                "degree": "",
                "field": "",
                "year": year,
            }
        )
    return entries


def parse_experience_entries(lines: List[str]) -> List[Dict[str, str]]:
    entries: List[Dict[str, str]] = []
    for line in lines[:10]:
        year_matches = YEAR_REGEX.findall(line)
        duration = ""
        if len(year_matches) >= 2:
            duration = f"{year_matches[0]} - {year_matches[-1]}"
        elif len(year_matches) == 1:
            duration = year_matches[0]
        clean_line = line.strip()
        if not clean_line:
            continue
        entries.append(
            {
                "company": clean_line,
                "title": "",
                "duration": duration,
                "description": clean_line,
            }
        )
    return entries


def extract_orgs_and_dates(text: str) -> Dict[str, List[str]]:
    organizations: List[str] = []
    dates: List[str] = []

    if NLP_MODEL:
        try:
            doc = NLP_MODEL(text[:15000])
            for ent in doc.ents:
                if ent.label_ == "ORG" and ent.text not in organizations:
                    organizations.append(ent.text.strip())
                if ent.label_ in {"DATE", "TIME"} and ent.text not in dates:
                    dates.append(ent.text.strip())
        except Exception:
            pass

    if not dates:
        for match in YEAR_REGEX.findall(text):
            year = str(match)
            if year not in dates:
                dates.append(year)

    return {"organizations": organizations[:20], "dates": dates[:30]}


def parse_resume_text(text: str) -> Dict[str, Any]:
    """
    Convert free-form resume text into the structured fields used elsewhere.

    The parser is intentionally simple and predictable. It combines regex,
    section splitting, lightweight entity extraction, and skill lookup so the
    backend can still work in local or low-dependency environments.
    """
    normalized_text = preprocess_text(text)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sections = split_sections(lines)

    emails = EMAIL_REGEX.findall(text)
    phones = PHONE_REGEX.findall(text)
    skills = extract_skills(normalized_text)
    entities = extract_orgs_and_dates(text)

    summary = " ".join(sections["summary"][:3]).strip() if sections["summary"] else None

    if not summary:
        for line in lines:
            lower = line.lower()
            if any(keyword in lower for keyword in ["summary", "objective", "profile"]) and len(line) > 20:
                summary = line
                break

    parsed = {
        "name": extract_name(lines, normalized_text),
        "email": emails[0] if emails else None,
        "phone": phones[0] if phones else None,
        "summary": summary,
        "education": parse_education_entries(sections["education"]),
        "experience": parse_experience_entries(sections["experience"]),
        "skills": skills,
        "organizations": entities["organizations"],
        "dates": entities["dates"],
    }

    return parsed


def empty_parsed_resume() -> Dict[str, Any]:
    return {
        "name": None,
        "email": None,
        "phone": None,
        "summary": None,
        "education": [],
        "experience": [],
        "skills": [],
        "organizations": [],
        "dates": [],
    }


def normalize_skill_list(skills: List[str]) -> List[str]:
    deduped: Dict[str, str] = {}
    for skill in skills:
        cleaned = str(skill or "").strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key not in deduped:
            deduped[key] = cleaned
    return list(deduped.values())


def calculate_tfidf_match(
    resume_skills: List[str],
    required_skills: List[str],
    job_requirements: str = "",
) -> float:
    """
    Compute a similarity score between resume skills and job requirements.

    When scikit-learn is available, we use TF-IDF plus cosine similarity.
    Otherwise we fall back to a deterministic skill-overlap ratio so matching
    still works in reduced environments.
    """
    if not resume_skills or (not required_skills and not job_requirements.strip()):
        return 0.0

    resume_text = " ".join(resume_skills)
    required_text = " ".join(required_skills).strip() or job_requirements.strip()
    corpus = [resume_text, required_text]

    if TfidfVectorizer is None or cosine_similarity is None:
        resume_set = {skill.lower() for skill in resume_skills}
        required_set = {skill.lower() for skill in required_skills} or {
            skill.lower() for skill in extract_skills(job_requirements)
        }
        if not required_set:
            return 0.0
        return len(resume_set & required_set) / len(required_set)

    vectorizer = TfidfVectorizer(ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform(corpus)
    score = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
    return max(0.0, min(score, 1.0))


def generate_explanation(match_score: float, matched: List[str], missing: List[str]) -> str:
    if match_score >= 0.75:
        verdict = "strong match"
    elif match_score >= 0.5:
        verdict = "moderate match"
    else:
        verdict = "low match"

    missing_hint = ", ".join(missing[:5]) if missing else "no major gaps"
    return f"Candidate is a {verdict}. Matched skills: {', '.join(matched[:6]) or 'none'}. Missing focus areas: {missing_hint}."


def _compact_context(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Keep only the fields that matter for the student assistant request.

    This protects latency and token usage by trimming large objects before we
    send the payload to Groq.
    """
    role = str(context.get("targetRole") or "").strip()
    skills = [str(item).strip() for item in (context.get("skills") or []) if str(item).strip()]
    missing_skills = [str(item).strip() for item in (context.get("missingSkills") or []) if str(item).strip()]
    resume_summary = str(context.get("resumeSummary") or "").strip()
    readiness = context.get("readinessScore")
    roadmap_highlights = [
        str(item).strip()
        for item in (context.get("roadmapHighlights") or [])
        if str(item).strip()
    ]
    top_resources = []
    for item in (context.get("topResources") or [])[:3]:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        provider = str(item.get("provider") or "").strip()
        url = str(item.get("url") or "").strip()
        if title:
            top_resources.append(
                {
                    "title": title[:120],
                    "provider": provider[:80],
                    "url": url[:240],
                }
            )
    top_jobs = []
    for item in (context.get("topRecommendedJobs") or [])[:3]:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        company = str(item.get("company") or "").strip()
        match_score = item.get("matchScore")
        if title:
            top_jobs.append(
                {
                    "title": title[:120],
                    "company": company[:120],
                    "matchScore": match_score,
                }
            )
    score_sections = context.get("scoreSections") or {}
    application_status_counts = context.get("applicationStatusCounts") or {}
    role = role[:120]
    resume_summary = resume_summary[:700]
    skills = skills[:30]
    missing_skills = missing_skills[:30]
    roadmap_highlights = roadmap_highlights[:8]
    return {
        "targetRole": role,
        "skills": skills,
        "missingSkills": missing_skills,
        "resumeSummary": resume_summary,
        "readinessScore": readiness,
        "roadmapHighlights": roadmap_highlights,
        "topResources": top_resources,
        "topRecommendedJobs": top_jobs,
        "scoreSections": score_sections,
        "applicationStatusCounts": application_status_counts,
    }


def _assistant_cache_key(feature: str, prompt: str, context: Dict[str, Any]) -> str:
    payload = {
        "feature": feature,
        "prompt": prompt.strip().lower(),
        "context": _compact_context(context),
    }
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _prune_assistant_cache() -> None:
    now = time.time()
    stale_keys = [key for key, entry in _assistant_cache.items() if entry.get("expiresAt", 0) <= now]
    for key in stale_keys:
        _assistant_cache.pop(key, None)


def _extract_json_object(raw_text: str) -> Dict[str, Any]:
    text = (raw_text or "").strip()
    if not text:
        return {}

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        candidate = text[start : end + 1]
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return {}
    return {}


def _fallback_student_assistant(feature: str, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
    clean_context = _compact_context(context)
    role = clean_context.get("targetRole") or "your target role"
    missing = clean_context.get("missingSkills") or []
    top_missing = ", ".join(missing[:3]) if missing else "core role skills"

    if feature == "resume_improvement":
        return {
            "provider": "fallback",
            "model": None,
            "feature": feature,
            "title": "Resume Upgrade Plan",
            "summary": f"Improve your resume for {role} with stronger impact-based bullet points and clearer skill evidence.",
            "actionItems": [
                "Rewrite top 3 project bullets using action + outcome + metric format.",
                "Place role-relevant skills in a focused skills section near the top.",
                "Add one quantified achievement for internship or project work.",
                "Keep resume length to one page with consistent section headings.",
            ],
            "followUpQuestions": [
                "Do you want bullet-point rewrites for one project?",
                "Should I generate ATS keywords for your target role?",
            ],
        }

    if feature == "interview_prep":
        return {
            "provider": "fallback",
            "model": None,
            "feature": feature,
            "title": "Interview Prep Sprint",
            "summary": f"Prepare for {role} interviews with focused technical practice and concise storytelling.",
            "actionItems": [
                "Practice 5 role-specific technical questions and time each answer to 90 seconds.",
                "Prepare 3 STAR-format stories for teamwork, failure, and ownership.",
                "Review one project deeply: architecture, tradeoffs, and performance decisions.",
                "Run one mock interview this week and note weak areas.",
            ],
            "followUpQuestions": [
                "Need 10 likely interview questions for your role?",
                "Want a mock interviewer checklist?",
            ],
        }

    if feature == "project_ideas":
        return {
            "provider": "fallback",
            "model": None,
            "feature": feature,
            "title": "Portfolio Project Ideas",
            "summary": f"Build role-aligned projects that close gaps in {top_missing}.",
            "actionItems": [
                f"Project 1: Build a mini app focused on {missing[0] if missing else 'core backend/frontend'} with deployment.",
                "Project 2: Add analytics, testing, and monitoring to show production readiness.",
                "Project 3: Publish architecture notes and a walkthrough video in your portfolio.",
                "Track measurable outcomes: performance, uptime, or user interactions.",
            ],
            "followUpQuestions": [
                "Should I break one project into weekly milestones?",
                "Need project ideas tailored to your current skill stack?",
            ],
        }

    if feature == "study_plan":
        return {
            "provider": "fallback",
            "model": None,
            "feature": feature,
            "title": "4-Week Learning Plan",
            "summary": f"Structured plan for {role} with focus on {top_missing}.",
            "actionItems": [
                "Week 1: Strengthen one missing core skill and finish 6-8 guided lessons.",
                "Week 2: Build a small feature project using that skill.",
                "Week 3: Add tests, edge-case handling, and deployment.",
                "Week 4: Revise resume + portfolio and do one mock interview.",
            ],
            "followUpQuestions": [
                "Want this converted to a daily checklist?",
                "Need free learning resources mapped to each week?",
            ],
        }

    return {
        "provider": "fallback",
        "model": None,
        "feature": "skill_gap",
        "title": "Skill Gap Action Plan",
        "summary": f"Prioritize the highest-impact missing skills for {role}: {top_missing}.",
        "actionItems": [
            "Pick one missing skill and complete a guided learning module this week.",
            "Implement that skill in a mini project section and document outcomes.",
            "Update resume skills and project bullets after completion.",
            "Measure progress by weekly mock interview or coding challenge.",
        ],
        "followUpQuestions": [
            "Should I rank missing skills by hiring impact?",
            "Want a beginner-to-advanced resource path?",
        ],
    }


def _call_groq_assistant(feature: str, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip() or "openai/gpt-oss-120b"
    reasoning_effort = os.getenv("GROQ_REASONING_EFFORT", "high").strip().lower() or "high"
    service_tier = os.getenv("GROQ_SERVICE_TIER", "auto").strip().lower() or "auto"
    if not api_key:
        return _fallback_student_assistant(feature, prompt, context)

    feature_hint = STUDENT_ASSISTANT_PROMPTS.get(feature, STUDENT_ASSISTANT_PROMPTS["skill_gap"])
    clean_context = _compact_context(context)
    safe_prompt = prompt.strip()[:1200]
    system_prompt = (
        "You are a direct, practical AI career coach for students. "
        "Use the student context to give high-value advice that is specific, realistic, and immediately useful. "
        "Prefer next actions that improve resume strength, interview readiness, role fit, and portfolio quality. "
        "When resources are present in the context, use them in the action plan instead of generic advice. "
        "Return strict JSON only with keys: title, summary, actionItems, followUpQuestions. "
        "actionItems and followUpQuestions must be arrays of short strings. "
        "No markdown, no extra keys."
    )
    user_payload = {
        "task": feature_hint,
        "feature": feature,
        "studentContext": clean_context,
        "studentPrompt": safe_prompt or "Provide concise actionable guidance.",
    }

    body = {
        "model": model,
        "temperature": 0.2,
        "max_tokens": 900,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=True)},
        ],
    }
    if "llama-3.3" in model or "llama-3.1" in model:
        body["response_format"] = {"type": "json_object"}
    if "gpt-oss" in model:
        body["reasoning_effort"] = reasoning_effort
        body["service_tier"] = service_tier

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "User-Agent": "EsenceLab-AI/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=22) as response:
            payload = json.loads(response.read().decode("utf-8"))
            content = (
                payload.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )
            parsed = _extract_json_object(content)
            title = str(parsed.get("title") or "").strip() or "AI Career Guidance"
            summary = str(parsed.get("summary") or "").strip()
            action_items = [
                str(item).strip()
                for item in (parsed.get("actionItems") or [])
                if str(item).strip()
            ][:8]
            follow_ups = [
                str(item).strip()
                for item in (parsed.get("followUpQuestions") or [])
                if str(item).strip()
            ][:5]

            if not summary or not action_items:
                return _fallback_student_assistant(feature, prompt, context)

            return {
                "provider": "groq",
                "model": model,
                "feature": feature,
                "title": title[:120],
                "summary": summary[:900],
                "actionItems": action_items,
                "followUpQuestions": follow_ups or [
                    "Do you want a more advanced version of this plan?"
                ],
            }
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError):
        return _fallback_student_assistant(feature, prompt, context)


@app.get("/")
async def root():
    return {"message": "EsenceLab AI Service is running"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "groqConfigured": bool(str(os.getenv("GROQ_API_KEY", "")).strip()),
        "allowedOriginsConfigured": 0 if ALLOWED_ORIGINS == ["*"] else len(ALLOWED_ORIGINS),
        "assistantCacheSize": len(_assistant_cache),
    }


@app.post("/ai/parse-resume", response_model=ResumeParseResponse)
async def parse_resume_endpoint(request: Request, file: UploadFile = File(...)):
    filename = str(file.filename or "").strip().lower()
    if not filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        content = await file.read()
        if len(content) > MAX_RESUME_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {MAX_RESUME_FILE_SIZE_MB}MB.",
            )
        parsed_data = empty_parsed_resume()

        try:
            text = extract_text_from_pdf_bytes(content)
            if text:
                parsed_data = parse_resume_text(text)
        except Exception as exc:
            _log_event(
                "warning",
                "resume.parse.fallback_used",
                requestId=getattr(request.state, "request_id", None),
                error=_serialize_error(exc),
            )
        # Do not fail the full flow for malformed or scanned PDFs.
            parsed_data = empty_parsed_resume()

        return ResumeParseResponse(parsedData=parsed_data, skills=parsed_data.get("skills", []))
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        _log_event(
            "error",
            "resume.parse.failed",
            requestId=getattr(request.state, "request_id", None),
            error=_serialize_error(exc),
        )
        raise HTTPException(status_code=500, detail="Failed to parse resume")


@app.post("/ai/match", response_model=MatchResponse)
async def match_jobs(request: MatchRequest, http_request: Request):
    try:
        resume_skills = normalize_skill_list(request.resumeSkills)
        job_skills = normalize_skill_list(
            request.jobRequiredSkills if request.jobRequiredSkills else extract_skills(request.jobRequirements)
        )

        resume_set = {skill.lower() for skill in resume_skills}
        job_set = {skill.lower() for skill in job_skills}
        display_map = {skill.lower(): skill for skill in job_skills}

        matched = sorted([display_map.get(skill, skill.title()) for skill in (resume_set & job_set)])
        missing = sorted([display_map.get(skill, skill.title()) for skill in (job_set - resume_set)])

        skill_overlap = len(matched) / len(job_set) if job_set else 0.0
        tfidf_score = calculate_tfidf_match(
            resume_skills,
            job_skills,
            request.jobRequirements,
        )
        final_score = round(((skill_overlap * 0.55) + (tfidf_score * 0.45)), 4)

        explanation = generate_explanation(final_score, matched, missing) if request.includeExplanation else None

        return MatchResponse(
            matchScore=max(0.0, min(final_score, 1.0)),
            matchedSkills=matched,
            missingSkills=missing,
            explanation=explanation,
        )
    except Exception as exc:
        _log_event(
            "error",
            "match.failed",
            requestId=getattr(http_request.state, "request_id", None),
            error=_serialize_error(exc),
        )
        raise HTTPException(status_code=500, detail="Failed to calculate match")


@app.post("/ai/extract-skills")
async def extract_skills_endpoint(http_request: Request, text: str = Form(...)):
    try:
        return {"skills": extract_skills(preprocess_text(text))}
    except Exception as exc:
        _log_event(
            "error",
            "skills.extract.failed",
            requestId=getattr(http_request.state, "request_id", None),
            error=_serialize_error(exc),
        )
        raise HTTPException(status_code=500, detail="Failed to extract skills")


@app.post("/ai/student-assistant", response_model=StudentAssistantResponse)
async def student_assistant_endpoint(request: StudentAssistantRequest, http_request: Request):
    feature = str(request.feature or "").strip().lower()
    if feature not in SUPPORTED_STUDENT_FEATURES:
        feature = "skill_gap"

    prompt = str(request.prompt or "").strip()
    context = request.context or {}
    cache_key = _assistant_cache_key(feature, prompt, context)
    _prune_assistant_cache()
    cached = _assistant_cache.get(cache_key)
    if cached and cached.get("expiresAt", 0) > time.time():
        return StudentAssistantResponse(**cached["data"])

    result = _call_groq_assistant(feature, prompt, context)
    # Ensure response safety and shape
    safe_result = {
        "provider": str(result.get("provider") or "fallback"),
        "model": result.get("model"),
        "feature": feature,
        "title": str(result.get("title") or "AI Career Guidance")[:120],
        "summary": str(result.get("summary") or "No guidance generated right now.")[:900],
        "actionItems": [
            str(item).strip()
            for item in (result.get("actionItems") or [])
            if str(item).strip()
        ][:8]
        or ["Try again with a more specific question."],
        "followUpQuestions": [
            str(item).strip()
            for item in (result.get("followUpQuestions") or [])
            if str(item).strip()
        ][:5],
    }

    _assistant_cache[cache_key] = {
        "expiresAt": time.time() + max(30, ASSISTANT_CACHE_TTL_SEC),
        "data": safe_result,
    }
    _log_event(
        "info",
        "student_assistant.completed",
        requestId=getattr(http_request.state, "request_id", None),
        feature=feature,
        provider=safe_result["provider"],
    )
    return StudentAssistantResponse(**safe_result)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
