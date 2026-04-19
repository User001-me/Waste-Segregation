"""
Database module - uses SQLite by default (zero config).
Set DATABASE_URL env var to use PostgreSQL in production:
  DATABASE_URL=postgresql://user:pass@host/dbname
"""
import os
import json
import aiosqlite
import asyncpg
from pathlib import Path

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///waste_ai.db")
USE_POSTGRES = DATABASE_URL.startswith("postgresql")
APP_DATA_DIR = Path(os.getenv("APP_DATA_DIR", ".")).resolve()
APP_DATA_DIR.mkdir(parents=True, exist_ok=True)

if DATABASE_URL.startswith("sqlite:///"):
    raw_path = DATABASE_URL.replace("sqlite:///", "", 1)
    DB_PATH = str((Path(raw_path) if Path(raw_path).is_absolute() else APP_DATA_DIR / raw_path).resolve())
else:
    DB_PATH = str((APP_DATA_DIR / "waste_ai.db").resolve())

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS predictions (
    id            TEXT PRIMARY KEY,
    image_path    TEXT,
    detections    TEXT,
    model_version INTEGER DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_id         TEXT,
    predicted_class       TEXT,
    correct_class         TEXT,
    image_url             TEXT,
    new_class_name        TEXT,
    new_class_description TEXT,
    annotations           TEXT,
    status                TEXT DEFAULT 'pending',
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_versions (
    version    INTEGER PRIMARY KEY,
    notes      TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO model_versions (version, notes) VALUES (1, 'Initial model');
"""


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(CREATE_TABLES_SQL)
        for statement in (
            "ALTER TABLE feedback ADD COLUMN new_class_name TEXT",
            "ALTER TABLE feedback ADD COLUMN new_class_description TEXT",
            "ALTER TABLE feedback ADD COLUMN annotations TEXT",
        ):
            try:
                await db.execute(statement)
            except Exception:
                pass
        await db.commit()
    print(f"Database ready: {DB_PATH}")


async def get_feedback_by_id(feedback_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM feedback WHERE id = ?", (feedback_id,)
        ) as cursor:
            row = await cursor.fetchone()

    if not row:
        return None

    item = dict(row)
    raw_annotations = item.get("annotations")
    if raw_annotations:
        try:
            item["annotations"] = json.loads(raw_annotations)
        except Exception:
            item["annotations"] = []
    else:
        item["annotations"] = []
    return item


async def save_prediction(prediction_id: str, detections: list, model_version: int = 1):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO predictions (id, detections, model_version) VALUES (?, ?, ?)",
            (prediction_id, json.dumps(detections), model_version)
        )
        await db.commit()


async def save_feedback(prediction_id: str | None, predicted_class: str,
                        correct_class: str, image_url: str = "",
                        new_class_name: str = "", new_class_description: str = "",
                        annotations: list | None = None):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO feedback
               (prediction_id, predicted_class, correct_class, image_url,
                new_class_name, new_class_description, annotations)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                prediction_id,
                predicted_class,
                correct_class,
                image_url,
                new_class_name,
                new_class_description,
                json.dumps(annotations or []),
            )
        )
        await db.commit()


async def get_stats():
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM predictions") as cur:
            total_predictions = (await cur.fetchone())[0]
        async with db.execute("SELECT COUNT(*) FROM feedback") as cur:
            total_feedback = (await cur.fetchone())[0]
        async with db.execute("SELECT COUNT(*) FROM feedback WHERE status='approved'") as cur:
            approved = (await cur.fetchone())[0]
        async with db.execute("SELECT MAX(version) FROM model_versions") as cur:
            version = (await cur.fetchone())[0] or 1
    return {
        "total_predictions": total_predictions,
        "total_feedback": total_feedback,
        "approved_corrections": approved,
        "model_version": version,
    }


async def get_pending_feedback(limit: int = 50):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM feedback WHERE status='pending' ORDER BY created_at DESC LIMIT ?",
            (limit,)
        ) as cur:
            rows = await cur.fetchall()

    items = []
    for row in rows:
        item = dict(row)
        raw_annotations = item.get("annotations")
        if raw_annotations:
            try:
                item["annotations"] = json.loads(raw_annotations)
            except Exception:
                item["annotations"] = []
        else:
            item["annotations"] = []
        items.append(item)
    return items


async def update_feedback_status(feedback_id: int, status: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE feedback SET status=? WHERE id=?",
            (status, feedback_id)
        )
        await db.commit()


async def get_approved_count():
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM feedback WHERE status='approved'") as cur:
            return (await cur.fetchone())[0]


async def bump_model_version(notes: str = ""):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT MAX(version) FROM model_versions") as cur:
            current = (await cur.fetchone())[0] or 1
        new_version = current + 1
        await db.execute(
            "INSERT INTO model_versions (version, notes) VALUES (?, ?)",
            (new_version, notes)
        )
        await db.commit()
    return new_version
