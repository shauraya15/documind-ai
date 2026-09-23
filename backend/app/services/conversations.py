import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

from app.core.config import settings


def _connect() -> sqlite3.Connection:
    database_path = Path(settings.auth_database_path)
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_conversations_table() -> None:
    with _connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                citations TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                messages TEXT NOT NULL DEFAULT '[]'
            );
            """
        )
        # Migrate: add messages column if not present
        try:
            connection.execute("ALTER TABLE conversations ADD COLUMN messages TEXT NOT NULL DEFAULT '[]'")
        except sqlite3.OperationalError:
            pass
        # Migrate: add user_id column if not present
        try:
            connection.execute("ALTER TABLE conversations ADD COLUMN user_id INTEGER")
        except sqlite3.OperationalError:
            pass


def save_conversation(
    conversation_id: str,
    question: str,
    answer: str,
    citations: list,
    parent_id: str | None = None,
    user_id: int | None = None,
) -> dict:
    """Persist a Q&A exchange. If parent_id exists, append to existing conversation messages."""
    created_at = datetime.now(UTC).isoformat()
    clean_citations = citations if isinstance(citations, list) else []

    target_id = conversation_id
    title = question[:60].rstrip() + ("…" if len(question) > 60 else "")

    with _connect() as connection:
        # Check if parent_id or conversation_id already exists to preserve thread
        existing = None
        if parent_id:
            existing = connection.execute("SELECT * FROM conversations WHERE id = ?", (parent_id,)).fetchone()
            if existing:
                target_id = parent_id

        if not existing:
            existing = connection.execute("SELECT * FROM conversations WHERE id = ?", (target_id,)).fetchone()

        if existing:
            existing_messages = []
            try:
                raw_msgs = existing["messages"]
                if raw_msgs and raw_msgs != "[]":
                    existing_messages = json.loads(raw_msgs)
                else:
                    existing_messages = [
                        {"id": f"u-{existing['id']}", "role": "user", "content": existing["question"]},
                        {"id": f"a-{existing['id']}", "role": "assistant", "content": existing["answer"], "citations": json.loads(existing["citations"])},
                    ]
            except Exception:
                existing_messages = []

            turn_idx = len(existing_messages) // 2 + 1
            existing_messages.append({"id": f"u-{target_id}-{turn_idx}", "role": "user", "content": question})
            existing_messages.append({"id": f"a-{target_id}-{turn_idx}", "role": "assistant", "content": answer, "citations": clean_citations})

            connection.execute(
                """
                UPDATE conversations
                SET answer = ?, citations = ?, created_at = ?, messages = ?
                WHERE id = ?
                """,
                (answer, json.dumps(clean_citations), created_at, json.dumps(existing_messages), target_id),
            )
            return {"id": target_id, "title": existing["title"], "created_at": created_at}

        # New conversation
        new_messages = [
            {"id": f"u-{target_id}", "role": "user", "content": question},
            {"id": f"a-{target_id}", "role": "assistant", "content": answer, "citations": clean_citations},
        ]
        connection.execute(
            """
            INSERT INTO conversations (id, title, question, answer, citations, created_at, messages, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                question = excluded.question,
                answer = excluded.answer,
                citations = excluded.citations,
                created_at = excluded.created_at,
                messages = excluded.messages,
                user_id = excluded.user_id
            """,
            (target_id, title, question, answer, json.dumps(clean_citations), created_at, json.dumps(new_messages), user_id),
        )

    return {"id": target_id, "title": title, "created_at": created_at}


def get_conversation(conversation_id: str, user_id: int | None = None) -> dict | None:
    with _connect() as connection:
        if user_id is not None:
            row = connection.execute(
                "SELECT * FROM conversations WHERE id = ? AND user_id = ?",
                (conversation_id, user_id),
            ).fetchone()
        else:
            row = connection.execute(
                "SELECT * FROM conversations WHERE id = ?",
                (conversation_id,),
            ).fetchone()

    if not row:
        return None

    citations = []
    try:
        citations = json.loads(row["citations"])
    except Exception:
        citations = []

    messages = []
    try:
        raw_msgs = row["messages"]
        if raw_msgs and raw_msgs != "[]":
            messages = json.loads(raw_msgs)
    except Exception:
        messages = []

    if not messages:
        messages = [
            {"id": f"u-{row['id']}", "role": "user", "content": row["question"]},
            {"id": f"a-{row['id']}", "role": "assistant", "content": row["answer"], "citations": citations},
        ]

    return {
        "id": row["id"],
        "title": row["title"],
        "question": row["question"],
        "answer": row["answer"],
        "citations": citations,
        "created_at": row["created_at"],
        "messages": messages,
    }


def list_conversations(limit: int = 50, user_id: int | None = None) -> list[dict]:
    with _connect() as connection:
        if user_id is not None:
            rows = connection.execute(
                "SELECT id, title, created_at FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit),
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT id, title, created_at FROM conversations WHERE user_id IS NULL ORDER BY created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
    return [dict(row) for row in rows]


def get_conversations_count(user_id: int | None = None) -> int:
    with _connect() as connection:
        if user_id is not None:
            row = connection.execute(
                "SELECT COUNT(*) FROM conversations WHERE user_id = ?",
                (user_id,),
            ).fetchone()
        else:
            row = connection.execute("SELECT COUNT(*) FROM conversations WHERE user_id IS NULL").fetchone()
    return row[0] if row else 0


def reset_conversations() -> None:
    """Used only in tests."""
    with _connect() as connection:
        connection.execute("DELETE FROM conversations")
