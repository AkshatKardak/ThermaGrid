"""add hierarchy level and parent_code to locations

Revision ID: e74a81b2c3d4
Revises: d634376abde2
Create Date: 2026-11-10 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e74a81b2c3d4"
down_revision: str | Sequence[str] | None = "d634376abde2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add additive columns level and parent_code
    with op.batch_alter_table("locations") as batch_op:
        batch_op.add_column(
            sa.Column("level", sa.String(length=20), server_default="ward", nullable=False)
        )
        batch_op.add_column(sa.Column("parent_code", sa.String(length=50), nullable=True))
        batch_op.create_index("ix_locations_level", ["level"])
        batch_op.create_index("ix_locations_parent_code", ["parent_code"])


def downgrade() -> None:
    with op.batch_alter_table("locations") as batch_op:
        batch_op.drop_index("ix_locations_parent_code")
        batch_op.drop_index("ix_locations_level")
        batch_op.drop_column("parent_code")
        batch_op.drop_column("level")
