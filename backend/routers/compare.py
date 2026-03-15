

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from uuid import UUID
import json

from ..database import get_db
from ..models.analysis import Analysis
from ..security.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/analyze", tags=["analyze"])


# ── Schemas ────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    baseline_id: UUID
    revised_id:  UUID


class DimensionDelta(BaseModel):
    dimension:     str
    baseline:      float
    revised:       float
    delta:         float
    direction:     str   # "up" | "down" | "same"


class CompareResponse(BaseModel):
    baseline_id:        str
    revised_id:         str
    overall_delta:      float
    direction:          str
    dimensions:         list[DimensionDelta]
    new_skills:         list[str]
    dropped_skills:     list[str]
    resolved_gaps:      list[str]
    remaining_gaps:     list[str]
    summary:            str


# ── Helpers ────────────────────────────────────────────────────────────────

def _direction(delta: float) -> str:
    if delta > 0.5:  return "up"
    if delta < -0.5: return "down"
    return "same"


def _safe_list(val) -> list:
    """Safely coerce a stored JSON field to a list."""
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        try:
            parsed = json.loads(val)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []
    return []


async def _fetch_owned(
    analysis_id: UUID,
    user: User,
    db: AsyncSession,
    label: str,
) -> Analysis:
    result = await db.execute(
        select(Analysis).where(Analysis.id == str(analysis_id))
    )
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail=f"{label} analysis not found")
    if analysis.user_id != user.id:
        raise HTTPException(status_code=403, detail=f"Access denied to {label} analysis")
    if analysis.status != "complete":
        raise HTTPException(
            status_code=422,
            detail=f"{label} analysis is not complete (status: {analysis.status})"
        )
    return analysis


# ── Route ──────────────────────────────────────────────────────────────────

@router.post("/compare", response_model=CompareResponse)
async def compare_analyses(
    body: CompareRequest,
    db:   AsyncSession = Depends(get_db),
    user: User         = Depends(get_current_user),
):
    """
    Compare two analyses (baseline vs revised).
    Both must belong to the authenticated user and be in 'complete' status.
    """
    if body.baseline_id == body.revised_id:
        raise HTTPException(
            status_code=400,
            detail="baseline_id and revised_id must be different"
        )

    baseline = await _fetch_owned(body.baseline_id, user, db, "baseline")
    revised  = await _fetch_owned(body.revised_id,  user, db, "revised")

    # ── Score deltas ───────────────────────────────────────────────────────
    b_overall = baseline.overall_score or 0.0
    r_overall = revised.overall_score  or 0.0
    overall_delta = round(r_overall - b_overall, 1)

    dimensions_map = {
        "Skills Match":  ("skills_score",     baseline.skills_score,     revised.skills_score),
        "Experience":    ("experience_score",  baseline.experience_score,  revised.experience_score),
        "Keywords":      ("keywords_score",     baseline.keywords_score,     revised.keywords_score),
    }

    dimensions: list[DimensionDelta] = []
    for label, (_, b_val, r_val) in dimensions_map.items():
        b = round(b_val or 0.0, 1)
        r = round(r_val or 0.0, 1)
        d = round(r - b, 1)
        dimensions.append(DimensionDelta(
            dimension=label,
            baseline=b,
            revised=r,
            delta=d,
            direction=_direction(d),
        ))

    # ── Skill set diffs ────────────────────────────────────────────────────
    b_skills = set(_safe_list(baseline.matched_skills))
    r_skills = set(_safe_list(revised.matched_skills))

    new_skills     = sorted(r_skills - b_skills)
    dropped_skills = sorted(b_skills - r_skills)

    # ── Gap diffs ──────────────────────────────────────────────────────────
    b_gaps = set(_safe_list(baseline.missing_skills))
    r_gaps = set(_safe_list(revised.missing_skills))

    resolved_gaps   = sorted(b_gaps - r_gaps)   # gaps that disappeared
    remaining_gaps  = sorted(r_gaps)             # still present gaps

    # ── Natural-language summary ───────────────────────────────────────────
    direction_word = "improved" if overall_delta > 0 else "dropped" if overall_delta < 0 else "unchanged"
    sign = "+" if overall_delta >= 0 else ""

    parts = [f"Overall score {direction_word} by {sign}{overall_delta} points ({b_overall:.0f} → {r_overall:.0f})."]

    if new_skills:
        parts.append(f"New skills matched: {', '.join(new_skills[:5])}{'…' if len(new_skills) > 5 else ''}.")
    if resolved_gaps:
        parts.append(f"Gaps resolved: {', '.join(resolved_gaps[:3])}{'…' if len(resolved_gaps) > 3 else ''}.")
    if remaining_gaps:
        parts.append(f"{len(remaining_gaps)} gap(s) remain: {', '.join(remaining_gaps[:3])}{'…' if len(remaining_gaps) > 3 else ''}.")

    summary = " ".join(parts)

    return CompareResponse(
        baseline_id=str(body.baseline_id),
        revised_id=str(body.revised_id),
        overall_delta=overall_delta,
        direction=_direction(overall_delta),
        dimensions=dimensions,
        new_skills=new_skills,
        dropped_skills=dropped_skills,
        resolved_gaps=resolved_gaps,
        remaining_gaps=remaining_gaps,
        summary=summary,
    )