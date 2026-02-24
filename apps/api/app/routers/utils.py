from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Appearance, Match, MatchDay, Player, Team, TeamPlayer


def get_matchday_or_404(db: Session, matchday_id: int) -> MatchDay:
    matchday = db.get(MatchDay, matchday_id)
    if not matchday:
        raise HTTPException(status_code=404, detail="MatchDay not found")
    return matchday


def serialize_matchday(db: Session, matchday: MatchDay) -> dict:
    attendance = db.scalars(select(Appearance).where(Appearance.matchday_id == matchday.id)).all()
    teams = db.scalars(select(Team).where(Team.matchday_id == matchday.id).order_by(Team.id)).all()
    team_ids = [team.id for team in teams]
    team_players = (
        db.execute(
            select(TeamPlayer, Player)
            .join(Player, Player.id == TeamPlayer.player_id)
            .where(TeamPlayer.team_id.in_(team_ids))
        ).all()
        if team_ids
        else []
    )
    roster_map: dict[int, list[dict]] = defaultdict(list)
    for tp, player in team_players:
        roster_map[tp.team_id].append(
            {
                "player_id": player.id,
                "player_name": player.nickname or player.name,
                "position": player.position,
                "skill_rating": player.skill_rating,
            }
        )
    teams_out = [
        {
            "team_id": team.id,
            "name": team.name,
            "total_rating": team.total_rating,
            "players": sorted(
                roster_map.get(team.id, []),
                key=lambda p: (p["position"] or "ZZZ", -p["skill_rating"], p["player_name"]),
            ),
        }
        for team in teams
    ]
    matches = db.scalars(select(Match).where(Match.matchday_id == matchday.id).order_by(Match.id)).all()
    matches_out = [
        {
            "id": m.id,
            "home_team_id": m.home_team_id,
            "away_team_id": m.away_team_id,
            "home_score": m.home_score,
            "away_score": m.away_score,
            "finished_at": m.finished_at,
        }
        for m in matches
    ]
    return {
        "id": matchday.id,
        "season_id": matchday.season_id,
        "title": matchday.title,
        "scheduled_for": matchday.scheduled_for,
        "notes": matchday.notes,
        "is_locked": matchday.is_locked,
        "locked_at": matchday.locked_at,
        "attendance": [
            {"matchday_id": a.matchday_id, "player_id": a.player_id, "status": a.status} for a in attendance
        ],
        "teams": teams_out,
        "matches": matches_out,
    }

