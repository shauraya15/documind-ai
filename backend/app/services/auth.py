import hashlib
import hmac
import os
import secrets
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings


SESSION_COOKIE_NAME = "documind_session"
PASSWORD_SALT_BYTES = 16
PASSWORD_HASH_BYTES = 64
PASSWORD_ITERATIONS = 600_000


def _connect() -> sqlite3.Connection:
    database_path = Path(settings.auth_database_path)
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_auth_database() -> None:
    with _connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
            """
        )


def _hash_password(password: str) -> str:
    salt = os.urandom(PASSWORD_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PASSWORD_ITERATIONS, PASSWORD_HASH_BYTES)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def _verify_password(password: str, encoded_hash: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = encoded_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations), len(expected)
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_user(email: str, password: str) -> dict[str, object] | None:
    normalized_email = email.strip().lower()
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        with _connect() as connection:
            cursor = connection.execute(
                "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
                (normalized_email, _hash_password(password), created_at),
            )
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return None
    return {"id": user_id, "email": normalized_email, "created_at": created_at}


def authenticate_user(email: str, password: str) -> dict[str, object] | None:
    normalized_email = email.strip().lower()
    with _connect() as connection:
        user = connection.execute("SELECT * FROM users WHERE email = ?", (normalized_email,)).fetchone()
    if user is None or not _verify_password(password, user["password_hash"]):
        return None
    return {"id": user["id"], "email": user["email"], "created_at": user["created_at"]}


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    created_at = datetime.now(timezone.utc).isoformat()
    with _connect() as connection:
        connection.execute(
            "INSERT INTO sessions (user_id, token_hash, created_at) VALUES (?, ?, ?)",
            (user_id, _token_hash(token), created_at),
        )
    return token


def get_user_by_session(token: str | None) -> dict[str, object] | None:
    if not token:
        return None
    with _connect() as connection:
        user = connection.execute(
            """
            SELECT users.id, users.email, users.created_at
            FROM sessions JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ?
            """,
            (_token_hash(token),),
        ).fetchone()
    return dict(user) if user else None


def delete_session(token: str | None) -> None:
    if not token:
        return
    with _connect() as connection:
        connection.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(token),))


def reset_auth_database() -> None:
    with _connect() as connection:
        connection.execute("DELETE FROM sessions")
        connection.execute("DELETE FROM users")