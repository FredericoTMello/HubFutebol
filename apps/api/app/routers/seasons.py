from datetime import date

from fastapi import APIRouter, HTTPException
from sqlalchemy import select, update

from ..deps import CurrentUser, DBSession, get_membership_or_404, require_role
from ..models import Group, MatchDay, PlayerSeasonStats, RoleEnum, ScoringRule, Season, SeasonStandings
from ..schemas import MatchDayListItem, PlayerStatsOut, SeasonCreate, SeasonOut, StandingsOut
from ..services import recompute_season_caches

router = APIRouter(tags=["seasons"])


def _season_group_or_404(db: DBSession, season_id: int) -> tuple[Season, int]:
    season = db.get(Season, season_id)
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    return season, season.group_id


@router.post("/groups/{group_id}/seasons", response_model=SeasonOut)
def create_season(group_id: int, payload: SeasonCreate, db: DBSession, current_user: CurrentUser) -> SeasonOut:
    require_role(db, group_id=group_id, user_id=current_user.id, minimum=RoleEnum.ADMIN)
    if not db.get(Group, group_id):
        raise HTTPException(status_code=404, detail="Group not found")

    db.execute(update(Season).where(Season.group_id == group_id, Season.is_active.is_(True)).values(is_active=False))
    season = Season(group_id=group_id, name=payload.name)
    db.add(season)
    db.flush()
    db.add(
        ScoringRule(
            season_id=season.id,
            win_points=payload.win_points,
            draw_points=payload.draw_points,
            loss_points=payload.loss_points,
            no_show_points=payload.no_show_points,
        )
    )
    db.commit()
    db.refresh(season)
    return season


@router.post("/seasons/{season_id}/close", response_model=SeasonOut)
def close_season(season_id: int, db: DBSession, current_user: CurrentUser) -> SeasonOut:
    season, group_id = _season_group_or_404(db, season_id)
    require_role(db, group_id=group_id, user_id=current_user.id, minimum=RoleEnum.ADMIN)
    season.is_active = False
    season.ended_at = date.today()
    db.commit()
    db.refresh(season)
    return season


@router.get("/seasons/{season_id}/standings", response_model=StandingsOut)
def season_standings(season_id: int, db: DBSession, current_user: CurrentUser) -> StandingsOut:
    season, group_id = _season_group_or_404(db, season_id)
    get_membership_or_404(db, group_id=group_id, user_id=current_user.id)

    items = db.scalars(
        select(SeasonStandings)
        .where(SeasonStandings.season_id == season.id)
        .order_by(SeasonStandings.points.desc(), SeasonStandings.wins.desc(), SeasonStandings.player_name)
    ).all()
    if not items and db.scalar(select(MatchDay).where(MatchDay.season_id == season.id)):
        recompute_season_caches(db, season.id)
        db.commit()
        items = db.scalars(
            select(SeasonStandings)
            .where(SeasonStandings.season_id == season.id)
            .order_by(SeasonStandings.points.desc(), SeasonStandings.wins.desc(), SeasonStandings.player_name)
        ).all()

    return StandingsOut(
        season_id=season.id,
        items=[
            {
                "player_id": i.player_id,
                "player_name": i.player_name,
                "points": i.points,
                "wins": i.wins,
                "draws": i.draws,
                "losses": i.losses,
                "no_shows": i.no_shows,
                "games_played": i.games_played,
            }
            for i in items
        ],
    )


@router.get("/seasons/{season_id}/player-stats", response_model=PlayerStatsOut)
def player_stats(season_id: int, db: DBSession, current_user: CurrentUser) -> PlayerStatsOut:
    season, group_id = _season_group_or_404(db, season_id)
    get_membership_or_404(db, group_id=group_id, user_id=current_user.id)

    items = db.scalars(
        select(PlayerSeasonStats)
        .where(PlayerSeasonStats.season_id == season.id)
        .order_by(PlayerSeasonStats.goals.desc(), PlayerSeasonStats.appearances.desc(), PlayerSeasonStats.player_name)
    ).all()
    if not items and db.scalar(select(MatchDay).where(MatchDay.season_id == season.id)):
        recompute_season_caches(db, season.id)
        db.commit()
        items = db.scalars(
            select(PlayerSeasonStats)
            .where(PlayerSeasonStats.season_id == season.id)
            .order_by(
                PlayerSeasonStats.goals.desc(),
                PlayerSeasonStats.appearances.desc(),
                PlayerSeasonStats.player_name,
            )
        ).all()

    return PlayerStatsOut(
        season_id=season.id,
        items=[
            {
                "player_id": i.player_id,
                "player_name": i.player_name,
                "appearances": i.appearances,
                "goals": i.goals,
                "no_shows": i.no_shows,
            }
            for i in items
        ],
    )


@router.get("/seasons/{season_id}/matchdays", response_model=list[MatchDayListItem])
def list_matchdays(season_id: int, db: DBSession, current_user: CurrentUser) -> list[MatchDayListItem]:
    season, group_id = _season_group_or_404(db, season_id)
    get_membership_or_404(db, group_id=group_id, user_id=current_user.id)
    matchdays = db.scalars(
        select(MatchDay).where(MatchDay.season_id == season.id).order_by(MatchDay.scheduled_for.desc(), MatchDay.id.desc())
    ).all()
    return [
        MatchDayListItem(
            id=m.id,
            season_id=m.season_id,
            title=m.title,
            scheduled_for=m.scheduled_for,
            is_locked=m.is_locked,
        )
        for m in matchdays
    ]
