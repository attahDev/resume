"""
Input sanitisation — strips HTML tags, normalises whitespace, truncates.
"""
import re
import bleach

MAX_TEXT_LENGTH = 50_000


def sanitise_text(text: str) -> str:
    """
    Strip all HTML, normalise whitespace, truncate to 50k chars.
    Safe to call on any user-supplied string.
    """
    if not text:
        return ""

    # Strip all HTML tags and attributes
    cleaned = bleach.clean(text, tags=[], strip=True)

    # Normalise whitespace (collapse multiple spaces/tabs, preserve single newlines)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = cleaned.strip()

    # Truncate
    if len(cleaned) > MAX_TEXT_LENGTH:
        cleaned = cleaned[:MAX_TEXT_LENGTH]

    return cleaned
