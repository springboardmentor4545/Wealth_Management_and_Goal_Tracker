"""add investment market data fields

Revision ID: f45171b75fe3
Revises: 
Create Date: 2026-02-09 10:04:24.519149

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f45171b75fe3"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        "ALTER TABLE investments ADD COLUMN IF NOT EXISTS last_price NUMERIC(14, 2)"
    )
    op.execute(
        "ALTER TABLE investments ADD COLUMN IF NOT EXISTS last_price_updated_at TIMESTAMP"
    )
    op.execute(
        "ALTER TABLE investments ADD COLUMN IF NOT EXISTS current_value NUMERIC(16, 2)"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE investments DROP COLUMN IF EXISTS current_value")
    op.execute("ALTER TABLE investments DROP COLUMN IF EXISTS last_price_updated_at")
    op.execute("ALTER TABLE investments DROP COLUMN IF EXISTS last_price")
