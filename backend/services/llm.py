import asyncio
import logging
import time
from dotenv import load_dotenv
import os
import json
from openai import AsyncOpenAI
from openai import RateLimitError, APIStatusError, APIConnectionError
from backend.config import settings

logger = logging.getLogger("resume_analyzer")

_client = None


def get_client():
    global _client
    if _client is None:
        load_dotenv(override=True)
        _client = AsyncOpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url=settings.LLM_BASE_URL,
        )
    return _client


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


FALLBACK_RESPONSE = {
    "overall_assessment": "Analysis unavailable — please retry.",
    "quick_wins": [],
    "ats_warning": None,
    "score_explanation": "",
    "sections": [],
}


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

  "quick_wins": [
    "TYPE 1 — Skill listed too vaguely: 'Add to your Skills section: [Broad Skill] ([Framework1], [Framework2]) — you currently list [broad skill] alone which will not match framework-specific ATS filters.' | TYPE 2 — Experience bullet missing: 'Add this bullet to your most recent role: [write exact bullet — specific, quantified]. This addresses the JD requirement for [requirement].' | TYPE 3 — Weak phrasing: 'Strengthen your summary by replacing vague language with: [exact replacement phrase that mirrors JD language]'. Rules: max 3 items, copy-paste ready text only, no courses or studying, only suggest skills they already have.",
    "second quick win",
    "third quick win"
  ],

  "ats_warning": "One sentence about the single most critical keyword gap causing ATS rejection. null if no major risk.",

  "score_explanation": "One sentence explaining exactly why this specific score number was given.",

  "sections": [
    {{
      "title": "First Impression",
      "severity": "high | medium | low",
      "analysis": "2-3 sentences specific to this candidate's CV and this JD. What a recruiter would think in the first 10 seconds. Not generic.",
      "suggestions": ["Specific actionable suggestion", "Another specific suggestion"]
    }},
    {{
      "title": "Work Experience",
      "severity": "high | medium | low",
      "analysis": "Assess quality of experience bullets — achievement-focused vs task-focused, quantified, relevant to this JD.",
      "suggestions": ["Specific suggestion about experience bullets", "Another suggestion"]
    }},
    {{
      "title": "Skills",
      "severity": "high | medium | low",
      "analysis": "Assess how well their skills section matches this JD. Check for implied skills listed broadly but should be specific.",
      "suggestions": ["Specific suggestion about skills section", "Another suggestion"]
    }},
    {{
      "title": "Summary Statement",
      "severity": "high | medium | low",
      "analysis": "Does their summary position them well for this specific role? If no summary exists, flag as critical.",
      "suggestions": ["Specific suggestion about their summary", "Another suggestion"]
    }},
    {{
      "title": "Contact Info",
      "severity": "high | medium | low",
      "analysis": "Is contact info present and appropriate for this role type? For remote roles, LinkedIn and GitHub matter. For Nigerian roles, phone format matters.",
      "suggestions": ["Specific suggestion"]
    }},
    {{
      "title": "Education",
      "severity": "high | medium | low",
      "analysis": "Is education well presented and relevant? For Nigerian candidates, NYSC status and institution prestige matter to local employers.",
      "suggestions": ["Specific suggestion"]
    }},
    {{
      "title": "Formatting",
      "severity": "high | medium | low",
      "analysis": "Based on extracted text, assess structure and ATS-readability. Clean section headers, consistent date formats, and scannable layout matter.",
      "suggestions": ["Specific suggestion about formatting"]
    }}
  ]
}}
""".strip()

    result = await _call_with_retry(user_prompt)
    return result


async def _call_with_retry(user_prompt: str) -> dict:
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
                max_tokens=1400,
                temperature=0.3,
                response_format={"type": "json_object"},
                timeout=45,
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
    if not raw:
        return FALLBACK_RESPONSE

    clean = raw.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    clean = clean.strip()

    try:
        parsed = json.loads(clean)
        required = ["overall_assessment", "quick_wins", "ats_warning",
                    "score_explanation", "sections"]
        for key in required:
            if key not in parsed:
                parsed[key] = FALLBACK_RESPONSE[key]
        return parsed
    except (json.JSONDecodeError, ValueError):
        logger.warning("llm_parse_failed", extra={"attempt": attempt + 1})
        return FALLBACK_RESPONSE