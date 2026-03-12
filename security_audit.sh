#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Phase 9B — Security Audit Script
# Run from project root: C:\Users\JEICTECH STUDENT 9\Desktop\resume\
# On Git Bash: bash security_audit.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "=============================================="
echo "  ResumeAI Security Audit — Phase 9B"
echo "=============================================="

# Activate venv
source .venv/Scripts/activate 2>/dev/null || source .venv/bin/activate

echo ""
echo "── 1. pip-audit (CVE scan) ─────────────────"
pip install pip-audit --quiet
pip-audit --requirement backend/requirements.txt --format=json > audit_report.json 2>&1 || true
pip-audit --requirement backend/requirements.txt 2>&1 | tee audit_results.txt || true

echo ""
echo "── 2. Bandit (SAST — Python source) ────────"
pip install bandit --quiet
bandit -r backend/ -ll -f txt 2>&1 | tee bandit_results.txt || true

echo ""
echo "── 3. Safety check ─────────────────────────"
pip install safety --quiet
safety check -r backend/requirements.txt 2>&1 | tee safety_results.txt || true

echo ""
echo "── 4. Secrets scan (trufflehog-style grep) ──"
echo "Scanning for hardcoded secrets..."
grep -rn \
  --include="*.py" \
  -E "(password|secret|api_key|token)\s*=\s*['\"][^'\"]{8,}" \
  backend/ | grep -v "test\|example\|placeholder\|getenv\|environ\|\.env" \
  || echo "  ✓ No obvious hardcoded secrets found"

echo ""
echo "── 5. Dependency versions ───────────────────"
pip list --format=columns | grep -E \
  "fastapi|uvicorn|sqlalchemy|alembic|pydantic|python-jose|passlib|cryptography|slowapi|groq|spacy|sentence" \
  || true

echo ""
echo "=============================================="
echo "  Audit complete. Review:"
echo "    audit_results.txt  — CVE findings"
echo "    bandit_results.txt — Code issues"
echo "    safety_results.txt — Safety DB check"
echo "=============================================="