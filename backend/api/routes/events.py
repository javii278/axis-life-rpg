from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Character, Habit, HabitLog, FocusSession, User
from backend.core.auth import get_current_user

router = APIRouter(prefix="/events", tags=["events"])

_EVENTS = [
    {
        "key": "semana_vit",
        "name": "Semana de Hierro",
        "theme": "VIT",
        "emoji": "💪",
        "color": "#ef4444",
        "description": "Completa 5 hábitos de Vitalidad esta semana",
        "goal_type": "habits",
        "target_count": 5,
        "xp_bonus": 150,
    },
    {
        "key": "gran_foco",
        "name": "El Gran Foco",
        "theme": "FOC",
        "emoji": "🎯",
        "color": "#06b6d4",
        "description": "Completa 4 sesiones de foco de al menos 25 minutos",
        "goal_type": "focus_sessions",
        "target_count": 4,
        "xp_bonus": 120,
    },
    {
        "key": "busqueda_saber",
        "name": "La Búsqueda del Saber",
        "theme": "SAB",
        "emoji": "📚",
        "color": "#a78bfa",
        "description": "Completa 5 hábitos de Sabiduría esta semana",
        "goal_type": "habits",
        "target_count": 5,
        "xp_bonus": 150,
    },
    {
        "key": "prueba_disciplina",
        "name": "La Prueba de Disciplina",
        "theme": "DIS",
        "emoji": "⚔️",
        "color": "#f59e0b",
        "description": "Completa 6 hábitos de Disciplina esta semana",
        "goal_type": "habits",
        "target_count": 6,
        "xp_bonus": 180,
    },
    {
        "key": "semana_creativa",
        "name": "Semana Creativa",
        "theme": "CRE",
        "emoji": "✨",
        "color": "#10b981",
        "description": "Completa 5 hábitos de Creatividad esta semana",
        "goal_type": "habits",
        "target_count": 5,
        "xp_bonus": 150,
    },
    {
        "key": "voluntad_hierro",
        "name": "La Voluntad de Hierro",
        "theme": "VOL",
        "emoji": "🔥",
        "color": "#f97316",
        "description": "Completa 5 hábitos de Voluntad esta semana",
        "goal_type": "habits",
        "target_count": 5,
        "xp_bonus": 150,
    },
]


def _get_current_event() -> dict:
    week = date.today().isocalendar()[1]
    return _EVENTS[week % len(_EVENTS)]


def _user_progress(event: dict, user_id: int, db: Session) -> int:
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    if event["goal_type"] == "habits":
        return (
            db.query(func.count(HabitLog.id))
            .join(Habit, Habit.id == HabitLog.habit_id)
            .filter(
                Habit.user_id == user_id,
                Habit.stat_target == event["theme"],
                HabitLog.log_date >= week_start,
            )
            .scalar() or 0
        )
    elif event["goal_type"] == "focus_sessions":
        week_start_dt = f"{week_start} 00:00:00"
        return (
            db.query(func.count(FocusSession.id))
            .filter(
                FocusSession.user_id == user_id,
                FocusSession.ended_at.isnot(None),
                FocusSession.started_at >= week_start_dt,
                FocusSession.duration_minutes >= 25,
            )
            .scalar() or 0
        )
    return 0


@router.get("/active")
def get_active_event(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = _get_current_event()
    today = date.today()
    days_left = 6 - today.weekday()  # días hasta el domingo

    progress = _user_progress(event, current_user.id, db)
    iso_week = f"{today.isocalendar()[0]}-{today.isocalendar()[1]}"

    return {
        **event,
        "current_progress": min(progress, event["target_count"]),
        "completed": progress >= event["target_count"],
        "days_remaining": days_left,
        "iso_week": iso_week,
    }


@router.post("/claim")
def claim_event_reward(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = _get_current_event()
    progress = _user_progress(event, current_user.id, db)
    if progress < event["target_count"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Evento no completado todavía")

    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    if character:
        character.total_xp += event["xp_bonus"]
        db.commit()
        from backend.core.stats_engine import recalculate_character
        recalculate_character(current_user.id, db)

    return {"xp_gained": event["xp_bonus"], "event_name": event["name"]}
