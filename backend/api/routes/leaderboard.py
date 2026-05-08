import hashlib
import random
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Character, Habit, HabitLog, FocusSession, User
from backend.core.auth import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

_GHOST_NAMES = [
    "Aethon", "Valdris", "Seraphine", "Korrath", "Lyrina", "Theron",
    "Caelum", "Isolde", "Zephyr", "Darian", "Miriel", "Sarkon",
    "Evaine", "Rhydian", "Celeste", "Orin", "Nythara", "Faeron",
    "Tessaly", "Brandor", "Silvaine", "Xelara", "Mordecai", "Lunara",
    "Castien", "Vareth", "Idris", "Solvey", "Calyx", "Fenris",
]
_GHOST_CLASSES = ["Warrior", "Scholar", "Monk", "Architect", "Explorer", "Guardian"]


def _weekly_xp(user_id: int, db: Session) -> int:
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # lunes
    week_start_dt = datetime(week_start.year, week_start.month, week_start.day)

    habit_count = (
        db.query(func.count(HabitLog.id))
        .join(Habit, Habit.id == HabitLog.habit_id)
        .filter(Habit.user_id == user_id, HabitLog.log_date >= week_start)
        .scalar() or 0
    )
    focus_minutes = (
        db.query(func.coalesce(func.sum(FocusSession.duration_minutes), 0))
        .filter(
            FocusSession.user_id == user_id,
            FocusSession.ended_at.isnot(None),
            FocusSession.started_at >= week_start_dt,
        )
        .scalar() or 0
    )
    return habit_count * 12 + int(focus_minutes / 25) * 10


@router.get("/weekly")
def weekly_leaderboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    if not character:
        return []

    user_level = character.level
    user_xp = _weekly_xp(current_user.id, db)

    # Semilla determinista: mismo usuario + misma semana ISO = mismos rivales
    iso = date.today().isocalendar()
    seed = int(hashlib.md5(f"{current_user.id}-{iso[0]}-{iso[1]}".encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)

    base = max(user_xp, 10)
    ghosts = []
    for _ in range(29):
        level = max(1, user_level + rng.randint(-4, 5))
        delta = rng.randint(-int(base * 0.65), int(base * 0.75 + 50))
        weekly_xp = max(0, base + delta)
        ghosts.append({
            "name": rng.choice(_GHOST_NAMES),
            "character_class": rng.choice(_GHOST_CLASSES),
            "level": level,
            "weekly_xp": weekly_xp,
            "is_me": False,
        })

    ghosts.append({
        "name": character.name,
        "character_class": character.character_class,
        "level": character.level,
        "weekly_xp": user_xp,
        "is_me": True,
    })

    ghosts.sort(key=lambda x: x["weekly_xp"], reverse=True)
    for i, g in enumerate(ghosts):
        g["rank"] = i + 1

    return ghosts
