# Resume Analyzer & Job Match Scorer

AI-powered resume scoring against job descriptions. Built for African tech professionals targeting both local and international remote roles.

## Stack

- **Backend**: FastAPI + SQLAlchemy 2.0 async + Neon PostgreSQL
- **Auth**: JWT + bcrypt + refresh token rotation
- **Encryption**: Fernet AES-256 (resume PII encrypted at rest)
- **LLM**: Groq free tier (llama-3.3-70b-versatile)
- **NLP**: spaCy + sentence-transformers (fully local)
- **Frontend**: React 18 + Vite + Tailwind + Recharts
- **Hosting**: Render + Neon

## Quick Start

### 1. Generate secrets

```bash
# SECRET_KEY
openssl rand -hex 32

# ENCRYPTION_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in SECRET_KEY, ENCRYPTION_KEY, DATABASE_URL, GROQ_API_KEY
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. System dependencies

**macOS:**
```bash
brew install tesseract libmagic
```

**Ubuntu / Render:**
```bash
apt-get install -y tesseract-ocr libmagic1
```

### 5. Download spaCy model (Phase 5+)

```bash
python -m spacy download en_core_web_sm
```

### 6. Run

```bash
uvicorn backend.main:app --reload
```

### 7. Verify security headers

```bash
curl -I http://localhost:8000/health
```

Expected headers: `X-Frame-Options`, `Content-Security-Policy`, `X-Content-Type-Options`

## Access Tiers

| Tier | Limit |
|------|-------|
| Guest (no login) | 5 analyses lifetime |
| Free account | 50 analyses per day |
| Pro (future) | Unlimited |

## Phases

1. ✅ Project scaffold + security foundation
2. Auth — register, login, JWT, refresh rotation
3. Guest session tracking
4. File parser — PDF, DOCX, OCR fallback
5. NLP engine + weighted scoring
6. Groq LLM integration
7. Analyze endpoint + async processing
8. React frontend
9. Delta scoring + Render/Neon deploy + security audit
