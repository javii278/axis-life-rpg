"""
Motor de cálculo de stats del personaje.

Lógica:
- Ventana de 30 días con decay exponencial (actividad reciente pesa más)
- Streak activo aplica multiplicador de XP
- Stats van de 0 a 100
- Cada hábito apunta a un stat específico
"""
from datetime import date, timedelta
from math import exp
from sqlalchemy.orm import Session
from backend.models import Habit, HabitLog, FocusSession, Character, CharacterClass, StatSnapshot
from backend.models import StatType


DECAY_LAMBDA = 0.07       # Cuánto decae el peso de días anteriores
WINDOW_DAYS = 30          # Ventana de evaluación
MAX_STAT = 100.0
FOCUS_STAT = StatType.FOC  # Las sesiones de foco alimentan FOC


def _day_weight(days_ago: int) -> float:
    """Peso exponencial: hoy = 1.0, hace 30 días ≈ 0.12"""
    return exp(-DECAY_LAMBDA * days_ago)


def calculate_habit_stat(habit: Habit, db: Session, reference_date: date = None) -> float:
    """Calcula la contribución de un hábito a su stat (0-100)."""
    if reference_date is None:
        reference_date = date.today()

    start = reference_date - timedelta(days=WINDOW_DAYS)
    logs = (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit.id, HabitLog.log_date >= start)
        .all()
    )
    log_dates = {log.log_date for log in logs}

    weighted_sum = 0.0
    max_possible = 0.0

    for i in range(WINDOW_DAYS):
        day = reference_date - timedelta(days=i)
        w = _day_weight(i)
        max_possible += w
        if day in log_dates:
            weighted_sum += w

    if max_possible == 0:
        return 0.0

    return min((weighted_sum / max_possible) * MAX_STAT, MAX_STAT)


def calculate_focus_stat(user_id: int, db: Session, reference_date: date = None) -> float:
    """Calcula FOC basado en sesiones de foco completadas."""
    if reference_date is None:
        reference_date = date.today()

    start = reference_date - timedelta(days=WINDOW_DAYS)
    sessions = (
        db.query(FocusSession)
        .filter(
            FocusSession.user_id == user_id,
            FocusSession.ended_at.isnot(None),
            FocusSession.started_at >= str(start),
        )
        .all()
    )

    weighted_sum = 0.0
    max_possible = 0.0
    target_minutes_per_day = 60  # 1 hora de foco = contribución completa

    for i in range(WINDOW_DAYS):
        day = reference_date - timedelta(days=i)
        w = _day_weight(i)
        max_possible += w

        day_minutes = sum(
            s.duration_minutes or 0
            for s in sessions
            if s.started_at.date() == day
        )
        contribution = min(day_minutes / target_minutes_per_day, 1.0)
        weighted_sum += w * contribution

    if max_possible == 0:
        return 0.0

    return min((weighted_sum / max_possible) * MAX_STAT, MAX_STAT)


def calculate_streak(habit: Habit, db: Session, reference_date: date = None) -> int:
    """Calcula el streak actual de un hábito (días consecutivos)."""
    if reference_date is None:
        reference_date = date.today()

    logs = (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit.id)
        .order_by(HabitLog.log_date.desc())
        .all()
    )
    log_dates = {log.log_date for log in logs}

    streak = 0
    current = reference_date
    while current in log_dates:
        streak += 1
        current -= timedelta(days=1)

    return streak


def streak_multiplier(streak: int) -> float:
    """Multiplicador de XP según streak. Max x3.0 a los 30 días."""
    if streak == 0:
        return 1.0
    return min(1.0 + (streak / 30.0) * 2.0, 3.0)


def determine_class(vit, foc, sab, dis, cre, vol) -> str:
    """Determina la clase según los 2 stats más altos."""
    stats = {
        StatType.VIT: vit,
        StatType.FOC: foc,
        StatType.SAB: sab,
        StatType.DIS: dis,
        StatType.CRE: cre,
        StatType.VOL: vol,
    }
    sorted_stats = sorted(stats.items(), key=lambda x: x[1], reverse=True)
    top_two = {s[0] for s in sorted_stats[:2]}

    class_map = {
        frozenset({StatType.FOC, StatType.SAB}): CharacterClass.ARCHITECT,
        frozenset({StatType.VIT, StatType.DIS}): CharacterClass.WARRIOR,
        frozenset({StatType.CRE, StatType.SAB}): CharacterClass.SCHOLAR,
        frozenset({StatType.VOL, StatType.FOC}): CharacterClass.MONK,
        frozenset({StatType.VIT, StatType.CRE}): CharacterClass.EXPLORER,
        frozenset({StatType.DIS, StatType.VOL}): CharacterClass.GUARDIAN,
    }
    return class_map.get(frozenset(top_two), CharacterClass.NOVICE)


def xp_for_level(level: int) -> int:
    """XP total necesario para alcanzar un nivel. Curva cuadrática."""
    return 100 * (level ** 2)


def recalculate_character(user_id: int, db: Session) -> Character:
    """
    Recalcula todos los stats del personaje y actualiza la DB.
    Llamar después de cualquier acción del usuario.
    """
    character = db.query(Character).filter(Character.user_id == user_id).first()
    if not character:
        return None

    habits = (
        db.query(Habit)
        .filter(Habit.user_id == user_id, Habit.is_active == True)
        .all()
    )

    # Agrupar hábitos por stat
    stat_values: dict[str, list[float]] = {s.value: [] for s in StatType}

    for habit in habits:
        score = calculate_habit_stat(habit, db)
        stat_values[habit.stat_target].append(score)

    def avg(values: list[float]) -> float:
        return sum(values) / len(values) if values else 0.0

    # FOC suma las sesiones de foco también
    focus_score = calculate_focus_stat(user_id, db)
    foc_values = stat_values[StatType.FOC.value] + [focus_score]

    new_stats = {
        "vit": avg(stat_values[StatType.VIT.value]),
        "foc": avg(foc_values),
        "sab": avg(stat_values[StatType.SAB.value]),
        "dis": avg(stat_values[StatType.DIS.value]),
        "cre": avg(stat_values[StatType.CRE.value]),
        "vol": avg(stat_values[StatType.VOL.value]),
    }

    character.vit = round(new_stats["vit"], 1)
    character.foc = round(new_stats["foc"], 1)
    character.sab = round(new_stats["sab"], 1)
    character.dis = round(new_stats["dis"], 1)
    character.cre = round(new_stats["cre"], 1)
    character.vol = round(new_stats["vol"], 1)
    if not character.class_locked:
        character.character_class = determine_class(**new_stats)

    # Recalcular nivel
    while character.total_xp >= xp_for_level(character.level + 1):
        character.level += 1

    db.commit()
    db.refresh(character)

    # Guardar snapshot diario
    today = date.today()
    existing = (
        db.query(StatSnapshot)
        .filter(StatSnapshot.user_id == user_id, StatSnapshot.snapshot_date == today)
        .first()
    )
    if existing:
        for k, v in new_stats.items():
            setattr(existing, k, round(v, 1))
        existing.level = character.level
    else:
        snapshot = StatSnapshot(
            user_id=user_id,
            snapshot_date=today,
            level=character.level,
            **{k: round(v, 1) for k, v in new_stats.items()},
        )
        db.add(snapshot)

    db.commit()
    return character
