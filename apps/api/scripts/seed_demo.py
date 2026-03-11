import sys
from datetime import date
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.models import (
    Appearance,
    AppearanceStatus,
    Group,
    MatchDay,
    Membership,
    Player,
    RoleEnum,
    ScoringRule,
    Season,
    User,
)
from app.security import hash_password


def run() -> None:
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == "demo@hubfutebol.dev"))
        if not user:
            user = User(name="Demo Admin", email="demo@hubfutebol.dev", password_hash=hash_password("123456"))
            db.add(user)
            db.flush()

        group = db.scalar(select(Group).where(Group.name == "Pelada Demo"))
        if not group:
            group = Group(name="Pelada Demo", created_by_user_id=user.id, join_code="demo123")
            db.add(group)
            db.flush()
            db.add(Membership(user_id=user.id, group_id=group.id, role=RoleEnum.OWNER))

        players = db.scalars(select(Player).where(Player.group_id == group.id)).all()
        if not players:
            players = [
                Player(group_id=group.id, name="Joao", position="DEF", skill_rating=7),
                Player(group_id=group.id, name="Pedro", position="MID", skill_rating=8),
                Player(group_id=group.id, name="Lucas", position="FWD", skill_rating=6),
                Player(group_id=group.id, name="Rafa", position="DEF", skill_rating=5),
                Player(group_id=group.id, name="Tiago", position="MID", skill_rating=7),
                Player(group_id=group.id, name="Bruno", position="FWD", skill_rating=6),
            ]
            db.add_all(players)
            db.flush()

        season = db.scalar(select(Season).where(Season.group_id == group.id, Season.is_active.is_(True)))
        if not season:
            season = Season(group_id=group.id, name="Temporada Demo", is_active=True)
            db.add(season)
            db.flush()
            db.add(
                ScoringRule(
                    season_id=season.id,
                    win_points=3,
                    draw_points=1,
                    loss_points=0,
                    no_show_points=-1,
                )
            )

        matchday = db.scalar(select(MatchDay).where(MatchDay.season_id == season.id, MatchDay.title == "Rodada 1"))
        if not matchday:
            matchday = MatchDay(season_id=season.id, title="Rodada 1", scheduled_for=date.today())
            db.add(matchday)
            db.flush()
            for player in players:
                db.add(
                    Appearance(
                        matchday_id=matchday.id,
                        player_id=player.id,
                        status=AppearanceStatus.CONFIRMED,
                        created_by_user_id=user.id,
                    )
                )

        db.commit()
        print("Seed demo criada/atualizada.")
        print("Usuario: demo@hubfutebol.dev / senha: 123456")
        print(f"Join code: {group.join_code}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
