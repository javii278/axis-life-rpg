"""
Motor de achievements: define todos los logros y detecta cuáles se acaban de desbloquear.
Llamar a check_achievements() después de cualquier acción que pueda desbloquear un logro.
"""
from datetime import datetime
from dataclasses import dataclass
from sqlalchemy.orm import Session

from backend.models import (
    UserAchievement, Habit, HabitLog, FocusSession,
    Quest, Character, StatSnapshot
)


@dataclass
class AchievementDef:
    key: str
    name: str
    description: str
    icon: str          # emoji usado en el frontend
    rarity: str        # bronze | silver | gold
    xp_bonus: int


ACHIEVEMENTS: list[AchievementDef] = [
    AchievementDef("first_habit",      "Primer Paso",        "Completa tu primer hábito",                   "👣", "bronze", 50),
    AchievementDef("habits_5",         "Ritualista",         "Ten 5 hábitos activos",                       "📋", "bronze", 75),
    AchievementDef("streak_7",         "Semana de Fuego",    "7 días de racha en cualquier hábito",         "🔥", "bronze", 100),
    AchievementDef("streak_30",        "Mes Imparable",      "30 días de racha en cualquier hábito",        "⚡", "gold",   400),
    AchievementDef("streak_100",       "Leyenda",            "100 días de racha en cualquier hábito",       "👑", "gold",   1000),
    AchievementDef("focus_1h",         "Concentrado",        "Acumula 1 hora total de foco",                "🎯", "bronze", 75),
    AchievementDef("focus_10h",        "Maestro del Foco",   "Acumula 10 horas totales de foco",            "🧠", "silver", 200),
    AchievementDef("focus_50h",        "Monje Digital",      "Acumula 50 horas totales de foco",            "🏔️", "gold",   600),
    AchievementDef("focus_quality",    "Perfeccionista",     "5 sesiones con calidad máxima (5/5)",         "💎", "silver", 150),
    AchievementDef("quest_first",      "Aventurero",         "Completa tu primera quest",                   "⚔️", "bronze", 50),
    AchievementDef("quest_10",         "Héroe",              "Completa 10 quests",                          "🏆", "silver", 200),
    AchievementDef("quest_50",         "Legendario",         "Completa 50 quests",                          "🌟", "gold",   500),
    AchievementDef("level_5",          "Forjado",            "Alcanza el nivel 5",                          "🛡️", "bronze", 150),
    AchievementDef("level_10",         "Veterano",           "Alcanza el nivel 10",                         "⚔️", "silver", 300),
    AchievementDef("level_20",         "Élite",              "Alcanza el nivel 20",                         "🔱", "gold",   700),
    AchievementDef("stat_50",          "Especialista",       "Cualquier stat supera 50",                    "📈", "silver", 150),
    AchievementDef("all_stats_10",     "Polímata",           "Todos los stats superan 10",                  "🌐", "silver", 250),
    AchievementDef("class_unlock",     "Clase Desbloqueada", "Desbloquea tu primera clase",                 "🎭", "silver", 200),
]

ACHIEVEMENTS_BY_KEY = {a.key: a for a in ACHIEVEMENTS}


def check_achievements(user_id: int, db: Session) -> list[AchievementDef]:
    """Evalúa condiciones y desbloquea achievements nuevos. Devuelve los recién desbloqueados."""
    already_unlocked = {
        ua.achievement_key
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
    }

    newly_unlocked: list[AchievementDef] = []

    def unlock(key: str):
        if key not in already_unlocked:
            db.add(UserAchievement(user_id=user_id, achievement_key=key))
            already_unlocked.add(key)
            newly_unlocked.append(ACHIEVEMENTS_BY_KEY[key])
            # Dar XP bonus al personaje
            char = db.query(Character).filter(Character.user_id == user_id).first()
            if char:
                char.total_xp += ACHIEVEMENTS_BY_KEY[key].xp_bonus

    # ── Datos necesarios ──────────────────────────────────────────────────────
    habits = db.query(Habit).filter(Habit.user_id == user_id, Habit.is_active == True).all()
    logs = db.query(HabitLog).join(Habit).filter(Habit.user_id == user_id).all()
    focus_sessions = db.query(FocusSession).filter(
        FocusSession.user_id == user_id,
        FocusSession.duration_minutes != None
    ).all()
    quests_done = db.query(Quest).filter(
        Quest.user_id == user_id,
        Quest.is_completed == True
    ).count()
    character = db.query(Character).filter(Character.user_id == user_id).first()

    # ── Hábitos ───────────────────────────────────────────────────────────────
    if logs:
        unlock("first_habit")
    if len(habits) >= 5:
        unlock("habits_5")

    # Streaks máximas por hábito
    from backend.core.stats_engine import calculate_streak
    max_streak = 0
    for habit in habits:
        s = calculate_streak(habit, db)
        if s > max_streak:
            max_streak = s
    if max_streak >= 7:
        unlock("streak_7")
    if max_streak >= 30:
        unlock("streak_30")
    if max_streak >= 100:
        unlock("streak_100")

    # ── Foco ─────────────────────────────────────────────────────────────────
    total_focus_minutes = sum(s.duration_minutes or 0 for s in focus_sessions)
    if total_focus_minutes >= 60:
        unlock("focus_1h")
    if total_focus_minutes >= 600:
        unlock("focus_10h")
    if total_focus_minutes >= 3000:
        unlock("focus_50h")

    quality_5 = sum(1 for s in focus_sessions if s.quality == 5)
    if quality_5 >= 5:
        unlock("focus_quality")

    # ── Quests ────────────────────────────────────────────────────────────────
    if quests_done >= 1:
        unlock("quest_first")
    if quests_done >= 10:
        unlock("quest_10")
    if quests_done >= 50:
        unlock("quest_50")

    # ── Personaje ─────────────────────────────────────────────────────────────
    if character:
        if character.level >= 5:
            unlock("level_5")
        if character.level >= 10:
            unlock("level_10")
        if character.level >= 20:
            unlock("level_20")

        stats = [character.vit, character.foc, character.sab, character.dis, character.cre, character.vol]
        if any(s >= 50 for s in stats):
            unlock("stat_50")
        if all(s >= 10 for s in stats):
            unlock("all_stats_10")
        if character.character_class != "Novice":
            unlock("class_unlock")

    if newly_unlocked:
        db.commit()

    return newly_unlocked


def get_all_with_status(user_id: int, db: Session) -> list[dict]:
    """Devuelve todos los achievements con su estado de desbloqueo."""
    unlocked_map = {
        ua.achievement_key: ua.unlocked_at
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
    }
    result = []
    for ach in ACHIEVEMENTS:
        unlocked_at = unlocked_map.get(ach.key)
        result.append({
            "key": ach.key,
            "name": ach.name,
            "description": ach.description,
            "icon": ach.icon,
            "rarity": ach.rarity,
            "xp_bonus": ach.xp_bonus,
            "unlocked": ach.key in unlocked_map,
            "unlocked_at": unlocked_at.isoformat() if unlocked_at else None,
        })
    return result
