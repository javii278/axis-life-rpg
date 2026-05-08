"""initial schema

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("username", sa.String(100), nullable=True, unique=True),
        sa.Column("password_hash", sa.String(200), nullable=True),
        sa.Column("email", sa.String(200), nullable=True, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "characters",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("total_xp", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("character_class", sa.String(50), nullable=False, server_default="Novice"),
        sa.Column("vit", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("foc", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("sab", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("dis", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("cre", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("vol", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "habits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("stat_target", sa.String(10), nullable=False),
        sa.Column("frequency", sa.String(20), nullable=False, server_default="daily"),
        sa.Column("xp_reward", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "habit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("habit_id", sa.Integer(), sa.ForeignKey("habits.id"), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=False),
        sa.Column("log_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("energy_level", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "goals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("parent_id", sa.Integer(), sa.ForeignKey("goals.id"), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("level", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "focus_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("quality", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("goal_id", sa.Integer(), sa.ForeignKey("goals.id"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "quests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("quest_type", sa.String(20), nullable=False, server_default="daily"),
        sa.Column("xp_reward", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("related_goal_id", sa.Integer(), sa.ForeignKey("goals.id"), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "user_achievements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("achievement_key", sa.String(100), nullable=False),
        sa.Column("unlocked_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token", sa.String(100), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_password_reset_tokens_token", "password_reset_tokens", ["token"], unique=True)
    op.create_table(
        "stat_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("snapshot_date", sa.Date(), nullable=False),
        sa.Column("vit", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("foc", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("sab", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("dis", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("cre", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("vol", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("stat_snapshots")
    op.drop_index("ix_password_reset_tokens_token", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")
    op.drop_table("user_achievements")
    op.drop_table("quests")
    op.drop_table("focus_sessions")
    op.drop_table("goals")
    op.drop_table("habit_logs")
    op.drop_table("habits")
    op.drop_table("characters")
    op.drop_table("users")
