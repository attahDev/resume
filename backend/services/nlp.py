"""Service stub: nlp — implemented in a later phase."""
"""
NLP service — skill extraction and semantic similarity.
Uses spaCy and sentence-transformers, both running fully locally.
No data leaves the server. Models are lazy-loaded and cached as singletons.
"""
import re
import logging
from typing import Optional
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


logger = logging.getLogger("resume_analyzer")

# ── Lazy-loaded singletons ────────────────────────────────────────────────────
_nlp = None
_embedder = None


def get_nlp():
    global _nlp
    if _nlp is None:
        import spacy
        logger.info("nlp", extra={"action": "loading_spacy"})
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


def get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        logger.info("nlp", extra={"action": "loading_embedder"})
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


# ── Skills list ───────────────────────────────────────────────────────────────
SKILLS_LIST: list[str] = [
    # Languages
    "Python", "JavaScript", "TypeScript", "Go", "Rust", "Java", "C++", "C#",
    "PHP", "Ruby", "Swift", "Kotlin", "R", "Scala", "Dart", "SQL", "Bash",
    "Shell", "PowerShell", "MATLAB", "Perl", "Haskell", "Elixir", "Clojure",

    # Frontend frameworks
    "React", "Vue", "Angular", "Next.js", "Nuxt", "Svelte", "jQuery",
    "Tailwind", "Bootstrap", "Material UI", "Chakra UI",

    # Backend frameworks
    "FastAPI", "Django", "Flask", "Express", "NestJS", "Spring", "Laravel",
    "Rails", "Gin", "Echo", "Fiber", "ASP.NET",

    # Mobile
    "Flutter", "React Native", "SwiftUI", "Jetpack Compose",

    # Cloud
    "AWS", "GCP", "Azure", "Cloudflare", "DigitalOcean", "Heroku", "Render",
    "Vercel", "Netlify",

    # DevOps & Infrastructure
    "Docker", "Kubernetes", "Terraform", "Ansible", "Pulumi",
    "GitHub Actions", "Jenkins", "CircleCI", "GitLab CI", "Travis CI",
    "Linux", "Nginx", "Apache", "Caddy",

    # Databases
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "Cassandra", "DynamoDB", "SQLite", "Firebase", "Supabase",
    "Neon", "PlanetScale", "CockroachDB",

    # Messaging & Queues
    "Kafka", "RabbitMQ", "Celery", "SQS", "Pub/Sub",

    # Data & ML
    "pandas", "NumPy", "scikit-learn", "TensorFlow", "PyTorch", "Keras",
    "Spark", "Airflow", "dbt", "Tableau", "Power BI",

    # APIs & Protocols
    "REST", "GraphQL", "gRPC", "WebSockets", "OpenAPI",

    # Practices
    "microservices", "TDD", "BDD", "Agile", "Scrum", "Kanban",
    "CI/CD", "DevOps", "Git", "Jira", "Confluence",

    # Security
    "OAuth", "JWT", "SAML", "SSL/TLS", "penetration testing",

    # African market
    "Paystack", "Flutterwave", "Interswitch", "M-Pesa", "Remita",
    "Andela", "Turing",
]

# Pre-compile lowercase lookup for fast matching
_SKILLS_LOWER = {s.lower(): s for s in SKILLS_LIST}


# ── Skill extraction ──────────────────────────────────────────────────────────
def extract_skills(text: str) -> list[str]:
    """
    Extract tech skills from text using two approaches:
    1. spaCy NER — catches PRODUCT and ORG entities
    2. Regex scan of SKILLS_LIST — catches exact matches

    Returns sorted, deduplicated, lowercase list.
    """
    nlp = get_nlp()
    found: set[str] = set()

    # spaCy NER pass
    doc = nlp(text[:100_000])  # cap to avoid memory issues
    for ent in doc.ents:
        if ent.label_ in ("PRODUCT", "ORG"):
            lower = ent.text.lower()
            if lower in _SKILLS_LOWER:
                found.add(_SKILLS_LOWER[lower])

    # Regex scan pass — case-insensitive whole-word match
    for skill_lower, skill_original in _SKILLS_LOWER.items():
        pattern = r"\b" + re.escape(skill_lower) + r"\b"
        if re.search(pattern, text.lower()):
            found.add(skill_original)

    return sorted(found)


# ── Experience extraction ─────────────────────────────────────────────────────
def extract_experience_level(text: str) -> dict:
    """
    Extract years of experience and seniority level from text.
    Returns {years: int|None, level: str|None}
    """
    # Find all "X year" / "X+ year" patterns and take the max
    year_patterns = re.findall(r"(\d+)\+?\s*years?", text.lower())
    years = max((int(y) for y in year_patterns), default=None)

    # Seniority keyword scan — order matters (most senior first)
    level = None
    level_keywords = [
        ("principal", "Principal"),
        ("staff", "Staff"),
        ("director", "Director"),
        ("lead", "Lead"),
        ("senior", "Senior"),
        ("mid-level", "Mid-level"),
        ("mid level", "Mid-level"),
        ("junior", "Junior"),
        ("entry", "Junior"),
        ("intern", "Intern"),
    ]
    text_lower = text.lower()
    for keyword, label in level_keywords:
        if keyword in text_lower:
            level = label
            break

    return {"years": years, "level": level}


# ── Semantic similarity ───────────────────────────────────────────────────────
def compute_semantic_similarity(text1: str, text2: str) -> float:
    """
    Compute cosine similarity between two texts using sentence-transformers.
    Returns float between 0.0 and 1.0.
    """


    embedder = get_embedder()
    embeddings = embedder.encode([text1, text2])
    score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return float(score)