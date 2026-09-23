DOCUMENTATION_SCOPE_MESSAGE = "I can only answer questions related to the product documentation available in DocuMind."

_OFF_TOPIC_TERMS = {
    "weather",
    "forecast",
    "recipe",
    "cooking",
    "sports",
    "football",
    "cricket",
    "movie",
    "celebrity",
    "joke",
    "poem",
    "sing a song",
    "horoscope",
    "astrology",
}


def is_product_documentation_question(question: str) -> bool:
    normalized = question.lower()
    words = {word.strip(".,?!:;()[]{}\"'") for word in normalized.split()}
    if words & _OFF_TOPIC_TERMS or any(term in normalized for term in _OFF_TOPIC_TERMS):
        return False
    return True