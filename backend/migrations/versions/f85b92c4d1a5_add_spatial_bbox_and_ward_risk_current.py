"""add spatial bbox and ward_risk_current

Revision ID: f85b92c4d1a5
Revises: e74a81b2c3d4
Create Date: 2026-11-10 10:28:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'f85b92c4d1a5'
down_revision = 'e74a81b2c3d4'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add spatial bounding box columns to locations
    op.add_column('locations', sa.Column('min_lat', sa.Float(), nullable=True))
    op.add_column('locations', sa.Column('max_lat', sa.Float(), nullable=True))
    op.add_column('locations', sa.Column('min_lng', sa.Float(), nullable=True))
    op.add_column('locations', sa.Column('max_lng', sa.Float(), nullable=True))

    op.create_index('idx_locations_spatial_bbox', 'locations', ['min_lat', 'max_lat', 'min_lng', 'max_lng'])

    # 2. Create ward_risk_current precomputed aggregate table
    op.create_table(
        'ward_risk_current',
        sa.Column('location_id', sa.Integer(), sa.ForeignKey('locations.id'), primary_key=True, index=True),
        sa.Column('city', sa.String(length=100), index=True, nullable=False),
        sa.Column('ward_code', sa.String(length=50), index=True, nullable=False),
        sa.Column('ward_name', sa.String(length=255), nullable=False),
        sa.Column('level', sa.String(length=20), index=True, nullable=False, default='ward'),
        sa.Column('parent_code', sa.String(length=50), index=True, nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('population', sa.Integer(), nullable=True),
        sa.Column('risk_score', sa.Float(), index=True, nullable=False),
        sa.Column('band', sa.String(length=50), nullable=False),
        sa.Column('band_label', sa.String(length=100), nullable=False),
        sa.Column('alert_color', sa.String(length=20), nullable=False),
        sa.Column('hazard_score', sa.Float(), nullable=False),
        sa.Column('exposure_index', sa.Float(), nullable=False),
        sa.Column('vulnerability_index', sa.Float(), nullable=False),
        sa.Column('temperature_c', sa.Float(), nullable=False),
        sa.Column('wbgt_c', sa.Float(), nullable=False),
        sa.Column('utci_c', sa.Float(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('factor_breakdown_json', sa.JSON(), nullable=False),
        sa.Column('sub_scores_json', sa.JSON(), nullable=True),
        sa.Column('diagnostics_json', sa.JSON(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('is_demo', sa.Boolean(), nullable=True, default=False),
        sa.Column('demo_label', sa.String(length=255), nullable=True),
        sa.Column('calculated_for', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('ward_risk_current')
    op.drop_index('idx_locations_spatial_bbox', table_name='locations')
    op.drop_column('locations', 'max_lng')
    op.drop_column('locations', 'min_lng')
    op.drop_column('locations', 'max_lat')
    op.drop_column('locations', 'min_lat')
