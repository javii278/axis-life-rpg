from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Character, User, StatSnapshot
from backend.core.stats_engine import recalculate_character, xp_for_level
from backend.core.auth import get_current_user

router = APIRouter(prefix="/character", tags=["character"])


class CharacterOut(BaseModel):
    id: int
    name: str
    level: int
    total_xp: int
    xp_to_next_level: int
    character_class: str
    vit: float
    foc: float
    sab: float
    dis: float
    cre: float
    vol: float
    streak_shields: int = 1
    login_streak: int = 0

    class Config:
        from_attributes = True


class CharacterCreate(BaseModel):
    name: str


@router.post("/", response_model=CharacterOut, status_code=201)
def create_character(payload: CharacterCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Character).filter(Character.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Character already exists")

    character = Character(user_id=current_user.id, name=payload.name)
    db.add(character)
    db.commit()
    db.refresh(character)
    return _to_out(character)


@router.get("/", response_model=CharacterOut)
def get_character(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found. Create one first.")
    return _to_out(character)


@router.post("/recalculate", response_model=CharacterOut)
def force_recalculate(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    character = recalculate_character(current_user.id, db)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return _to_out(character)


@router.get("/history")
def get_stat_history(days: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    snapshots = (
        db.query(StatSnapshot)
        .filter(StatSnapshot.user_id == current_user.id)
        .order_by(StatSnapshot.snapshot_date.desc())
        .limit(days)
        .all()
    )
    return [
        {
            "date": s.snapshot_date,
            "level": s.level,
            "vit": s.vit, "foc": s.foc, "sab": s.sab,
            "dis": s.dis, "cre": s.cre, "vol": s.vol,
        }
        for s in reversed(snapshots)
    ]


def _to_out(character: Character) -> CharacterOut:
    xp_next = xp_for_level(character.level + 1)
    return CharacterOut(
        id=character.id,
        name=character.name,
        level=character.level,
        total_xp=character.total_xp,
        xp_to_next_level=xp_next,
        character_class=character.character_class,
        vit=character.vit,
        foc=character.foc,
        sab=character.sab,
        dis=character.dis,
        cre=character.cre,
        vol=character.vol,
        streak_shields=character.streak_shields,
        login_streak=character.login_streak,
    )
