
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

CRITICAL RULE — IMPLIED SKILLS:
Nigerian and African developers commonly undersell by omission.
They list Python but not Django, Flask, or FastAPI.
They list JavaScript but not React, Node.js, or Express.
They list AWS but not EC2, S3, or Lambda.
They assume the recruiter will infer the framework from the language.
ATS systems will NOT infer. You must catch these cases and instruct
the candidate to list implied skills explicitly in their Skills section.

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

    matched_skills = scorer_result.get("matched_skills", [])
    missing_skills = scorer_result.get("missing_skills", [])
    overall        = scorer_result.get("overall_score", 0)
    skills_s       = scorer_result.get("skills_score", 0)
    exp_s          = scorer_result.get("experience_score", 0)
    kw_s           = scorer_result.get("keywords_score", 0)

    # Build privacy-safe prompt — skills and scores only, no PII
    user_prompt = f"""
Job Description:
{jd_text[:2000]}

Candidate Match Data:
- Overall Score:    {overall}/100
- Skills Score:     {skills_s}/100
- Experience Score: {exp_s}/100
- Matched Skills:   {', '.join(matched_skills) or 'None detected'}
- Missing Skills:   {', '.join(missing_skills) or 'None'}

Return ONLY this exact JSON structure — no other text, no markdown:
{{
  "overall_assessment": "2-3 sentences. What this score means for this specific role and candidacy. Not generic — reference the actual role and matched skills.",

  "top_strengths": [
    "Specific strength relevant to THIS job based on matched skills — not generic praise",
    "Second specific strength",
    "Third specific strength"
  ],

  "critical_gaps": [
    {{
      "skill": "Exact skill name or group from the JD",
      "importance": "high | medium | low",
      "suggestion": "Follow this decision logic exactly:
        STEP 1 — Check if this skill could be implied from their matched skills.
        Examples of implied skills:
          Python listed → Django, Flask, FastAPI likely known but unlisted
          JavaScript listed → React, Node.js, Express likely known but unlisted
          AWS listed → EC2, S3, Lambda likely known but unlisted
          SQL listed → PostgreSQL, MySQL likely known but unlisted
        If implied: say exactly this —
          'You listed [matched skill] but not [missing skill]. ATS systems do not
          infer [missing skill] from [matched skill]. Add [matched skill] ([missing skill])
          to your Skills section — this directly matches the JD requirement.'
        STEP 2 — If genuinely missing (not implied from anything matched):
          Give the shortest realistic path. One personal project is enough.
          Say: 'Build one small project using [skill] and list it as [skill] (personal project).
          This is enough to pass ATS filtering and gives you something concrete to discuss
          in interviews.'
        NEVER say: take a course, learn X, familiarise yourself, consider studying.
        Keep suggestion under 3 sentences."
    }}
  ],

  "quick_wins": [
    "Quick wins are ONLY for skills the candidate already has in matched_skills.
     Never suggest something they do not have.
     Each item must be one of these three types:

     TYPE 1 — Skill listed too vaguely (most common for Nigerian devs):
     Use this when a broad skill like Python or JavaScript is matched but
     specific frameworks are missing from the JD.
     Format: 'Add to your Skills section: [Broad Skill] ([Framework1], [Framework2], [Framework3])
     — you currently list [broad skill] alone which will not match framework-specific ATS filters.'

     TYPE 2 — Experience bullet that should exist but is missing:
     Write a realistic, specific bullet based on their matched skills and the JD requirements.
     Format: 'Add this bullet to your most recent role:
     [write the exact bullet — make it specific, quantified where possible, and directly
     matching a JD requirement]. This addresses the JD requirement for [specific requirement].'

     TYPE 3 — Weak or vague phrasing that needs upgrading:
     Format: 'Strengthen your summary or experience section by replacing vague language with:
     [exact replacement phrase that mirrors JD language] — this phrase signals direct relevance
     to the hiring manager and matches ATS keywords for this role.'

     Rules:
     - Maximum 3 items
     - Every item must be immediately actionable today — no studying, no courses
     - Every item must include copy-paste ready text
     - Do not repeat gaps already covered in critical_gaps",

    "second quick win following same TYPE format",

    "third quick win following same TYPE format"
  ],

  "ats_warning": "One sentence about the single most critical keyword gap that will cause ATS rejection before a human sees the resume. null if no major ATS risk.",

  "score_explanation": "One sentence explaining exactly why this specific number was given — reference the weakest scoring area."
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
                    {"role": "user",   "content": user_prompt},
                ],
                max_tokens=1200,
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            duration_ms = round((time.monotonic() - start) * 1000)
            usage = response.usage
            logger.info("llm", extra={
                "attempt":      attempt + 1,
                "model":        settings.MODEL_VERSION,
                "total_tokens": usage.total_tokens if usage else None,
                "duration_ms":  duration_ms,
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
    Falls back to FALLBACK_RESPONSE on parse failure.
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
        # Ensure all required keys exist
        required = ["overall_assessment", "top_strengths", "critical_gaps",
                    "quick_wins", "ats_warning", "score_explanation"]
        for key in required:
            if key not in parsed:
                parsed[key] = FALLBACK_RESPONSE[key]
        return parsed
    except (json.JSONDecodeError, ValueError):
        logger.warning("llm_parse_failed", extra={"attempt": attempt + 1})
        return FALLBACK_RESPONSE