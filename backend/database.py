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
    """Añade columnas nuevas si no existen. Compatible con SQLite 3.31+ y PostgreSQL 9.6+."""
    from sqlalchemy import text

    def _col_exists(conn, table: str, col: str) -> bool:
        if _is_sqlite:
            rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
            return any(row[1] == col for row in rows)
        result = conn.execute(text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_name = :t AND column_name = :c"
        ), {"t": table, "c": col}).scalar()
        return bool(result)

    migrations_users = [
        ("username",      "VARCHAR(100)"),
        ("password_hash", "VARCHAR(200)"),
        ("email",         "VARCHAR(200)"),
    ]
    migrations_characters = [
        ("streak_shields",     "INTEGER NOT NULL DEFAULT 1"),
        ("last_shield_grant",  "DATE"),
        ("login_streak",       "INTEGER NOT NULL DEFAULT 0"),
        ("last_login_date",    "DATE"),
        ("class_locked",       "BOOLEAN NOT NULL DEFAULT FALSE"),
        ("boss_week",          "VARCHAR(10)"),
        ("boss_hp",            "INTEGER NOT NULL DEFAULT 40"),
        ("boss_max_hp",        "INTEGER NOT NULL DEFAULT 40"),
        ("boss_reward_claimed","BOOLEAN NOT NULL DEFAULT FALSE"),
    ]

    with engine.connect() as conn:
        for col, definition in migrations_users:
            if not _col_exists(conn, "users", col):
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {definition}"))
                    conn.commit()
                except Exception:
                    pass

        for col, definition in migrations_characters:
            if not _col_exists(conn, "characters", col):
                try:
                    conn.execute(text(f"ALTER TABLE characters ADD COLUMN {col} {definition}"))
                    conn.commit()
                except Exception:
                    pass
