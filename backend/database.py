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
    if _is_sqlite:
        _migrate_add_auth_columns()


def _migrate_add_auth_columns():
    """Añade columnas de auth a users si no existen (SQLite, migración no destructiva)."""
    from sqlalchemy import text
    with engine.connect() as conn:
        for col, definition in [
            ("username", "VARCHAR(100)"),
            ("password_hash", "VARCHAR(200)"),
            ("email", "VARCHAR(200)"),
        ]:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {definition}"))
                conn.commit()
            except Exception:
                pass  # La columna ya existe
