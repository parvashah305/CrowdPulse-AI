# spark/event_classifier.py

# Severity scores per event type (used in hotspot ranking)
SEVERITY_SCORES = {
    "traffic":  3,
    "crowd":    4,
    "concert":  2,
    "weather":  5,
    "crime":    5,
    "normal":   1,
}

# Maps raw keywords to canonical event types
# Spark will use this to re-classify if event_type is missing or wrong
KEYWORD_MAP = {
    "accident":   "traffic",
    "traffic jam":"traffic",
    "road block": "traffic",
    "congestion": "traffic",
    "pile up":    "traffic",
    "crowd":      "crowd",
    "gathering":  "crowd",
    "protest":    "crowd",
    "rally":      "crowd",
    "stampede":   "crowd",
    "packed":     "crowd",
    "concert":    "concert",
    "festival":   "concert",
    "show":       "concert",
    "performance":"concert",
    "flood":      "weather",
    "storm":      "weather",
    "cyclone":    "weather",
    "robbery":    "crime",
    "fight":      "crime",
    "arrest":     "crime",
}

def classify_event(event_type, keywords, text):
    """
    Returns (canonical_event_type, severity_score).
    First checks keywords list, then falls back to event_type field.
    """
    # Check keywords first — more specific than event_type
    text_lower = text.lower() if text else ""
    for kw, canonical in KEYWORD_MAP.items():
        if kw in text_lower or kw in [k.lower() for k in keywords]:
            return canonical, SEVERITY_SCORES.get(canonical, 1)

    # Fall back to event_type from producer
    canonical = event_type if event_type in SEVERITY_SCORES else "normal"
    return canonical, SEVERITY_SCORES.get(canonical, 1)