from datetime import date, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Habit, HabitLog, FocusSession, Quest, Character
from backend.core.stats_engine import calculate_streak
from backend.core.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

WEEKDAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    habits = db.query(Habit).filter(Habit.user_id == current_user.id, Habit.is_active == True).all()
    all_logs = db.query(HabitLog).join(Habit).filter(Habit.user_id == current_user.id).all()
    focus_sessions = db.query(FocusSession).filter(
        FocusSession.user_id == current_user.id,
        FocusSession.duration_minutes != None,
    ).all()
    quests_done = db.query(Quest).filter(
        Quest.user_id == current_user.id,
        Quest.is_completed == True,
    ).count()

    # Totales
    total_habits_completed = len(all_logs)
    total_focus_minutes = sum(s.duration_minutes or 0 for s in focus_sessions)

    # Esta semana
    week_logs = [l for l in all_logs if l.log_date >= week_ago]
    week_focus = sum(s.duration_minutes or 0 for s in focus_sessions if s.started_at.date() >= week_ago)

    # Racha máxima global
    best_streak = 0
    current_streaks = []
    for habit in habits:
        s = calculate_streak(habit, db)
        current_streaks.append({"habit": habit.name, "streak": s, "stat": habit.stat_target})
        if s > best_streak:
            best_streak = s

    # Completion por día de semana (últimos 30 días)
    weekday_logs: dict[int, int] = defaultdict(int)
    weekday_possible: dict[int, int] = defaultdict(int)

    for d_offset in range(30):
        d = today - timedelta(days=d_offset)
        wd = d.weekday()
        weekday_possible[wd] += len(habits)
        logs_that_day = sum(1 for l in all_logs if l.log_date == d)
        weekday_logs[wd] += logs_that_day

    completion_by_weekday = []
    for wd in range(7):
        possible = weekday_possible[wd]
        done = weekday_logs[wd]
        rate = round((done / possible * 100) if possible > 0 else 0)
        completion_by_weekday.append({
            "day": WEEKDAYS_ES[wd],
            "rate": rate,
            "done": done,
            "possible": possible,
        })

    # Hábito más consistente
    habit_consistency = []
    for habit in habits:
        month_logs = [l for l in all_logs if l.habit_id == habit.id and l.log_date >= month_ago]
        streak = calculate_streak(habit, db)
        habit_consistency.append({
            "id": habit.id,
            "name": habit.name,
            "stat": habit.stat_target,
            "streak": streak,
            "completions_30d": len(month_logs),
            "rate_30d": round(len(month_logs) / 30 * 100),
        })
    habit_consistency.sort(key=lambda x: x["rate_30d"], reverse=True)

    # Calidad media de sesiones de foco
    sessions_with_quality = [s for s in focus_sessions if s.quality]
    avg_focus_quality = round(sum(s.quality for s in sessions_with_quality) / len(sessions_with_quality), 1) if sessions_with_quality else 0

    return {
        "totals": {
            "habits_completed": total_habits_completed,
            "focus_hours": round(total_focus_minutes / 60, 1),
            "quests_done": quests_done,
            "level": character.level if character else 1,
            "total_xp": character.total_xp if character else 0,
        },
        "this_week": {
            "habits_completed": len(week_logs),
            "focus_minutes": week_focus,
        },
        "best_streak": best_streak,
        "current_streaks": sorted(current_streaks, key=lambda x: x["streak"], reverse=True)[:5],
        "completion_by_weekday": completion_by_weekday,
        "habit_consistency": habit_consistency[:8],
        "focus_sessions_count": len(focus_sessions),
        "avg_focus_quality": avg_focus_quality,
    }
