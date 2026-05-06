from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.core.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterPayload(BaseModel):
    username: str
    password: str
    display_name: str = ""  # nombre del jugador, opcional


class LoginPayload(BaseModel):
    username: str
    password: str


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    display_name: str


@router.post("/register", response_model=AuthOut)
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    username = payload.username.strip().lower()
    if not username or len(payload.password) < 4:
        raise HTTPException(status_code=400, detail="Usuario y contraseña requeridos (mín. 4 caracteres)")

    # Si hay un usuario sin cuenta (datos legacy de antes del auth), lo reclamamos
    unclaimed = db.query(User).filter(User.password_hash == None).first()
    if unclaimed:
        already_taken = db.query(User).filter(User.username == username, User.id != unclaimed.id).first()
        if already_taken:
            raise HTTPException(status_code=409, detail="Nombre de usuario ya en uso")
        unclaimed.username = username
        unclaimed.password_hash = hash_password(payload.password)
        if payload.display_name:
            unclaimed.name = payload.display_name
        db.commit()
        return AuthOut(
            access_token=create_access_token(unclaimed.id),
            user_id=unclaimed.id,
            display_name=unclaimed.name,
        )

    # Usuario completamente nuevo
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=409, detail="Nombre de usuario ya en uso")

    display = payload.display_name.strip() or username
    user = User(name=display, username=username, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthOut(access_token=create_access_token(user.id), user_id=user.id, display_name=user.name)


@router.post("/login", response_model=AuthOut)
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    username = payload.username.strip().lower()
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    return AuthOut(access_token=create_access_token(user.id), user_id=user.id, display_name=user.name)


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"user_id": current_user.id, "display_name": current_user.name, "username": current_user.username}


class UpdateProfilePayload(BaseModel):
    display_name: str = ""


class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str


@router.patch("/profile", response_model=AuthOut)
def update_profile(payload: UpdateProfilePayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    display = payload.display_name.strip()
    if not display:
        raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
    current_user.name = display
    db.commit()
    db.refresh(current_user)
    return AuthOut(
        access_token=create_access_token(current_user.id),
        user_id=current_user.id,
        display_name=current_user.name,
    )


@router.post("/change-password")
def change_password(payload: ChangePasswordPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.password_hash or not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
    if len(payload.new_password) < 4:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 4 caracteres")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}
