from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.ai.coach import get_coach_response, get_weekly_insight
from backend.core.auth import get_current_user

router = APIRouter(prefix="/coach", tags=["coach"])


class ChatMessage(BaseModel):
    message: str


@router.post("/chat")
def chat(payload: ChatMessage, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    response = get_coach_response(payload.message, current_user.id, db)
    return {"response": response}


@router.get("/weekly-insight")
def weekly_insight(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    insight = get_weekly_insight(current_user.id, db)
    return {"insight": insight}
