from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Goal, User
from backend.core.auth import get_current_user

router = APIRouter(prefix="/goals", tags=["goals"])

LEVEL_LABELS = {0: "Vida", 1: "Trimestral", 2: "Semanal", 3: "Diaria"}


# ── Schemas ───────────────────────────────────────────────────────────────────

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    level: int = 0
    parent_id: Optional[int] = None
    due_date: Optional[date] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[date] = None


class GoalOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    level: int
    level_label: str
    parent_id: Optional[int]
    is_completed: bool
    due_date: Optional[date]
    children: list["GoalOut"] = []

    class Config:
        from_attributes = True


GoalOut.model_rebuild()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _to_out(goal: Goal, db: Session, depth: int = 0) -> GoalOut:
    children = []
    if depth < 4:
        children = [
            _to_out(c, db, depth + 1)
            for c in db.query(Goal)
            .filter(Goal.parent_id == goal.id)
            .order_by(Goal.is_completed, Goal.created_at)
            .all()
        ]
    return GoalOut(
        id=goal.id, title=goal.title, description=goal.description,
        level=goal.level, level_label=LEVEL_LABELS.get(goal.level, "Meta"),
        parent_id=goal.parent_id, is_completed=goal.is_completed,
        due_date=goal.due_date, children=children,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[GoalOut])
def list_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    roots = (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id, Goal.parent_id.is_(None))
        .order_by(Goal.is_completed, Goal.created_at)
        .all()
    )
    return [_to_out(g, db) for g in roots]


@router.get("/flat", response_model=list[GoalOut])
def list_goals_flat(level: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Goal).filter(Goal.user_id == current_user.id)
    if level is not None:
        q = q.filter(Goal.level == level)
    goals = q.order_by(Goal.level, Goal.is_completed, Goal.created_at).all()
    return [_to_out(g, db, depth=99) for g in goals]


@router.post("/", response_model=GoalOut, status_code=201)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.parent_id:
        parent = db.query(Goal).filter(Goal.id == payload.parent_id, Goal.user_id == current_user.id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent goal not found")

    goal = Goal(user_id=current_user.id, **payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _to_out(goal, db)


@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: int, payload: GoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return _to_out(goal, db)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
