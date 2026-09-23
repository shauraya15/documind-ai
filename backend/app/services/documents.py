import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from app.core.config import settings
from app.models.schemas import Document, DocumentCreateRequest, DocumentListResponse


def _connect() -> sqlite3.Connection:
    database_path = Path(settings.auth_database_path)
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_documents_table() -> None:
    with _connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                product TEXT NOT NULL,
                version TEXT NOT NULL,
                type TEXT NOT NULL,
                pages INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL,
                updated TEXT NOT NULL,
                owner TEXT NOT NULL,
                coverage INTEGER NOT NULL DEFAULT 0,
                sections TEXT NOT NULL DEFAULT '[]',
                summary TEXT NOT NULL DEFAULT ''
            );
            """
        )
        # Migrate: add user_id column if not present
        try:
            connection.execute("ALTER TABLE documents ADD COLUMN user_id INTEGER")
        except sqlite3.OperationalError:
            pass  # Column already exists


def _row_to_document(row: sqlite3.Row) -> Document:
    return Document(
        id=row["id"],
        title=row["title"],
        product=row["product"],
        version=row["version"],
        type=row["type"],
        pages=row["pages"],
        status=row["status"],
        updated=row["updated"],
        owner=row["owner"],
        coverage=row["coverage"],
        sections=json.loads(row["sections"]),
        summary=row["summary"],
    )


async def list_documents(user_id: int | None = None) -> DocumentListResponse:
    if user_id is None:
        return DocumentListResponse(total=0, documents=[])
    with _connect() as connection:
        rows = connection.execute(
            "SELECT * FROM documents WHERE user_id = ? ORDER BY updated DESC",
            (user_id,),
        ).fetchall()
    docs = [_row_to_document(row) for row in rows]
    return DocumentListResponse(total=len(docs), documents=docs)


def get_documents_snapshot(user_id: int | None = None) -> list[Document]:
    if user_id is None:
        return []
    with _connect() as connection:
        rows = connection.execute(
            "SELECT * FROM documents WHERE user_id = ? ORDER BY updated DESC",
            (user_id,),
        ).fetchall()
    return [_row_to_document(row) for row in rows]


def update_document_status(document_id: str, status: str) -> None:
    with _connect() as connection:
        connection.execute(
            "UPDATE documents SET status = ? WHERE id = ?",
            (status, document_id),
        )


def _insert_document(document: Document, user_id: int | None = None) -> Document:
    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO documents (id, title, product, version, type, pages, status, updated, owner, coverage, sections, summary, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                document.id,
                document.title,
                document.product,
                document.version,
                document.type,
                document.pages,
                document.status,
                document.updated,
                document.owner,
                document.coverage,
                json.dumps(document.sections),
                document.summary,
                user_id,
            ),
        )
    return document


async def create_document(request: DocumentCreateRequest, user_id: int | None = None) -> Document:
    document = Document(
        id=f"doc-{uuid4().hex[:12]}",
        title=request.title,
        product=request.product,
        version=request.version,
        type=request.type,
        pages=request.pages,
        status="Processing",
        updated=datetime.now(UTC).isoformat(),
        owner=request.owner,
        coverage=0,
        sections=request.sections,
        summary=request.summary,
    )
    return _insert_document(document, user_id=user_id)


def count_pdf_pages(content: bytes) -> int:
    import re
    try:
        matches = re.findall(rb"/Type\s*/Page\b", content)
        if matches:
            return len(matches)
        count_matches = re.findall(rb"/Count\s+(\d+)", content)
        if count_matches:
            return max(int(c) for c in count_matches)
    except Exception:
        pass
    return 0


async def create_uploaded_document(
    filename: str,
    blob_name: str,
    status: str,
    file_content: bytes | None = None,
    owner: str = "Azure Blob Storage",
    user_id: int | None = None,
) -> Document:
    import re
    # Extract clean product name from filename (e.g., "8. Transport Layer.pdf" -> "Transport Layer")
    stem = Path(filename).stem
    cleaned_product = re.sub(r"^[0-9]+[\.\-_ ]*", "", stem).strip()
    product_name = cleaned_product if cleaned_product else "Documentation"

    pages = 0
    if file_content and filename.lower().endswith(".pdf"):
        pages = count_pdf_pages(file_content)

    summary_text = (
        f"Uploaded {filename} ({pages} pages) indexed in Azure AI Search."
        if pages > 0
        else f"Uploaded {filename} indexed in Azure AI Search."
    )

    document = Document(
        id=f"doc-{uuid4().hex[:12]}",
        title=filename,
        product=product_name,
        version="1.0",
        type="API Reference" if "api" in filename.lower() else "Getting Started",
        pages=pages,
        status=status,
        updated=datetime.now(UTC).isoformat(),
        owner=owner,
        coverage=0,
        sections=[blob_name],
        summary=summary_text,
    )
    return _insert_document(document, user_id=user_id)


def reset_documents() -> None:
    """Used only in tests to restore a clean state."""
    with _connect() as connection:
        connection.execute("DELETE FROM documents")
