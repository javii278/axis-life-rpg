from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.core.achievements_engine import check_achievements, get_all_with_status
from backend.core.auth import get_current_user

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("/")
def list_achievements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_all_with_status(current_user.id, db)


@router.post("/check")
def trigger_check(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    newly = check_achievements(current_user.id, db)
    return {
        "newly_unlocked": [
            {"key": a.key, "name": a.name, "icon": a.icon, "rarity": a.rarity}
            for a in newly
        ]
    }
