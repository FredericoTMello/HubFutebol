"""constrain player position values"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0002_player_position_check"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE players SET position = UPPER(position) WHERE position IS NOT NULL")
    op.execute("UPDATE players SET position = NULL WHERE position IS NOT NULL AND position NOT IN ('DEF', 'MID', 'FWD', 'GK')")
    with op.batch_alter_table("players") as batch_op:
        batch_op.create_check_constraint(
            "ck_players_position_enum",
            "position IS NULL OR position IN ('DEF', 'MID', 'FWD', 'GK')",
        )


def downgrade() -> None:
    with op.batch_alter_table("players") as batch_op:
        batch_op.drop_constraint("ck_players_position_enum", type_="check")
