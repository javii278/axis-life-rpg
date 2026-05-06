"""
Coach IA — Consejero Arcano de Axis.
Usa Claude API con contexto completo del personaje para dar consejos narrativos.
"""
import os
from sqlalchemy.orm import Session
import anthropic

from backend.models import Character, Habit, HabitLog, FocusSession, Quest
from backend.core.stats_engine import calculate_streak

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

    from datetime import date, timedelta
    today = date.today()
    week_ago = today - timedelta(days=7)

    focus_this_week = (
        db.query(FocusSession)
        .filter(
            FocusSession.user_id == user_id,
            FocusSession.ended_at.isnot(None),
            FocusSession.started_at >= str(week_ago),
        )
        .all()
    )
    focus_minutes = sum(s.duration_minutes or 0 for s in focus_this_week)

    habit_lines = []
    for h in habits:
        streak = calculate_streak(h, db)
        completed_today = any(log.log_date == today for log in h.logs)
        habit_lines.append(
            f"  - {h.name} [{h.stat_target}] | streak: {streak} días | hoy: {'✓' if completed_today else '✗'}"
        )

    quest_lines = [f"  - [{q.quest_type.upper()}] {q.title} (+{q.xp_reward} XP)" for q in active_quests]

    context = f"""=== ESTADO DEL PERSONAJE ===
Nombre: {character.name}
Clase: {character.character_class}
Nivel: {character.level} | XP Total: {character.total_xp}

STATS (0-100):
  VIT={character.vit:.0f}  FOC={character.foc:.0f}  SAB={character.sab:.0f}
  DIS={character.dis:.0f}  CRE={character.cre:.0f}  VOL={character.vol:.0f}

HÁBITOS ACTIVOS ({len(habits)}):
{chr(10).join(habit_lines) if habit_lines else "  (ninguno)"}

FOCO ESTA SEMANA: {focus_minutes} minutos en {len(focus_this_week)} sesiones

QUESTS ACTIVAS ({len(active_quests)}):
{chr(10).join(quest_lines) if quest_lines else "  (ninguna)"}
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
        "Incluye: qué va bien, qué está en riesgo, y una misión específica para esta semana. "
        "Sé concreto y usa los datos reales."
    )

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"{context}\n\n{prompt}"}],
    )
    return message.content[0].text
