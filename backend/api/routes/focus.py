from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import FocusSession, Character, User
from backend.core.stats_engine import recalculate_character
from backend.core.auth import get_current_user
from backend.core.limiter import limiter

router = APIRouter(prefix="/focus", tags=["focus"])


class FocusSessionCreate(BaseModel):
    title: str
    goal_id: Optional[int] = None


class FocusSessionEnd(BaseModel):
    quality: int  # 1-5
    notes: Optional[str] = None


class FocusSessionOut(BaseModel):
    id: int
    title: str
    started_at: datetime
    ended_at: Optional[datetime]
    duration_minutes: Optional[int]
    quality: Optional[int]
    notes: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


@router.post("/start", response_model=FocusSessionOut, status_code=201)
def start_session(payload: FocusSessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    active = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == current_user.id, FocusSession.ended_at.is_(None))
        .first()
    )
    if active:
        raise HTTPException(status_code=409, detail="There is already an active focus session")

    session = FocusSession(
        user_id=current_user.id,
        title=payload.title,
        goal_id=payload.goal_id,
        started_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _to_out(session)


@router.post("/{session_id}/end")
@limiter.limit("20/hour")
def end_session(request: Request, session_id: int, payload: FocusSessionEnd, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not 1 <= payload.quality <= 5:
        raise HTTPException(status_code=422, detail="Quality must be between 1 and 5")

    session = (
        db.query(FocusSession)
        .filter(FocusSession.id == session_id, FocusSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.ended_at:
        raise HTTPException(status_code=409, detail="Session already ended")

    session.ended_at = datetime.utcnow()
    duration = int((session.ended_at - session.started_at).total_seconds() / 60)
    session.duration_minutes = duration
    session.quality = payload.quality
    session.notes = payload.notes

    xp_gained = int((duration / 25) * 10 * payload.quality)
    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    if character:
        character.total_xp += xp_gained

    db.commit()
    recalculate_character(current_user.id, db)
    db.refresh(session)

    from backend.core.achievements_engine import check_achievements
    newly_unlocked = check_achievements(current_user.id, db)

    return {
        "message": "Session ended",
        "xp_gained": xp_gained,
        "duration_minutes": duration,
        "quality": payload.quality,
        "new_achievements": [
            {"key": a.key, "name": a.name, "icon": a.icon, "rarity": a.rarity}
            for a in newly_unlocked
        ],
    }


@router.get("/active", response_model=Optional[FocusSessionOut])
def get_active_session(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == current_user.id, FocusSession.ended_at.is_(None))
        .first()
    )
    return _to_out(session) if session else None


@router.get("/", response_model=list[FocusSessionOut])
def list_sessions(limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == current_user.id)
        .order_by(FocusSession.started_at.desc())
        .limit(limit)
        .all()
    )
    return [_to_out(s) for s in sessions]


def _to_out(session: FocusSession) -> FocusSessionOut:
    return FocusSessionOut(
        id=session.id,
        title=session.title,
        started_at=session.started_at,
        ended_at=session.ended_at,
        duration_minutes=session.duration_minutes,
        quality=session.quality,
        notes=session.notes,
        is_active=session.ended_at is None,
    )
