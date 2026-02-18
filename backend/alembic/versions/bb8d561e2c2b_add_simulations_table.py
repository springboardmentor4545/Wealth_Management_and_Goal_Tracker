"""add simulations table

Revision ID: bb8d561e2c2b
Revises: a0bf72799446
Create Date: 2026-02-09 10:20:37.162872

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bb8d561e2c2b'
down_revision: Union[str, Sequence[str], None] = 'a0bf72799446'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS simulations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users (id),
            assumptions JSON NOT NULL,
            results JSON NOT NULL,
            created_at TIMESTAMP
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_simulations_id ON simulations (id)"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS ix_simulations_id")
    op.execute("DROP TABLE IF EXISTS simulations")
