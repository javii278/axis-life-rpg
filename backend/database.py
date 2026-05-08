import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# DATABASE_URL en env para producción (PostgreSQL). Fallback a SQLite para dev.
_raw_url = os.getenv("DATABASE_URL", "sqlite:///./axis.db")

# Render/Railway envían postgres:// pero SQLAlchemy requiere postgresql://
DATABASE_URL = _raw_url.replace("postgres://", "postgresql://", 1)

_is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from backend import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _run_safe_migrations()


def _run_safe_migrations():
    """Añade columnas nuevas si no existen. Idempotente en SQLite y PostgreSQL."""
    from sqlalchemy import text

    # Sintaxis compatible: ADD COLUMN IF NOT EXISTS (PostgreSQL 9.6+, SQLite 3.35+)
    migrations_users = [
        ("username",      "VARCHAR(100)"),
        ("password_hash", "VARCHAR(200)"),
        ("email",         "VARCHAR(200)"),
    ]
    migrations_characters = [
        ("streak_shields",    "INTEGER NOT NULL DEFAULT 1"),
        ("last_shield_grant", "DATE"),
        ("login_streak",      "INTEGER NOT NULL DEFAULT 0"),
        ("last_login_date",   "DATE"),
    ]

    with engine.connect() as conn:
        for col, definition in migrations_users:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {definition}"))
                conn.commit()
            except Exception:
                pass

        migrations_characters_v2 = [
            ("class_locked", "BOOLEAN NOT NULL DEFAULT FALSE"),
        ]
        for col, definition in migrations_characters + migrations_characters_v2:
            try:
                conn.execute(text(f"ALTER TABLE characters ADD COLUMN IF NOT EXISTS {col} {definition}"))
                conn.commit()
            except Exception:
                pass
