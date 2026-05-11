import asyncio
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from typing import Any, cast

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import (
    MatchRequest,
    calculate_tfidf_match,
    extract_skills,
    health,
    match_jobs,
    parse_resume_text,
)


class AiServiceSmokeTests(unittest.TestCase):
    def test_skill_extraction_deduplicates_known_skills(self):
        skills = extract_skills(
            "Built Node.js APIs with TypeScript, React, SQL, Docker, and AWS."
        )
        lowered = {skill.lower() for skill in skills}
        self.assertIn("node.js", lowered)
        self.assertIn("typescript", lowered)
        self.assertIn("react", lowered)
        self.assertIn("sql", lowered)
        self.assertEqual(len(lowered), len(skills))

    def test_resume_parser_returns_expected_shape(self):
        parsed = parse_resume_text(
            """
            Asha Student
            asha@example.com
            +91 98765 43210
            Summary
            Backend developer focused on Node.js and PostgreSQL APIs.
            Education
            Example Institute 2024
            Experience
            Built REST APIs with Node.js, SQL, Docker, and AWS in 2023.
            """
        )
        self.assertEqual(parsed["email"], "asha@example.com")
        self.assertIn("skills", parsed)
        self.assertGreaterEqual(len(parsed["skills"]), 3)
        self.assertIsInstance(parsed["education"], list)
        self.assertIsInstance(parsed["experience"], list)

    def test_tfidf_match_scores_overlap_between_zero_and_one(self):
        score = calculate_tfidf_match(
            ["Node.js", "TypeScript", "SQL"],
            ["Node.js", "SQL", "AWS"],
            "Backend API role requiring Node.js, SQL, and AWS.",
        )
        self.assertGreater(score, 0)
        self.assertLessEqual(score, 1)

    def test_health_and_match_handlers(self):
        health_payload = asyncio.run(health())
        self.assertEqual(health_payload["status"], "ok")

        match_payload = asyncio.run(
            match_jobs(
                MatchRequest(
                    resumeSkills=["React", "TypeScript", "Node.js"],
                    jobRequirements="Frontend role requiring React, TypeScript, and testing.",
                    jobRequiredSkills=["React", "TypeScript", "Testing"],
                    includeExplanation=True,
                ),
                cast(
                    Any,
                    SimpleNamespace(state=SimpleNamespace(request_id="test-request")),
                ),
            )
        )
        payload = match_payload.model_dump()
        self.assertGreater(payload["matchScore"], 0)
        self.assertIn("React", payload["matchedSkills"])
        self.assertIn("Testing", payload["missingSkills"])


if __name__ == "__main__":
    unittest.main()
