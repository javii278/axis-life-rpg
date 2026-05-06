from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Quest, Goal, Character, QuestType, User
from backend.core.stats_engine import recalculate_character
from backend.core.auth import get_current_user

router = APIRouter(prefix="/quests", tags=["quests"])

TYPE_XP = {QuestType.MAIN: 100, QuestType.WEEKLY: 50, QuestType.DAILY: 20}
GOAL_LEVEL_TO_TYPE = {0: QuestType.MAIN, 1: QuestType.MAIN, 2: QuestType.WEEKLY, 3: QuestType.DAILY}


# ── Schemas ───────────────────────────────────────────────────────────────────

class QuestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    quest_type: QuestType = QuestType.DAILY
    xp_reward: Optional[int] = None
    related_goal_id: Optional[int] = None
    due_date: Optional[date] = None


class QuestOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    quest_type: str
    xp_reward: int
    is_completed: bool
    due_date: Optional[date]
    related_goal_title: Optional[str] = None

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[QuestOut])
def list_quests(completed: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quests = (
        db.query(Quest)
        .filter(Quest.user_id == current_user.id, Quest.is_active == True, Quest.is_completed == completed)
        .order_by(Quest.quest_type, Quest.created_at)
        .all()
    )
    return [_to_out(q) for q in quests]


@router.post("/", response_model=QuestOut, status_code=201)
def create_quest(payload: QuestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    xp = payload.xp_reward or TYPE_XP.get(payload.quest_type, 20)
    data = {k: v for k, v in payload.model_dump().items() if k != "xp_reward"}
    quest = Quest(user_id=current_user.id, xp_reward=xp, **data)
    db.add(quest)
    db.commit()
    db.refresh(quest)
    return _to_out(quest)


@router.post("/generate-from-goals", status_code=200)
def generate_from_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id, Goal.is_completed == False).all()
    created = 0
    for goal in goals:
        existing = db.query(Quest).filter(Quest.related_goal_id == goal.id, Quest.is_active == True).first()
        if not existing:
            q_type = GOAL_LEVEL_TO_TYPE.get(goal.level, QuestType.DAILY)
            quest = Quest(
                user_id=current_user.id,
                title=goal.title,
                description=goal.description,
                quest_type=q_type,
                xp_reward=TYPE_XP[q_type],
                related_goal_id=goal.id,
                due_date=goal.due_date,
            )
            db.add(quest)
            created += 1
    db.commit()
    return {"created": created, "message": f"{created} quest(s) generadas"}


@router.post("/{quest_id}/complete")
def complete_quest(quest_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.is_completed:
        raise HTTPException(status_code=409, detail="Quest already completed")

    quest.is_completed = True

    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    if character:
        character.total_xp += quest.xp_reward

    if quest.related_goal_id:
        goal = db.query(Goal).filter(Goal.id == quest.related_goal_id).first()
        if goal:
            goal.is_completed = True

    db.commit()
    updated_char = recalculate_character(current_user.id, db)

    from backend.core.achievements_engine import check_achievements
    newly_unlocked = check_achievements(current_user.id, db)

    return {
        "message": "Quest completed!",
        "xp_gained": quest.xp_reward,
        "character_level": updated_char.level if updated_char else 1,
        "new_achievements": [
            {"key": a.key, "name": a.name, "icon": a.icon, "rarity": a.rarity}
            for a in newly_unlocked
        ],
    }


@router.delete("/{quest_id}", status_code=204)
def delete_quest(quest_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    quest.is_active = False
    db.commit()


def _to_out(quest: Quest) -> QuestOut:
    return QuestOut(
        id=quest.id, title=quest.title, description=quest.description,
        quest_type=quest.quest_type, xp_reward=quest.xp_reward,
        is_completed=quest.is_completed, due_date=quest.due_date,
        related_goal_title=quest.related_goal.title if quest.related_goal else None,
    )
