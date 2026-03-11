from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select

from ..deps import CurrentUser, DBSession, require_role
from ..models import Match, MatchDay, MatchEvent, MatchEventType, RoleEnum, Season, Team
from ..schemas import MatchCreate, MatchOut, MatchResultIn
from ..services import recompute_season_caches

router = APIRouter(tags=["matches"])


def _match_context(db: DBSession, match_id: int) -> tuple[Match, MatchDay, Season]:
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    matchday = db.get(MatchDay, match.matchday_id)
    if not matchday:
        raise HTTPException(status_code=404, detail="MatchDay not found")
    season = db.get(Season, matchday.season_id)
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    return match, matchday, season


@router.post("/matchdays/{matchday_id}/matches", response_model=MatchOut, status_code=status.HTTP_201_CREATED)
def create_match(matchday_id: int, payload: MatchCreate, db: DBSession, current_user: CurrentUser) -> MatchOut:
    matchday = db.get(MatchDay, matchday_id)
    if not matchday:
        raise HTTPException(status_code=404, detail="MatchDay not found")
    season = db.get(Season, matchday.season_id)
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    require_role(db, group_id=season.group_id, user_id=current_user.id, minimum=RoleEnum.ADMIN)

    home = db.get(Team, payload.home_team_id)
    away = db.get(Team, payload.away_team_id)
    if not home or not away or home.matchday_id != matchday_id or away.matchday_id != matchday_id:
        raise HTTPException(status_code=400, detail="Teams must belong to matchday")
    match = Match(matchday_id=matchday_id, home_team_id=home.id, away_team_id=away.id)
    db.add(match)
    db.commit()
    db.refresh(match)
    return MatchOut(
        id=match.id,
        matchday_id=match.matchday_id,
        home_team_id=match.home_team_id,
        away_team_id=match.away_team_id,
        home_score=match.home_score,
        away_score=match.away_score,
    )


@router.post("/matches/{match_id}/result", response_model=MatchOut)
def submit_result(match_id: int, payload: MatchResultIn, db: DBSession, current_user: CurrentUser) -> MatchOut:
    match, _matchday, season = _match_context(db, match_id)
    require_role(db, group_id=season.group_id, user_id=current_user.id, minimum=RoleEnum.ADMIN)

    match.home_score = payload.home_score
    match.away_score = payload.away_score
    match.finished_at = datetime.now(UTC)

    db.execute(delete(MatchEvent).where(MatchEvent.match_id == match.id, MatchEvent.type == MatchEventType.GOAL))
    for goal in payload.goals:
        db.add(
            MatchEvent(
                match_id=match.id,
                season_id=season.id,
                player_id=goal.player_id,
                type=MatchEventType.GOAL,
                quantity=goal.quantity,
            )
        )

    db.flush()
    recompute_season_caches(db, season.id)
    db.commit()
    db.refresh(match)
    return MatchOut(
        id=match.id,
        matchday_id=match.matchday_id,
        home_team_id=match.home_team_id,
        away_team_id=match.away_team_id,
        home_score=match.home_score,
        away_score=match.away_score,
    )

