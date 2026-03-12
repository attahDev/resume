"""Service stub: llm — implemented in a later phase."""
"""
LLM service — Groq integration via OpenAI-compatible SDK.
Privacy-first: only extracted skills and scores sent to Groq.
Names, emails, phones, addresses, full resume text NEVER leave the server.
Retry logic: 3 attempts with exponential backoff.
Falls back gracefully if all attempts fail.
"""
import asyncio
import logging
import time
from typing import Any
from dotenv import load_dotenv
import os
import json
from openai import AsyncOpenAI
from openai import RateLimitError, APIStatusError, APIConnectionError
from backend.config import settings

logger = logging.getLogger("resume_analyzer")

# ── Singleton client ──────────────────────────────────────────────────────────
_client = None


def get_client():
    global _client
    if _client is None:
        from openai import AsyncOpenAI
        from dotenv import load_dotenv
        import os
        load_dotenv(override=True)
        _client = AsyncOpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url=settings.LLM_BASE_URL,
        )
    return _client


# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """
You are an expert career coach specialising in helping African tech professionals
land roles at both local companies (Flutterwave, Paystack, Andela, MTN Digital,
Access Bank, Interswitch) and international remote roles at US and European companies
actively hiring African talent.

You understand:
- Nigerian and African CV conventions vs Western resume expectations
- Remote work application best practices for candidates in Africa
- Common skill gaps in African bootcamp graduates vs self-taught developers
- How to frame African market experience for international roles
- Salary negotiation context for Nigerian tech roles vs remote USD compensation
- ATS (Applicant Tracking System) optimisation for both local and international apps

Respond ONLY with a valid JSON object. No preamble. No explanation. JSON only.
""".strip()


# ── Fallback response ─────────────────────────────────────────────────────────
FALLBACK_RESPONSE = {
    "overall_assessment": "Analysis unavailable — please retry.",
    "top_strengths": [],
    "critical_gaps": [],
    "quick_wins": [],
    "ats_warning": None,
    "score_explanation": "",
}


# ── Main analysis function ────────────────────────────────────────────────────
async def get_llm_analysis(scorer_result: dict, jd_text: str) -> dict:

    load_dotenv(override=True)
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key or api_key == "placeholder":
        logger.warning("llm", extra={"action": "skipped_no_api_key"})
        return FALLBACK_RESPONSE

    # Build privacy-safe prompt — skills only, no PII
    user_prompt = f"""
Job Description:
{jd_text[:2000]}

Candidate Match Data:
- Overall Score: {scorer_result.get('overall_score', 0)}/100
- Skills Score: {scorer_result.get('skills_score', 0)}/100
- Experience Score: {scorer_result.get('experience_score', 0)}/100
- Matched Skills: {', '.join(scorer_result.get('matched_skills', []))}
- Missing Skills: {', '.join(scorer_result.get('missing_skills', []))}

Return ONLY this exact JSON structure:
{{
  "overall_assessment": "2-3 sentence career coach summary",
  "top_strengths": ["strength1", "strength2", "strength3"],
  "critical_gaps": [
    {{"skill": "skill name", "importance": "high|medium|low", "suggestion": "how to address it"}}
  ],
  "quick_wins": [
    "Specific bullet point to add to your resume experience section: ...",
    "Rephrase your X section to include the phrase ..."
  ],
  "ats_warning": "one sentence about keyword gaps, or null",
  "score_explanation": "why you received this specific score"
}}
""".strip()

    result = await _call_with_retry(user_prompt)
    return result


async def _call_with_retry(user_prompt: str) -> dict:
    """
    Call Groq API with up to 3 retries and exponential backoff.
    Logs attempt number, model, token usage, duration — never prompt content.
    """
    

    last_error = None
    backoff_seconds = [1, 2, 4]

    for attempt in range(3):
        start = time.monotonic()
        try:
            client = get_client()
            response = await client.chat.completions.create(
                model=settings.MODEL_VERSION,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=1000,
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            duration_ms = round((time.monotonic() - start) * 1000)
            usage = response.usage
            logger.info("llm", extra={
                "attempt": attempt + 1,
                "model": settings.MODEL_VERSION,
                "total_tokens": usage.total_tokens if usage else None,
                "duration_ms": duration_ms,
            })

            raw = response.choices[0].message.content
            return _parse_response(raw, attempt)

        except RateLimitError as e:
            last_error = f"RateLimitError: {str(e)}"
        except APIStatusError as e:
            last_error = f"APIStatusError: {e.status_code} {str(e)}"
        except APIConnectionError as e:
            last_error = f"APIConnectionError: {str(e)}"
        except Exception as e:
            last_error = f"UnexpectedError: {type(e).__name__}: {str(e)}"
            
            
        logger.warning("llm_retry", extra={"attempt": attempt + 1, "error": last_error})

        if attempt < 2:
            await asyncio.sleep(backoff_seconds[attempt])

    logger.error("llm_failed", extra={"error": last_error})
    return FALLBACK_RESPONSE


def _parse_response(raw: str, attempt: int) -> dict:
    """
    Parse JSON response from LLM.
    Retries with stricter prompt framing on first failure.
    Falls back to FALLBACK_RESPONSE on second failure.
    """
    

    if not raw:
        return FALLBACK_RESPONSE

    # Strip markdown fences if present
    clean = raw.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    clean = clean.strip()

    try:
        parsed = json.loads(clean)
        # Validate required keys present
        required = ["overall_assessment", "top_strengths", "critical_gaps",
                    "quick_wins", "ats_warning", "score_explanation"]
        for key in required:
            if key not in parsed:
                parsed[key] = FALLBACK_RESPONSE[key]
        return parsed
    except (json.JSONDecodeError, ValueError):
        logger.warning("llm_parse_failed", extra={"attempt": attempt + 1})
        return FALLBACK_RESPONSE