"""add streak_shields, last_shield_grant, login_streak, last_login_date to characters

Revision ID: 20250508_0002
Revises: 20250101_0001
Create Date: 2025-05-08
"""
from alembic import op
import sqlalchemy as sa

revision = "20250508_0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("characters") as batch_op:
        batch_op.add_column(sa.Column("streak_shields", sa.Integer(), nullable=False, server_default="1"))
        batch_op.add_column(sa.Column("last_shield_grant", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("login_streak", sa.Integer(), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("last_login_date", sa.Date(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("characters") as batch_op:
        batch_op.drop_column("last_login_date")
        batch_op.drop_column("login_streak")
        batch_op.drop_column("last_shield_grant")
        batch_op.drop_column("streak_shields")
