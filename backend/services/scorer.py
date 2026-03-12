"""Service stub: scorer — implemented in a later phase."""
"""
Scoring service — computes match scores between resume and job description.
All computation is local — no external API calls.

Weights:
  skills      40%
  experience  25%
  keywords    20%
  education   15%
"""
import re
import logging

from backend.services.nlp import (
    extract_skills,
    extract_experience_level,
    compute_semantic_similarity,
    get_nlp,
)

logger = logging.getLogger("resume_analyzer")


# ── Skills scoring ────────────────────────────────────────────────────────────
def compute_skills_score(resume_skills: list[str], required_skills: list[str]) -> dict:
    """
    Score how well resume skills match required skills.

    Matching strategy:
    - Exact match (case-insensitive) → full 1.0 weight
    - Semantic near-match (similarity > 0.75) → 0.7 weight
    
    Returns {score: int, matched: list, missing: list}
    """
    if not required_skills:
        return {"score": 80, "matched": resume_skills, "missing": []}

    resume_lower = {s.lower() for s in resume_skills}
    matched = []
    missing = []
    weighted_score = 0.0

    for req_skill in required_skills:
        req_lower = req_skill.lower()

        # Exact match
        if req_lower in resume_lower:
            matched.append(req_skill)
            weighted_score += 1.0
            continue

        # Semantic near-match — only run if embedder available
        try:
            best_sim = 0.0
            for res_skill in resume_skills:
                sim = compute_semantic_similarity(req_lower, res_skill.lower())
                if sim > best_sim:
                    best_sim = sim

            if best_sim > 0.75:
                matched.append(req_skill)
                weighted_score += 0.7
            else:
                missing.append(req_skill)
        except Exception:
            missing.append(req_skill)

    score = int((weighted_score / max(len(required_skills), 1)) * 100)
    score = max(0, min(100, score))

    return {"score": score, "matched": matched, "missing": missing}


# ── Experience scoring ────────────────────────────────────────────────────────
def compute_experience_score(resume_exp: dict, jd_text: str) -> int:
    """
    Compare resume years of experience against JD requirement.
    Returns int 0-100.
    """
    # Extract required years from JD
    year_patterns = re.findall(r"(\d+)\+?\s*years?", jd_text.lower())
    required_years = max((int(y) for y in year_patterns), default=None)

    # No requirement found — neutral score
    if required_years is None:
        return 80

    resume_years = resume_exp.get("years")

    # No years on resume — low but not zero
    if resume_years is None:
        return 40

    if resume_years >= required_years:
        return 100

    # Partial credit — proportional, minimum 20
    return max(20, int((resume_years / required_years) * 100))


# ── Keywords scoring ──────────────────────────────────────────────────────────
def compute_keywords_score(resume_text: str, jd_text: str) -> int:
    """
    Extract meaningful keywords from JD and check how many appear in resume.
    Uses spaCy to filter stopwords and short tokens.
    Returns int 0-100.
    """
    nlp = get_nlp()
    doc = nlp(jd_text[:50_000])

    # Extract meaningful words — no stopwords, no punctuation, length >= 3
    jd_keywords = {
        token.lemma_.lower()
        for token in doc
        if not token.is_stop
        and not token.is_punct
        and not token.is_space
        and len(token.text) >= 3
    }

    if not jd_keywords:
        return 50

    resume_lower = resume_text.lower()
    matched_count = sum(1 for kw in jd_keywords if kw in resume_lower)

    return int((matched_count / len(jd_keywords)) * 100)


# ── Education scoring ─────────────────────────────────────────────────────────
def compute_education_score(resume_text: str, jd_text: str) -> int:
    """
    Simple keyword-based education match.
    Checks if resume mentions required degree level.
    """
    degree_hierarchy = ["phd", "doctorate", "masters", "msc", "mba", "bachelor", "bsc", "hnd", "ond", "diploma"]

    jd_lower = jd_text.lower()
    resume_lower = resume_text.lower()

    # Find highest degree required in JD
    required_level = None
    for i, degree in enumerate(degree_hierarchy):
        if degree in jd_lower:
            required_level = i
            break

    # No degree requirement mentioned — neutral
    if required_level is None:
        return 80

    # Check if resume mentions that degree level or higher
    for i, degree in enumerate(degree_hierarchy):
        if degree in resume_lower and i <= required_level:
            return 100

    return 50


# ── Full scoring pipeline ─────────────────────────────────────────────────────
def run_full_score(resume_text: str, jd_text: str) -> dict:
    """
    Run the complete scoring pipeline.

    Weights: skills 40% + experience 25% + keywords 20% + education 15%

    Returns dict matching AnalysisResponse schema.
    """
    # Extract from both texts
    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(jd_text)
    resume_exp = extract_experience_level(resume_text)

    # Compute individual scores
    skills_result = compute_skills_score(resume_skills, jd_skills)
    experience_score = compute_experience_score(resume_exp, jd_text)
    keywords_score = compute_keywords_score(resume_text, jd_text)
    education_score = compute_education_score(resume_text, jd_text)

    skills_score = skills_result["score"]

    # Weighted overall score
    overall = int(
        skills_score * 0.40
        + experience_score * 0.25
        + keywords_score * 0.20
        + education_score * 0.15
    )
    overall = max(0, min(100, overall))

    return {
        "overall_score": overall,
        "skills_score": skills_score,
        "experience_score": experience_score,
        "keywords_score": keywords_score,
        "education_score": education_score,
        "matched_skills": skills_result["matched"],
        "missing_skills": skills_result["missing"],
        "resume_experience": resume_exp,
    }