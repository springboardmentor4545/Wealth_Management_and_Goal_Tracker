"""add investment market data fields

Revision ID: a0bf72799446
Revises: 
Create Date: 2026-02-09 10:02:09.464765

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a0bf72799446'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
"""noop revision (replaces bad autogenerate)

Revision ID: a0bf72799446
Revises: f45171b75fe3
Create Date: 2026-02-09 10:02:09.464765

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "a0bf72799446"
down_revision: Union[str, Sequence[str], None] = "f45171b75fe3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    return None


def downgrade() -> None:
    """Downgrade schema."""
    return None
    sa.Column('investment_id', sa.INTEGER(), autoincrement=False, nullable=False),
