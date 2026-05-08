"""
Coach IA — Consejero Arcano de Axis.
Usa Claude API con contexto completo del personaje para dar consejos narrativos.
"""
import os
from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
import anthropic

from backend.models import Character, Habit, HabitLog, FocusSession, Quest, StatSnapshot, UserAchievement
from backend.core.stats_engine import calculate_streak
from backend.core.achievements_engine import ACHIEVEMENTS

SYSTEM_PROMPT = """Eres el Consejero Arcano del jugador en Axis: The Life RPG.

Tu rol:
- Hablas en tono de RPG narrativo pero siempre basado en datos REALES del jugador
- Eres honesto y directo — nunca das frases motivacionales vacías
- Analizas patrones y das consejos específicos y accionables
- Cuando el personaje tiene un problema, lo nombras claramente
- Tu tono es el de un mentor sabio que ha visto muchos héroes caer y levantarse
- Respondes en español, de forma concisa (máximo 3-4 párrafos)
- Puedes usar negrita con **texto** para destacar ideas clave
- Si el jugador te saluda o hace preguntas casuales, respondes en lore pero con calidez

Regla importante: NO inventes datos. Solo usa lo que aparece en el contexto del personaje."""

# Lookup de nombres de achievements por key
_ACHIEVEMENT_BY_KEY = {a.key: a for a in ACHIEVEMENTS}


def _build_context(user_id: int, db: Session) -> str:
    character = db.query(Character).filter(Character.user_id == user_id).first()
    if not character:
        return "No se encontró personaje para este usuario."

    habits = db.query(Habit).filter(Habit.user_id == user_id, Habit.is_active == True).all()
    active_quests = (
        db.query(Quest)
        .filter(Quest.user_id == user_id, Quest.is_active == True, Quest.is_completed == False)
        .all()
    )

    today = date.today()
    week_ago = today - timedelta(days=7)

    # Foco esta semana
    focus_this_week = (
        db.query(FocusSession)
        .filter(
            FocusSession.user_id == user_id,
            FocusSession.ended_at.isnot(None),
            FocusSession.started_at >= datetime.combine(week_ago, datetime.min.time()),
        )
        .all()
    )
    focus_minutes = sum(s.duration_minutes or 0 for s in focus_this_week)

    # Hábitos: racha + completados esta semana
    habit_lines = []
    for h in habits:
        streak = calculate_streak(h, db)
        completed_today = any(log.log_date == today for log in h.logs)
        completed_this_week = sum(1 for log in h.logs if week_ago <= log.log_date <= today)
        expected = 7 if h.frequency == "daily" else 1
        missed = max(0, expected - completed_this_week)
        status = "✓" if completed_today else "✗"
        miss_str = f" | faltas esta semana: {missed}" if missed > 0 else ""
        habit_lines.append(
            f"  - {h.name} [{h.stat_target}] | streak: {streak}d | hoy: {status}{miss_str}"
        )

    quest_lines = [f"  - [{q.quest_type.upper()}] {q.title} (+{q.xp_reward} XP)" for q in active_quests]

    # Delta de stats vs hace 7 días
    week_snapshot = (
        db.query(StatSnapshot)
        .filter(
            StatSnapshot.user_id == user_id,
            StatSnapshot.snapshot_date <= week_ago,
        )
        .order_by(StatSnapshot.snapshot_date.desc())
        .first()
    )

    delta_section = ""
    if week_snapshot:
        deltas = {
            "VIT": character.vit - week_snapshot.vit,
            "FOC": character.foc - week_snapshot.foc,
            "SAB": character.sab - week_snapshot.sab,
            "DIS": character.dis - week_snapshot.dis,
            "CRE": character.cre - week_snapshot.cre,
            "VOL": character.vol - week_snapshot.vol,
        }
        delta_parts = " | ".join(
            f"{k}: {'+' if v >= 0 else ''}{v:.1f}" for k, v in deltas.items()
        )
        delta_section = f"\nCAMBIOS VS HACE 7 DÍAS:\n  {delta_parts}"

    # Logros recientes (últimos 7 días)
    recent_ua = (
        db.query(UserAchievement)
        .filter(
            UserAchievement.user_id == user_id,
            UserAchievement.unlocked_at >= datetime.combine(week_ago, datetime.min.time()),
        )
        .all()
    )
    recent_achievement_lines = []
    for ua in recent_ua:
        ach = _ACHIEVEMENT_BY_KEY.get(ua.achievement_key)
        if ach:
            recent_achievement_lines.append(f"  - {ach.icon} {ach.name} ({ach.rarity})")

    achievement_section = ""
    if recent_achievement_lines:
        achievement_section = f"\nLOGROS DESBLOQUEADOS ESTA SEMANA:\n" + "\n".join(recent_achievement_lines)

    context = f"""=== ESTADO DEL PERSONAJE ===
Nombre: {character.name}
Clase: {character.character_class}
Nivel: {character.level} | XP Total: {character.total_xp}

STATS ACTUALES (0-100):
  VIT={character.vit:.0f}  FOC={character.foc:.0f}  SAB={character.sab:.0f}
  DIS={character.dis:.0f}  CRE={character.cre:.0f}  VOL={character.vol:.0f}
{delta_section}
HÁBITOS ACTIVOS ({len(habits)}):
{chr(10).join(habit_lines) if habit_lines else "  (ninguno)"}

FOCO ESTA SEMANA: {focus_minutes} minutos en {len(focus_this_week)} sesiones

QUESTS ACTIVAS ({len(active_quests)}):
{chr(10).join(quest_lines) if quest_lines else "  (ninguna)"}
{achievement_section}
"""
    return context


def get_coach_response(user_message: str, user_id: int, db: Session) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return (
            "⚠️ El Consejero Arcano duerme — no se encontró ANTHROPIC_API_KEY en el entorno. "
            "Configura la variable de entorno para despertar al consejero."
        )

    context = _build_context(user_id, db)

    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"{context}\n\n=== MENSAJE DEL JUGADOR ===\n{user_message}",
            }
        ],
    )

    return message.content[0].text


def get_weekly_insight(user_id: int, db: Session) -> str:
    """Genera un análisis semanal automático sin input del usuario."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return "Configura ANTHROPIC_API_KEY para activar los insights del Consejero."

    context = _build_context(user_id, db)
    prompt = (
        "Genera el análisis semanal del personaje. "
        "Incluye: qué va bien (stats en alza, rachas activas), qué está en riesgo (stats bajando, hábitos con faltas), "
        "y una misión específica y accionable para esta semana. "
        "Sé concreto, usa los datos reales, y mantén el tono narrativo de RPG."
    )

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"{context}\n\n{prompt}"}],
    )
    return message.content[0].text
