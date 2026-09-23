import asyncio
import base64
import re
import urllib.parse
from dataclasses import dataclass
from typing import Any, Callable, Protocol
from uuid import uuid4

from app.core.config import settings
from app.models.schemas import Citation


@dataclass(frozen=True)
class FoundryAnswer:
    answer: str
    conversation_id: str
    grounded: bool
    citations: list[Citation]


class FoundryIntegrationError(RuntimeError):
    """Raised when the configured Foundry agent cannot answer a request."""


class FoundryConfigurationError(FoundryIntegrationError):
    """Raised when the existing Foundry integration is not configured."""


class FoundryIntegration(Protocol):
    """Boundary for Microsoft Foundry Agent Service calls."""

    async def answer(
        self,
        question: str,
        *,
        conversation_id: str | None = None,
        product: str | None = None,
        version: str | None = None,
    ) -> FoundryAnswer:
        ...


class FoundryAgentClient:
    """Invoke the existing Foundry prompt agent through the Responses API."""

    def __init__(
        self,
        project_client_factory: Callable[[str, Any], Any] | None = None,
        credential_factory: Callable[[], Any] | None = None,
    ) -> None:
        self._project_client_factory = project_client_factory
        self._credential_factory = credential_factory
        self._openai_client: Any | None = None

    @property
    def enabled(self) -> bool:
        return bool(settings.foundry_project_endpoint and settings.foundry_agent_name)

    async def answer(
        self,
        question: str,
        *,
        conversation_id: str | None = None,
        product: str | None = None,
        version: str | None = None,
    ) -> FoundryAnswer:
        if not self.enabled:
            raise FoundryConfigurationError(
                "AZURE_FOUNDRY_PROJECT_ENDPOINT and AZURE_FOUNDRY_AGENT_NAME are required."
            )

        try:
            response = await asyncio.to_thread(
                self._create_response,
                question,
                conversation_id,
                product,
                version,
            )
        except ImportError as error:
            raise FoundryIntegrationError("Foundry SDK dependencies are unavailable.") from error

        answer = getattr(response, "output_text", "") or self._extract_text(response)
        if not answer:
            return FoundryAnswer(
                answer="I couldn't find an answer in the connected DocuMind Cloud documentation.",
                conversation_id=getattr(response, "id", None) or conversation_id or f"foundry-{uuid4().hex[:12]}",
                grounded=False,
                citations=[],
            )

        return FoundryAnswer(
            answer=answer,
            conversation_id=getattr(response, "id", None) or conversation_id or f"foundry-{uuid4().hex[:12]}",
            grounded=True,
            citations=self._extract_citations(response),
        )

    def _create_response(
        self,
        question: str,
        conversation_id: str | None,
        product: str | None,
        version: str | None,
    ) -> Any:
        openai_client = self._get_openai_client()
        prompt = question
        if product or version:
            prompt = f"{question}\n\nScope: {product or 'all products'} {version or 'latest version'}"

        request: dict[str, Any] = {
            "input": prompt,
            "extra_body": {
                "agent_reference": {
                    "name": settings.foundry_agent_name,
                    "type": "agent_reference",
                }
            },
        }
        if conversation_id:
            request["previous_response_id"] = conversation_id
        return openai_client.responses.create(**request)

    def _get_openai_client(self) -> Any:
        if self._openai_client is not None:
            return self._openai_client

        if self._project_client_factory is None:
            from azure.ai.projects import AIProjectClient

            self._project_client_factory = lambda endpoint, credential: AIProjectClient(
                endpoint=endpoint,
                credential=credential,
            )
        if self._credential_factory is None:
            from azure.identity import DefaultAzureCredential

            self._credential_factory = DefaultAzureCredential

        project_client = self._project_client_factory(
            settings.foundry_project_endpoint,
            self._credential_factory(),
        )
        self._openai_client = project_client.get_openai_client()
        return self._openai_client

    @staticmethod
    def _extract_text(response: Any) -> str:
        for item in getattr(response, "output", []) or []:
            if getattr(item, "type", None) != "message":
                continue
            for content in getattr(item, "content", []) or []:
                text = getattr(content, "text", None)
                if text:
                    return getattr(text, "value", text)
        return ""

    @staticmethod
    def _parse_source_details(url: str, raw_title: str | None) -> tuple[str, str, str]:
        doc_name = ""
        product = "Documentation"

        # Azure AI Search chunk keys encode the source blob URL in base64: ..._<base64>_pages_<num>...
        b64_match = re.search(r"_([a-zA-Z0-9+/=]{16,})_pages_", url)
        if b64_match:
            b64 = b64_match.group(1)
            # Azure index keys may append a page/chunk digit before _pages_; try trimming up to 3 chars
            for strip_len in range(4):
                cand = b64 if strip_len == 0 else b64[:-strip_len]
                pad = (4 - len(cand) % 4) % 4
                try:
                    decoded = base64.b64decode(cand + "=" * pad).decode("utf-8", errors="ignore")
                    if "http" in decoded:
                        clean_url = re.sub(r"\d+$", "", decoded)
                        parsed_path = urllib.parse.unquote(clean_url.split("/")[-1])
                        if parsed_path:
                            doc_name = parsed_path
                        parts = clean_url.split("/")
                        if len(parts) > 4:
                            folder = parts[-2]
                            if folder and folder != "product-docs":
                                product = folder.replace("-", " ").replace("_", " ").title()
                        break
                except Exception:
                    pass

        # If not an Azure Search chunk key, inspect path filename
        if not doc_name and url:
            path = url.split("?")[0].split("#")[0]
            unquoted = urllib.parse.unquote(path.split("/")[-1])
            if unquoted and not unquoted.startswith("docs") and "." in unquoted:
                doc_name = unquoted

        # Use raw title if meaningful
        if not doc_name and raw_title and not raw_title.startswith("http"):
            doc_name = raw_title

        if not doc_name:
            doc_name = "Documentation source"

        canonical_key = doc_name.lower().strip()
        return doc_name, product, canonical_key

    @staticmethod
    def _extract_citations(response: Any) -> list[Citation]:
        citations: list[Citation] = []
        seen_keys: set[str] = set()
        for item in getattr(response, "output", []) or []:
            for content in getattr(item, "content", []) or []:
                for annotation in getattr(content, "annotations", []) or []:
                    annotation_type = getattr(annotation, "type", "")
                    if annotation_type not in {"url_citation", "file_citation"}:
                        continue
                    url = getattr(annotation, "url", None) or getattr(annotation, "file_id", "")
                    raw_title = getattr(annotation, "title", None) or getattr(annotation, "filename", None)

                    doc_name, product, canonical_key = FoundryAgentClient._parse_source_details(url, raw_title)
                    if canonical_key in seen_keys:
                        continue
                    seen_keys.add(canonical_key)

                    citations.append(
                        Citation(
                            id=f"foundry-citation-{len(citations) + 1}",
                            document=doc_name,
                            section=f"{product} source" if product != "Documentation" else "Knowledge base source",
                            product=product,
                            version="1.0",
                            page=url or "source",
                            confidence=100,
                            excerpt=f"Referenced from {doc_name} in your documentation knowledge base.",
                        )
                    )
        return citations


class PlaceholderFoundryIntegration(FoundryAgentClient):
    """Backward-compatible name for the local fallback-capable client."""
