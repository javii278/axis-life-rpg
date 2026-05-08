import secrets
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, PasswordResetToken
from backend.core.auth import hash_password, verify_password, create_access_token, get_current_user
from backend.core.email import send_reset_email, send_welcome_email
from backend.core.limiter import limiter

# XP por día del ciclo de 7 días (el 7º da escudo extra)
_LOGIN_BONUS = {1: 20, 2: 30, 3: 40, 4: 50, 5: 60, 6: 70, 7: 100}

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterPayload(BaseModel):
    username: str
    password: str
    display_name: str = ""
    email: str = ""


class LoginPayload(BaseModel):
    username: str
    password: str


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    display_name: str


@router.post("/register", response_model=AuthOut)
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterPayload, db: Session = Depends(get_db)):
    username = payload.username.strip().lower()
    if not username or len(payload.password) < 4:
        raise HTTPException(status_code=400, detail="Usuario y contraseña requeridos (mín. 4 caracteres)")

    email = payload.email.strip().lower() or None

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
        if email:
            unclaimed.email = email
        db.commit()
        return AuthOut(
            access_token=create_access_token(unclaimed.id),
            user_id=unclaimed.id,
            display_name=unclaimed.name,
        )

    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=409, detail="Nombre de usuario ya en uso")
    if email and db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email ya registrado")

    display = payload.display_name.strip() or username
    user = User(name=display, username=username, password_hash=hash_password(payload.password), email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    if email:
        send_welcome_email(to_email=email, username=display)
    return AuthOut(access_token=create_access_token(user.id), user_id=user.id, display_name=user.name)


@router.post("/login", response_model=AuthOut)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginPayload, db: Session = Depends(get_db)):
    username = payload.username.strip().lower()
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    return AuthOut(access_token=create_access_token(user.id), user_id=user.id, display_name=user.name)


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.id,
        "display_name": current_user.name,
        "username": current_user.username,
        "email": current_user.email,
    }


class UpdateProfilePayload(BaseModel):
    display_name: str = ""
    email: str = ""


class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str


@router.patch("/profile", response_model=AuthOut)
def update_profile(payload: UpdateProfilePayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    display = payload.display_name.strip()
    if not display:
        raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
    current_user.name = display
    if payload.email.strip():
        email = payload.email.strip().lower()
        conflict = db.query(User).filter(User.email == email, User.id != current_user.id).first()
        if conflict:
            raise HTTPException(status_code=409, detail="Email ya registrado")
        current_user.email = email
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


class ForgotPasswordPayload(BaseModel):
    email: str


class ResetPasswordPayload(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordPayload, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    # Siempre devuelve 200 para no revelar si el email existe
    if user:
        # Invalidar tokens anteriores
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,
        ).update({"used": True})

        token = secrets.token_urlsafe(32)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1),
        )
        db.add(reset_token)
        db.commit()

        send_reset_email(to_email=email, token=token, username=user.username or user.name)

    return {"ok": True, "message": "Si ese email está registrado, recibirás un enlace en breve."}


@router.post("/daily-checkin")
def daily_checkin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Reclama el bonus de login diario. Idempotente: solo da XP una vez por día."""
    from backend.models import Character
    from backend.core.stats_engine import recalculate_character

    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    today = date.today()

    if character.last_login_date == today:
        day_in_cycle = ((character.login_streak - 1) % 7) + 1
        return {
            "already_claimed": True,
            "login_streak": character.login_streak,
            "day_in_cycle": day_in_cycle,
            "xp_gained": 0,
            "shields_remaining": character.streak_shields,
        }

    # Racha rota si el último login fue hace más de 1 día
    yesterday = today - timedelta(days=1)
    if character.last_login_date and character.last_login_date < yesterday:
        character.login_streak = 1
    else:
        character.login_streak = (character.login_streak or 0) + 1

    character.last_login_date = today

    day_in_cycle = ((character.login_streak - 1) % 7) + 1
    xp = _LOGIN_BONUS.get(day_in_cycle, 20)
    character.total_xp += xp

    # Día 7 del ciclo: bonus de escudo extra (máx 3)
    if day_in_cycle == 7:
        character.streak_shields = min((character.streak_shields or 0) + 1, 3)

    # Conceder escudo semanal si es una semana nueva
    current_iso_week = today.isocalendar()[:2]
    last_grant_week = character.last_shield_grant.isocalendar()[:2] if character.last_shield_grant else None
    if last_grant_week != current_iso_week:
        character.streak_shields = min((character.streak_shields or 0) + 1, 3)
        character.last_shield_grant = today

    db.commit()
    recalculate_character(current_user.id, db)

    return {
        "already_claimed": False,
        "login_streak": character.login_streak,
        "day_in_cycle": day_in_cycle,
        "xp_gained": xp,
        "shields_remaining": character.streak_shields,
        "shield_granted": day_in_cycle == 7,
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordPayload, db: Session = Depends(get_db)):
    if len(payload.new_password) < 4:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 4 caracteres")

    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == payload.token,
        PasswordResetToken.used == False,
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Enlace inválido o ya utilizado")
    if reset_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="El enlace ha expirado. Solicita uno nuevo.")

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.password_hash = hash_password(payload.new_password)
    reset_token.used = True
    db.commit()

    return {"ok": True}
