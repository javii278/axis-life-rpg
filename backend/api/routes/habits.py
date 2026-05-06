from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Habit, HabitLog, StatType, HabitFrequency, User
from backend.core.stats_engine import calculate_streak, recalculate_character
from backend.core.auth import get_current_user

router = APIRouter(prefix="/habits", tags=["habits"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    stat_target: StatType
    frequency: HabitFrequency = HabitFrequency.DAILY
    xp_reward: int = 10


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class HabitLogCreate(BaseModel):
    log_date: date
    notes: Optional[str] = None
    energy_level: Optional[int] = None  # 1-5


class HabitOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    stat_target: str
    frequency: str
    xp_reward: int
    is_active: bool
    streak: int
    completed_today: bool

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[HabitOut])
def list_habits(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habits = (
        db.query(Habit)
        .filter(Habit.user_id == current_user.id, Habit.is_active == True)
        .all()
    )
    today = date.today()
    result = []
    for h in habits:
        streak = calculate_streak(h, db)
        completed_today = any(log.log_date == today for log in h.logs)
        result.append(HabitOut(
            id=h.id, name=h.name, description=h.description,
            stat_target=h.stat_target, frequency=h.frequency,
            xp_reward=h.xp_reward, is_active=h.is_active,
            streak=streak, completed_today=completed_today,
        ))
    return result


@router.post("/", response_model=HabitOut, status_code=201)
def create_habit(payload: HabitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = Habit(user_id=current_user.id, **payload.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return HabitOut(
        id=habit.id, name=habit.name, description=habit.description,
        stat_target=habit.stat_target, frequency=habit.frequency,
        xp_reward=habit.xp_reward, is_active=habit.is_active,
        streak=0, completed_today=False,
    )


@router.patch("/{habit_id}", response_model=HabitOut)
def update_habit(habit_id: int, payload: HabitUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(habit, field, value)
    db.commit()
    db.refresh(habit)

    streak = calculate_streak(habit, db)
    today = date.today()
    completed_today = any(log.log_date == today for log in habit.logs)
    return HabitOut(
        id=habit.id, name=habit.name, description=habit.description,
        stat_target=habit.stat_target, frequency=habit.frequency,
        xp_reward=habit.xp_reward, is_active=habit.is_active,
        streak=streak, completed_today=completed_today,
    )


@router.delete("/{habit_id}", status_code=204)
def delete_habit(habit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit.is_active = False
    db.commit()


@router.post("/{habit_id}/complete", status_code=200)
def complete_habit(habit_id: int, payload: HabitLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    already_done = (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit_id, HabitLog.log_date == payload.log_date)
        .first()
    )
    if already_done:
        raise HTTPException(status_code=409, detail="Already completed for this date")

    log = HabitLog(habit_id=habit_id, **payload.model_dump())
    db.add(log)
    db.commit()  # commit primero para que el streak incluya el log de hoy

    from backend.models import Character
    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    xp_gained = 0
    if character:
        from backend.core.stats_engine import streak_multiplier
        streak = calculate_streak(habit, db)
        xp_gained = int(habit.xp_reward * streak_multiplier(streak))
        character.total_xp += xp_gained
        db.commit()
    updated_character = recalculate_character(current_user.id, db)

    from backend.core.achievements_engine import check_achievements
    newly_unlocked = check_achievements(current_user.id, db)

    streak = calculate_streak(habit, db)
    return {
        "message": "Habit completed",
        "xp_gained": xp_gained,
        "streak": streak,
        "character_level": updated_character.level if updated_character else 1,
        "new_achievements": [
            {"key": a.key, "name": a.name, "icon": a.icon, "rarity": a.rarity}
            for a in newly_unlocked
        ],
    }


@router.delete("/{habit_id}/complete/{log_date}", status_code=204)
def undo_complete(habit_id: int, log_date: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    log = (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit_id, HabitLog.log_date == log_date)
        .first()
    )
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    recalculate_character(current_user.id, db)
