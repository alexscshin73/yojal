import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).parent / "picopico.db"

_CREATE_TABLES = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nickname      TEXT NOT NULL,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        is_active     INTEGER NOT NULL DEFAULT 1
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS learning_items (
        id          TEXT PRIMARY KEY,
        level       TEXT NOT NULL,
        module_id   TEXT NOT NULL,
        type        TEXT NOT NULL,
        content     TEXT NOT NULL,
        meaning     TEXT NOT NULL,
        example_1   TEXT,
        example_2   TEXT,
        audio_url   TEXT,
        tags        TEXT NOT NULL DEFAULT '[]'
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS user_progress (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id          TEXT NOT NULL DEFAULT 'local',
        item_id          TEXT NOT NULL,
        stage            TEXT NOT NULL DEFAULT 'study',
        interval_days    INTEGER NOT NULL DEFAULT 1,
        ease_factor      REAL NOT NULL DEFAULT 2.5,
        last_reviewed_at TEXT,
        next_review_at   TEXT,
        success_rate     REAL NOT NULL DEFAULT 0.0,
        FOREIGN KEY (item_id) REFERENCES learning_items(id),
        UNIQUE(user_id, item_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS study_log (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     TEXT NOT NULL DEFAULT 'local',
        item_id     TEXT NOT NULL,
        action      TEXT NOT NULL,
        result      TEXT NOT NULL,
        time_spent  INTEGER,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (item_id) REFERENCES learning_items(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS routines (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id         TEXT NOT NULL DEFAULT 'local',
        learning_type   TEXT NOT NULL,
        hour            INTEGER NOT NULL,
        minute          INTEGER NOT NULL DEFAULT 0,
        days_of_week    TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7]',
        is_active       INTEGER NOT NULL DEFAULT 1
    )
    """,
]


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        for stmt in _CREATE_TABLES:
            await db.execute(stmt)
        await db.commit()


async def check_db() -> bool:
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("SELECT 1")
        return True
    except Exception:
        return False


def get_db():
    return aiosqlite.connect(DB_PATH)
