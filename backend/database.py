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
    _seed_shop()


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
        ("coins",              "INTEGER NOT NULL DEFAULT 0"),
        ("equipped_title",     "VARCHAR(100)"),
        ("equipped_aura",      "VARCHAR(50)"),
        ("equipped_border",    "VARCHAR(50)"),
        ("equipped_skin",      "VARCHAR(50)"),
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


_SHOP_CATALOG = [
    # ── Títulos ─────────────────────────────────────────────────────────────
    {"key": "title_guerrero_alba",  "name": "Guerrero del Alba",    "category": "title",  "value": "Guerrero del Alba",    "price": 50,  "description": "Para los que empiezan antes que el sol",          "rarity": "common",    "emoji": "🌅"},
    {"key": "title_sabio_pixel",    "name": "Sabio del Pixel",      "category": "title",  "value": "Sabio del Pixel",      "price": 100, "description": "Dominas el arte del RPG personal",                "rarity": "common",    "emoji": "🧙"},
    {"key": "title_implacable",     "name": "El Implacable",        "category": "title",  "value": "El Implacable",        "price": 150, "description": "Sin piedad. Sin excusas.",                        "rarity": "uncommon",  "emoji": "🔥"},
    {"key": "title_maestro_habit",  "name": "Maestro del Hábito",   "category": "title",  "value": "Maestro del Hábito",   "price": 120, "description": "La constancia es tu superpoder",                  "rarity": "uncommon",  "emoji": "🏆"},
    {"key": "title_perfeccionista", "name": "Perfeccionista",       "category": "title",  "value": "Perfeccionista",       "price": 180, "description": "El 100% es el mínimo aceptable",                  "rarity": "rare",      "emoji": "💎"},
    {"key": "title_champion",       "name": "Campeón Semanal",      "category": "title",  "value": "Campeón Semanal",      "price": 200, "description": "Derrotaste al jefe y volviste por más",           "rarity": "rare",      "emoji": "⚔️"},
    {"key": "title_leyenda",        "name": "Leyenda Viviente",     "category": "title",  "value": "Leyenda Viviente",     "price": 400, "description": "Pocos llegan hasta aquí",                         "rarity": "epic",      "emoji": "👑"},
    # ── Auras ────────────────────────────────────────────────────────────────
    {"key": "aura_fire",    "name": "Aura de Fuego",  "category": "aura",   "value": "#ef4444", "price": 80,  "description": "Arde con la pasión de tus hábitos",             "rarity": "common",    "emoji": "🔥"},
    {"key": "aura_ice",     "name": "Aura Glacial",   "category": "aura",   "value": "#06b6d4", "price": 80,  "description": "Frío como el acero, duro como el hielo",         "rarity": "common",    "emoji": "❄️"},
    {"key": "aura_nature",  "name": "Aura Natural",   "category": "aura",   "value": "#10b981", "price": 80,  "description": "En armonía con tu propio crecimiento",           "rarity": "common",    "emoji": "🌿"},
    {"key": "aura_gold",    "name": "Aura Dorada",    "category": "aura",   "value": "#f59e0b", "price": 100, "description": "El oro es el color del éxito",                   "rarity": "uncommon",  "emoji": "✨"},
    {"key": "aura_shadow",  "name": "Aura de Sombra", "category": "aura",   "value": "#6b21a8", "price": 150, "description": "El poder que se forja en la oscuridad",          "rarity": "rare",      "emoji": "🌑"},
    {"key": "aura_rainbow", "name": "Aura Arcoíris",  "category": "aura",   "value": "rainbow", "price": 350, "description": "Para los verdaderos campeones de la constancia", "rarity": "legendary", "emoji": "🌈"},
    # ── Marcos ───────────────────────────────────────────────────────────────
    {"key": "border_neon",    "name": "Marco Neón",       "category": "border", "value": "neon",    "price": 100, "description": "Brilla en la oscuridad del pixel art",       "rarity": "common",    "emoji": "💡"},
    {"key": "border_gold",    "name": "Marco Dorado",     "category": "border", "value": "gold",    "price": 150, "description": "Un borde digno de campeones",                "rarity": "uncommon",  "emoji": "🏅"},
    {"key": "border_crystal", "name": "Marco Cristalino", "category": "border", "value": "crystal", "price": 220, "description": "Transparente como tus intenciones",          "rarity": "rare",      "emoji": "💠"},
    {"key": "border_royal",   "name": "Marco Real",       "category": "border", "value": "royal",   "price": 320, "description": "Para el personaje que lo tiene todo",        "rarity": "epic",      "emoji": "👑"},
    # ── Skins ────────────────────────────────────────────────────────────────
    {"key": "skin_shadow",   "name": "Sombra",      "category": "skin", "value": "shadow",   "price": 120, "description": "Un guerrero que emerge de la oscuridad",           "rarity": "uncommon",  "emoji": "🌑"},
    {"key": "skin_gold",     "name": "Dorado",      "category": "skin", "value": "gold",     "price": 150, "description": "El brillo del éxito en cada píxel",               "rarity": "uncommon",  "emoji": "✨"},
    {"key": "skin_fire",     "name": "Llamas",      "category": "skin", "value": "fire",     "price": 130, "description": "Forjado en el fuego de la disciplina",             "rarity": "uncommon",  "emoji": "🔥"},
    {"key": "skin_ice",      "name": "Glacial",     "category": "skin", "value": "ice",      "price": 130, "description": "La calma del hielo, la fuerza del acero",          "rarity": "uncommon",  "emoji": "❄️"},
    {"key": "skin_nature",   "name": "Naturaleza",  "category": "skin", "value": "nature",   "price": 110, "description": "En armonía con el mundo que te rodea",             "rarity": "common",    "emoji": "🌿"},
    {"key": "skin_neon",     "name": "Neón",        "category": "skin", "value": "neon",     "price": 180, "description": "Directo del futuro digital",                       "rarity": "rare",      "emoji": "💜"},
    {"key": "skin_ghost",    "name": "Espectro",    "category": "skin", "value": "ghost",    "price": 250, "description": "Entre el mundo de los vivos y algo más",           "rarity": "rare",      "emoji": "👻"},
    {"key": "skin_crimson",  "name": "Carmesí",     "category": "skin", "value": "crimson",  "price": 160, "description": "La determinación hecha color",                     "rarity": "rare",      "emoji": "🩸"},
    {"key": "skin_void",     "name": "Vacío",       "category": "skin", "value": "void",     "price": 300, "description": "El poder que existe más allá de los límites",      "rarity": "epic",      "emoji": "🕳️"},
    {"key": "skin_cosmic",   "name": "Cósmico",     "category": "skin", "value": "cosmic",   "price": 400, "description": "Nacido entre las estrellas, destinado a brillar",  "rarity": "legendary", "emoji": "🌌"},
]


def _seed_shop():
    """Inserta el catálogo de cosméticos si no existe. Idempotente."""
    from backend.models import CosmeticItem
    db = SessionLocal()
    try:
        for item_data in _SHOP_CATALOG:
            if not db.query(CosmeticItem).filter(CosmeticItem.key == item_data["key"]).first():
                db.add(CosmeticItem(**item_data))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
