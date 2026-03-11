from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..models import (
    Appearance,
    AppearanceStatus,
    Match,
    MatchDay,
    MatchEvent,
    MatchEventType,
    Player,
    PlayerSeasonStats,
    ScoringRule,
    Season,
    SeasonStandings,
    Team,
    TeamPlayer,
)


def _default_scoring(rule: ScoringRule | None) -> dict[str, int]:
    return {
        "win": rule.win_points if rule else 3,
        "draw": rule.draw_points if rule else 1,
        "loss": rule.loss_points if rule else 0,
        "no_show": rule.no_show_points if rule else -1,
    }


RESULT_COUNTER_KEY = {
    "win": "wins",
    "draw": "draws",
    "loss": "losses",
}


def recompute_season_caches(db: Session, season_id: int) -> None:
    season = db.get(Season, season_id)
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")

    rule = db.scalar(select(ScoringRule).where(ScoringRule.season_id == season_id))
    scoring = _default_scoring(rule)

    players = db.scalars(select(Player).where(Player.group_id == season.group_id)).all()
    player_names = {player.id: (player.nickname or player.name) for player in players}

    standings = {
        player.id: {
            "player_id": player.id,
            "player_name": player_names[player.id],
            "points": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "no_shows": 0,
            "games_played": 0,
        }
        for player in players
    }
    stats = {
        player.id: {
            "player_id": player.id,
            "player_name": player_names[player.id],
            "appearances": 0,
            "goals": 0,
            "no_shows": 0,
        }
        for player in players
    }

    matchdays = db.scalars(select(MatchDay).where(MatchDay.season_id == season_id)).all()
    matchday_ids = [matchday.id for matchday in matchdays]

    appearances = (
        db.scalars(select(Appearance).where(Appearance.matchday_id.in_(matchday_ids))).all() if matchday_ids else []
    )

    counted_confirmed = set()
    for appearance in appearances:
        if appearance.player_id not in standings:
            continue
        if appearance.status == AppearanceStatus.NO_SHOW:
            standings[appearance.player_id]["points"] += scoring["no_show"]
            standings[appearance.player_id]["no_shows"] += 1
            stats[appearance.player_id]["no_shows"] += 1
        if appearance.status == AppearanceStatus.CONFIRMED:
            key = (appearance.matchday_id, appearance.player_id)
            if key not in counted_confirmed:
                stats[appearance.player_id]["appearances"] += 1
                counted_confirmed.add(key)

    teams = db.scalars(select(Team).where(Team.matchday_id.in_(matchday_ids))).all() if matchday_ids else []
    team_ids = [team.id for team in teams]
    team_rosters: dict[int, set[int]] = defaultdict(set)
    if team_ids:
        team_players = db.scalars(select(TeamPlayer).where(TeamPlayer.team_id.in_(team_ids))).all()
        for team_player in team_players:
            team_rosters[team_player.team_id].add(team_player.player_id)

    matches = db.scalars(select(Match).where(Match.matchday_id.in_(matchday_ids))).all() if matchday_ids else []
    for match in matches:
        if match.home_score is None or match.away_score is None:
            continue
        if match.home_score > match.away_score:
            home_result, away_result = "win", "loss"
        elif match.home_score < match.away_score:
            home_result, away_result = "loss", "win"
        else:
            home_result = away_result = "draw"

        for player_id in team_rosters.get(match.home_team_id, set()):
            if player_id not in standings:
                continue
            standings[player_id]["games_played"] += 1
            standings[player_id][RESULT_COUNTER_KEY[home_result]] += 1
            standings[player_id]["points"] += scoring[home_result]
        for player_id in team_rosters.get(match.away_team_id, set()):
            if player_id not in standings:
                continue
            standings[player_id]["games_played"] += 1
            standings[player_id][RESULT_COUNTER_KEY[away_result]] += 1
            standings[player_id]["points"] += scoring[away_result]

    goals = db.scalars(
        select(MatchEvent).where(
            MatchEvent.season_id == season_id,
            MatchEvent.type == MatchEventType.GOAL,
        )
    ).all()
    for event in goals:
        if event.player_id in stats:
            stats[event.player_id]["goals"] += event.quantity

    db.execute(delete(SeasonStandings).where(SeasonStandings.season_id == season_id))
    db.execute(delete(PlayerSeasonStats).where(PlayerSeasonStats.season_id == season_id))

    for item in standings.values():
        if item["games_played"] or item["no_shows"] or item["points"]:
            db.add(SeasonStandings(season_id=season_id, **item))
    for item in stats.values():
        if item["appearances"] or item["goals"] or item["no_shows"]:
            db.add(PlayerSeasonStats(season_id=season_id, **item))
    db.flush()
