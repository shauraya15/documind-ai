DOCUMENTATION_SCOPE_MESSAGE = "I can only answer questions related to the product documentation available in DocuMind."

_DOCUMENTATION_TERMS = {
    "api", "authentication", "auth", "configuration", "configure", "connector",
    "documentation", "error", "faq", "installation", "install", "oauth", "pkce",
    "product", "release", "relay", "reference", "token", "troubleshoot",
    "troubleshooting", "version",
}


def is_product_documentation_question(question: str) -> bool:
    words = {word.strip(".,?!:;()[]{}\"'").lower() for word in question.split()}
    return bool(words & _DOCUMENTATION_TERMS)