from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .models import (
    Appearance,
    AppearanceStatus,
    Group,
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


@dataclass
class TeamDraftPlayer:
    id: int
    name: str
    position: str | None
    skill_rating: int


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


def generate_balanced_teams(db: Session, matchday: MatchDay) -> tuple[list[dict], Match | None]:
    if matchday.is_locked:
        raise HTTPException(status_code=400, detail="MatchDay already locked")

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
        raise HTTPException(status_code=400, detail="Need at least 2 confirmed players")

    by_position: dict[str, list[TeamDraftPlayer]] = defaultdict(list)
    for player, _ in players:
        bucket = (player.position or "ANY").upper()
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
        for player in sorted(by_position[position], key=lambda p: (-p.skill_rating, p.name)):
            assign(player)

    for team in (team_a, team_b):
        for p in rosters[team.id]:
            db.add(TeamPlayer(team_id=team.id, player_id=p.id, position_slot=p.position))
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
                        "player_id": p.id,
                        "player_name": p.name,
                        "position": p.position,
                        "skill_rating": p.skill_rating,
                    }
                    for p in sorted(rosters[team.id], key=lambda x: (x.position or "ZZZ", -x.skill_rating, x.name))
                ],
            }
        )
    return teams_out, match


def ensure_group_ledger(db: Session, group_id: int):
    from .models import Ledger

    ledger = db.scalar(select(Ledger).where(Ledger.group_id == group_id))
    if ledger:
        return ledger
    if not db.get(Group, group_id):
        raise HTTPException(status_code=404, detail="Group not found")
    ledger = Ledger(group_id=group_id)
    db.add(ledger)
    db.flush()
    return ledger


def recompute_season_caches(db: Session, season_id: int) -> None:
    season = db.get(Season, season_id)
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")

    rule = db.scalar(select(ScoringRule).where(ScoringRule.season_id == season_id))
    scoring = _default_scoring(rule)

    players = db.scalars(select(Player).where(Player.group_id == season.group_id)).all()
    player_names = {p.id: (p.nickname or p.name) for p in players}

    standings = {
        p.id: {
            "player_id": p.id,
            "player_name": player_names[p.id],
            "points": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "no_shows": 0,
            "games_played": 0,
        }
        for p in players
    }
    stats = {
        p.id: {
            "player_id": p.id,
            "player_name": player_names[p.id],
            "appearances": 0,
            "goals": 0,
            "no_shows": 0,
        }
        for p in players
    }

    matchdays = db.scalars(select(MatchDay).where(MatchDay.season_id == season_id)).all()
    matchday_ids = [m.id for m in matchdays]

    appearances = (
        db.scalars(select(Appearance).where(Appearance.matchday_id.in_(matchday_ids))).all()
        if matchday_ids
        else []
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
    team_ids = [t.id for t in teams]
    team_rosters: dict[int, set[int]] = defaultdict(set)
    if team_ids:
        team_players = db.scalars(select(TeamPlayer).where(TeamPlayer.team_id.in_(team_ids))).all()
        for tp in team_players:
            team_rosters[tp.team_id].add(tp.player_id)

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

        for pid in team_rosters.get(match.home_team_id, set()):
            if pid not in standings:
                continue
            standings[pid]["games_played"] += 1
            standings[pid][RESULT_COUNTER_KEY[home_result]] += 1
            standings[pid]["points"] += scoring[home_result]
        for pid in team_rosters.get(match.away_team_id, set()):
            if pid not in standings:
                continue
            standings[pid]["games_played"] += 1
            standings[pid][RESULT_COUNTER_KEY[away_result]] += 1
            standings[pid]["points"] += scoring[away_result]

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
