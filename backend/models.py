from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Date, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from backend.database import Base


class StatType(str, enum.Enum):
    VIT = "VIT"
    FOC = "FOC"
    SAB = "SAB"
    DIS = "DIS"
    CRE = "CRE"
    VOL = "VOL"


class HabitFrequency(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"


class CharacterClass(str, enum.Enum):
    ARCHITECT = "Architect"   # FOC + SAB
    WARRIOR = "Warrior"       # VIT + DIS
    SCHOLAR = "Scholar"       # CRE + SAB
    MONK = "Monk"             # VOL + FOC
    EXPLORER = "Explorer"     # VIT + CRE
    GUARDIAN = "Guardian"     # DIS + VOL
    NOVICE = "Novice"         # Sin clase aún


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    username: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(200), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    habits: Mapped[list["Habit"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    focus_sessions: Mapped[list["FocusSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    character: Mapped[Optional["Character"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    stat_snapshots: Mapped[list["StatSnapshot"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    level: Mapped[int] = mapped_column(Integer, default=1)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    character_class: Mapped[str] = mapped_column(String(50), default=CharacterClass.NOVICE)

    # Los 6 stats (0-100)
    vit: Mapped[float] = mapped_column(Float, default=0.0)
    foc: Mapped[float] = mapped_column(Float, default=0.0)
    sab: Mapped[float] = mapped_column(Float, default=0.0)
    dis: Mapped[float] = mapped_column(Float, default=0.0)
    cre: Mapped[float] = mapped_column(Float, default=0.0)
    vol: Mapped[float] = mapped_column(Float, default=0.0)

    # Gamificación de retención
    streak_shields: Mapped[int] = mapped_column(Integer, default=1)
    last_shield_grant: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    login_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_login_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    class_locked: Mapped[bool] = mapped_column(Boolean, default=False)

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="character")


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stat_target: Mapped[str] = mapped_column(String(10))  # StatType
    frequency: Mapped[str] = mapped_column(String(20), default=HabitFrequency.DAILY)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="habits")
    logs: Mapped[list["HabitLog"]] = relationship(back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    habit_id: Mapped[int] = mapped_column(ForeignKey("habits.id"))
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    log_date: Mapped[date] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    energy_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5

    habit: Mapped["Habit"] = relationship(back_populates="logs")


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(200))
    started_at: Mapped[datetime] = mapped_column(DateTime)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    quality: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    goal_id: Mapped[Optional[int]] = mapped_column(ForeignKey("goals.id"), nullable=True)

    user: Mapped["User"] = relationship(back_populates="focus_sessions")
    goal: Mapped[Optional["Goal"]] = relationship()


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("goals.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    level: Mapped[int] = mapped_column(Integer, default=0)  # 0=life, 1=quarterly, 2=weekly, 3=daily
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="goals")
    children: Mapped[list["Goal"]] = relationship(back_populates="parent")
    parent: Mapped[Optional["Goal"]] = relationship(back_populates="children", remote_side="Goal.id")


class QuestType(str, enum.Enum):
    MAIN = "main"
    WEEKLY = "weekly"
    DAILY = "daily"


class Quest(Base):
    __tablename__ = "quests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quest_type: Mapped[str] = mapped_column(String(20), default=QuestType.DAILY)
    xp_reward: Mapped[int] = mapped_column(Integer, default=30)
    related_goal_id: Mapped[Optional[int]] = mapped_column(ForeignKey("goals.id"), nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship()
    related_goal: Mapped[Optional["Goal"]] = relationship()


class UserAchievement(Base):
    """Achievements desbloqueados por el usuario."""
    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    achievement_key: Mapped[str] = mapped_column(String(100))
    unlocked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship()


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    token: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship()


class StatSnapshot(Base):
    """Snapshot diario de los stats para historial y gráficas."""
    __tablename__ = "stat_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    snapshot_date: Mapped[date] = mapped_column(Date)
    vit: Mapped[float] = mapped_column(Float, default=0.0)
    foc: Mapped[float] = mapped_column(Float, default=0.0)
    sab: Mapped[float] = mapped_column(Float, default=0.0)
    dis: Mapped[float] = mapped_column(Float, default=0.0)
    cre: Mapped[float] = mapped_column(Float, default=0.0)
    vol: Mapped[float] = mapped_column(Float, default=0.0)
    level: Mapped[int] = mapped_column(Integer, default=1)

    user: Mapped["User"] = relationship(back_populates="stat_snapshots")
