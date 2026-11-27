"""deactivate whatsapp subscriptions

Deactivates any existing WhatsApp subscriptions. The rows are kept for audit.

Revision ID: a1b2c3d4e5f6
Revises: f85b92c4d1a5
Create Date: 2026-11-28 01:50:00.000000

"""

from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "f85b92c4d1a5"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE subscriptions SET is_active = false WHERE channel = 'whatsapp';")


def downgrade():
    pass
