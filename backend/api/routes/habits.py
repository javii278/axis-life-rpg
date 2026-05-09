from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Habit, HabitLog, StatType, HabitFrequency, User
from backend.core.stats_engine import calculate_streak, recalculate_character
from backend.core.auth import get_current_user
from backend.core.limiter import limiter

_COMBO_MULT = [1.0, 1.2, 1.5, 1.8, 2.0]

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
@limiter.limit("60/hour")
def complete_habit(request: Request, habit_id: int, payload: HabitLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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

    # Combo multiplier: cuántos hábitos diarios se completaron antes de este
    today = payload.log_date
    done_today_count = (
        db.query(HabitLog)
        .join(Habit, Habit.id == HabitLog.habit_id)
        .filter(
            Habit.user_id == current_user.id,
            Habit.is_active == True,
            Habit.frequency == HabitFrequency.DAILY,
            HabitLog.log_date == today,
        )
        .count()
    )
    combo_count = max(0, done_today_count - 1)  # este ya está contado (commit fue antes)
    combo_multiplier = _COMBO_MULT[min(combo_count, len(_COMBO_MULT) - 1)]

    xp_gained = 0
    if character:
        from backend.core.stats_engine import streak_multiplier
        streak = calculate_streak(habit, db)
        xp_gained = int(habit.xp_reward * streak_multiplier(streak) * combo_multiplier)
        character.total_xp += xp_gained
        db.commit()
    updated_character = recalculate_character(current_user.id, db)

    from backend.core.achievements_engine import check_achievements
    newly_unlocked = check_achievements(current_user.id, db)

    streak = calculate_streak(habit, db)

    # Perfect Day: ¿todos los hábitos diarios completados?
    total_daily = (
        db.query(Habit)
        .filter(Habit.user_id == current_user.id, Habit.is_active == True, Habit.frequency == HabitFrequency.DAILY)
        .count()
    )
    perfect_day = (total_daily > 0 and done_today_count >= total_daily)
    perfect_day_xp = 0
    coins_gained = 0
    if character:
        coins_per_habit = 1 + min(combo_count, 2)  # 1, 2 o 3 monedas según combo
        character.coins = (character.coins or 0) + coins_per_habit
        coins_gained += coins_per_habit
    if perfect_day and character:
        perfect_day_xp = 50
        character.total_xp += perfect_day_xp
        xp_gained += perfect_day_xp
        character.coins = (character.coins or 0) + 10
        coins_gained += 10
    if character:
        db.commit()

    # Jefe semanal: recibir daño
    boss_hp = None
    boss_max_hp = None
    if character:
        import datetime as _dt
        iso_year, iso_week, _ = _dt.date.today().isocalendar()
        current_boss_week = f"{iso_year}-W{iso_week:02d}"
        if character.boss_week != current_boss_week:
            character.boss_week = current_boss_week
            character.boss_hp = character.boss_max_hp
            character.boss_reward_claimed = False
        if character.boss_hp > 0:
            character.boss_hp = max(0, character.boss_hp - 1)
        boss_hp = character.boss_hp
        boss_max_hp = character.boss_max_hp
        db.commit()

    # Cofre aleatorio cada múltiplo de 7 en la racha
    chest_reward = None
    if streak > 0 and streak % 7 == 0 and character:
        import random as _rnd
        roll = _rnd.random()
        if roll < 0.45:
            bonus_xp = _rnd.randint(50, 150)
            character.total_xp += bonus_xp
            chest_reward = {"type": "xp", "amount": bonus_xp}
        elif roll < 0.75:
            character.streak_shields = min((character.streak_shields or 0) + 1, 3)
            chest_reward = {"type": "shield"}
        else:
            bonus_xp = _rnd.randint(30, 80)
            character.total_xp += bonus_xp
            character.streak_shields = min((character.streak_shields or 0) + 1, 3)
            chest_reward = {"type": "both", "amount": bonus_xp}
        db.commit()

    return {
        "message": "Habit completed",
        "xp_gained": xp_gained,
        "streak": streak,
        "character_level": updated_character.level if updated_character else 1,
        "chest_reward": chest_reward,
        "perfect_day": perfect_day,
        "perfect_day_xp": perfect_day_xp,
        "combo_count": combo_count,
        "combo_multiplier": round(combo_multiplier, 2),
        "boss_hp": boss_hp,
        "boss_max_hp": boss_max_hp,
        "coins_gained": coins_gained,
        "new_achievements": [
            {"key": a.key, "name": a.name, "icon": a.icon, "rarity": a.rarity}
            for a in newly_unlocked
        ],
    }


@router.post("/{habit_id}/shield", status_code=200)
def use_streak_shield(habit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Usa un escudo de racha para marcar el hábito de hoy sin completarlo manualmente."""
    from backend.models import Character
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    if not character or character.streak_shields < 1:
        raise HTTPException(status_code=403, detail="No tienes escudos de racha disponibles")

    today = date.today()
    already_done = (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit_id, HabitLog.log_date == today)
        .first()
    )
    if already_done:
        raise HTTPException(status_code=409, detail="Habit already completed today")

    log = HabitLog(habit_id=habit_id, log_date=today, notes="__shield__")
    db.add(log)
    character.streak_shields -= 1
    db.commit()

    new_streak = calculate_streak(habit, db)
    return {
        "message": "Escudo usado",
        "streak": new_streak,
        "shields_remaining": character.streak_shields,
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
