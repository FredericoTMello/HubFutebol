from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..exceptions import DomainValidationError
from ..models import Appearance, AppearanceStatus, Match, MatchDay, Player, PlayerPosition, Team, TeamPlayer


@dataclass
class TeamDraftPlayer:
    id: int
    name: str
    position: PlayerPosition | None
    skill_rating: int


def generate_balanced_teams(db: Session, matchday: MatchDay) -> tuple[list[dict], Match | None]:
    if matchday.is_locked:
        raise DomainValidationError("MatchDay already locked")

    players = db.execute(
        select(Player, Appearance)
        .join(Appearance, Appearance.player_id == Player.id)
        .where(
            Appearance.matchday_id == matchday.id,
            Appearance.status == AppearanceStatus.CONFIRMED,
            Player.is_active.is_(True),
        )
        .order_by(Player.position, Player.skill_rating.desc(), Player.name)
    ).all()

    if len(players) < 2:
        raise DomainValidationError("Need at least 2 confirmed players")

    by_position: dict[str, list[TeamDraftPlayer]] = defaultdict(list)
    for player, _ in players:
        bucket = player.position.value if player.position else "ANY"
        by_position[bucket].append(
            TeamDraftPlayer(
                id=player.id,
                name=player.nickname or player.name,
                position=player.position,
                skill_rating=player.skill_rating,
            )
        )

    existing_teams = db.scalars(select(Team).where(Team.matchday_id == matchday.id)).all()
    if existing_teams:
        team_ids = [team.id for team in existing_teams]
        if team_ids:
            db.execute(delete(TeamPlayer).where(TeamPlayer.team_id.in_(team_ids)))
        for team in existing_teams:
            db.delete(team)
        db.flush()

    team_a = Team(matchday_id=matchday.id, name="Time A", total_rating=0)
    team_b = Team(matchday_id=matchday.id, name="Time B", total_rating=0)
    db.add_all([team_a, team_b])
    db.flush()

    totals = {team_a.id: 0, team_b.id: 0}
    rosters: dict[int, list[TeamDraftPlayer]] = {team_a.id: [], team_b.id: []}

    def assign(player: TeamDraftPlayer) -> int:
        if totals[team_a.id] < totals[team_b.id]:
            chosen = team_a.id
        elif totals[team_b.id] < totals[team_a.id]:
            chosen = team_b.id
        else:
            chosen = team_a.id if len(rosters[team_a.id]) <= len(rosters[team_b.id]) else team_b.id
        totals[chosen] += player.skill_rating
        rosters[chosen].append(player)
        return chosen

    for position in sorted(by_position):
        for player in sorted(by_position[position], key=lambda item: (-item.skill_rating, item.name)):
            assign(player)

    for team in (team_a, team_b):
        for player in rosters[team.id]:
            db.add(
                TeamPlayer(
                    team_id=team.id,
                    player_id=player.id,
                    position_slot=player.position.value if player.position else None,
                )
            )
        team.total_rating = totals[team.id]

    match = Match(matchday_id=matchday.id, home_team_id=team_a.id, away_team_id=team_b.id)
    db.add(match)
    matchday.is_locked = True
    matchday.locked_at = datetime.now(UTC)
    db.flush()

    teams_out = []
    for team in (team_a, team_b):
        teams_out.append(
            {
                "team_id": team.id,
                "name": team.name,
                "total_rating": team.total_rating,
                "players": [
                    {
                        "player_id": player.id,
                        "player_name": player.name,
                        "position": player.position,
                        "skill_rating": player.skill_rating,
                    }
                    for player in sorted(
                        rosters[team.id],
                        key=lambda item: (
                            item.position.value if item.position else "ZZZ",
                            -item.skill_rating,
                            item.name,
                        ),
                    )
                ],
            }
        )
    return teams_out, match
