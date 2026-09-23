from dataclasses import dataclass
from pathlib import PurePosixPath
import time

from app.core.config import settings


SUPPORTED_DOCUMENT_EXTENSIONS = {".pdf", ".docx", ".md", ".markdown", ".txt"}


class DocumentIngestionError(RuntimeError):
    pass


@dataclass(frozen=True)
class UploadResult:
    blob_name: str
    status: str


class AzureDocumentIngestion:
    """Upload to the configured container and start the existing Search indexer."""

    @staticmethod
    def check_configuration() -> tuple[bool, list[str]]:
        missing = []
        if not settings.storage_connection_string:
            missing.append("AZURE_STORAGE_CONNECTION_STRING")
        if not settings.search_indexer_name:
            missing.append("AZURE_SEARCH_INDEXER_NAME")
        if not settings.search_endpoint:
            missing.append("AZURE_SEARCH_ENDPOINT")
        if not settings.search_admin_key:
            missing.append("AZURE_SEARCH_ADMIN_KEY")
        return len(missing) == 0, missing

    def upload(self, filename: str, content: bytes) -> UploadResult:
        extension = PurePosixPath(filename.replace("\\", "/")).suffix.lower()
        if not extension or extension not in SUPPORTED_DOCUMENT_EXTENSIONS:
            raise DocumentIngestionError("Only PDF, DOCX, Markdown, and TXT files are supported.")

        is_configured, missing = self.check_configuration()
        if not is_configured:
            raise DocumentIngestionError(
                f"Document ingestion is not configured. Missing required environment variables: {', '.join(missing)}."
            )

        try:
            from azure.core.credentials import AzureKeyCredential
            from azure.search.documents.indexes import SearchIndexerClient
            from azure.storage.blob import BlobServiceClient
        except ImportError as error:
            raise DocumentIngestionError("Document ingestion dependencies are unavailable.") from error

        blob_name = filename.replace("\\", "/").split("/")[-1]
        try:
            blob_service_client = BlobServiceClient.from_connection_string(settings.storage_connection_string)
            blob_client = blob_service_client.get_blob_client(
                container=settings.storage_container_name,
                blob=blob_name,
            )
            blob_client.upload_blob(content, overwrite=True)
        except Exception as error:
            raise DocumentIngestionError(f"Azure Blob Storage upload failed: {error}") from error

        try:
            indexer_client = SearchIndexerClient(
                endpoint=settings.search_endpoint,
                credential=AzureKeyCredential(settings.search_admin_key),
            )
            indexer_client.run_indexer(settings.search_indexer_name)
        except Exception as error:
            raise DocumentIngestionError(f"Azure AI Search indexer run failed: {error}") from error

        return UploadResult(blob_name=blob_name, status="Processing")

    def wait_for_indexer(self, timeout_seconds: int = 60) -> str:
        if not settings.search_endpoint or not settings.search_admin_key or not settings.search_indexer_name:
            return "Failed"
        try:
            from azure.core.credentials import AzureKeyCredential
            from azure.search.documents.indexes import SearchIndexerClient

            client = SearchIndexerClient(settings.search_endpoint, AzureKeyCredential(settings.search_admin_key))
            deadline = time.monotonic() + timeout_seconds
            while time.monotonic() < deadline:
                status = client.get_indexer_status(settings.search_indexer_name)
                last_result = getattr(status, "last_result", None)
                result_status = str(getattr(last_result, "status", "")).lower()
                if result_status in {"success", "completed"}:
                    return "Indexed"
                if result_status in {"failure", "transientfailure"}:
                    return "Failed"
                time.sleep(2)
        except Exception:
            return "Failed"
        return "Failed"


def get_document_ingestion() -> AzureDocumentIngestion:
    return AzureDocumentIngestion()
