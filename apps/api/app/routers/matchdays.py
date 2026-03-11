from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from ..deps import CurrentUser, DBSession, get_membership_or_404, require_role
from ..models import Appearance, MatchDay, Player, RoleEnum, Season
from ..schemas import AppearanceIn, AppearanceOut, LockMatchDayOut, MatchDayCreate, MatchDayOut
from ..services import generate_balanced_teams, recompute_season_caches
from .utils import get_matchday_or_404, serialize_matchday

router = APIRouter(tags=["matchdays"])


def _season_or_404(db: DBSession, season_id: int) -> Season:
    season = db.get(Season, season_id)
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    return season


@router.post("/seasons/{season_id}/matchdays", response_model=MatchDayOut, status_code=status.HTTP_201_CREATED)
def create_matchday(
    season_id: int,
    payload: MatchDayCreate,
    db: DBSession,
    current_user: CurrentUser,
) -> MatchDayOut:
    season = _season_or_404(db, season_id)
    require_role(db, group_id=season.group_id, user_id=current_user.id, minimum=RoleEnum.ADMIN)
    matchday = MatchDay(
        season_id=season_id,
        title=payload.title,
        scheduled_for=payload.scheduled_for,
        notes=payload.notes,
    )
    db.add(matchday)
    db.commit()
    db.refresh(matchday)
    return serialize_matchday(db, matchday)


@router.get("/matchdays/{matchday_id}", response_model=MatchDayOut)
def get_matchday(matchday_id: int, db: DBSession, current_user: CurrentUser) -> MatchDayOut:
    matchday = get_matchday_or_404(db, matchday_id)
    season = db.get(Season, matchday.season_id)
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    get_membership_or_404(db, group_id=season.group_id, user_id=current_user.id)
    return serialize_matchday(db, matchday)


@router.post("/matchdays/{matchday_id}/attendance", response_model=AppearanceOut)
def set_attendance(
    matchday_id: int,
    payload: AppearanceIn,
    db: DBSession,
    current_user: CurrentUser,
) -> AppearanceOut:
    matchday = get_matchday_or_404(db, matchday_id)
    season = db.get(Season, matchday.season_id)
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    membership = get_membership_or_404(db, group_id=season.group_id, user_id=current_user.id)

    player = db.get(Player, payload.player_id)
    if not player or player.group_id != season.group_id:
        raise HTTPException(status_code=404, detail="Player not found in group")
    if membership.role == RoleEnum.MEMBER and player.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Member can only update own linked player")

    appearance = db.scalar(
        select(Appearance).where(Appearance.matchday_id == matchday_id, Appearance.player_id == payload.player_id)
    )
    if appearance:
        appearance.status = payload.status
        appearance.created_by_user_id = current_user.id
    else:
        appearance = Appearance(
            matchday_id=matchday_id,
            player_id=payload.player_id,
            status=payload.status,
            created_by_user_id=current_user.id,
        )
        db.add(appearance)

    db.flush()
    recompute_season_caches(db, season.id)
    db.commit()
    return AppearanceOut(matchday_id=appearance.matchday_id, player_id=appearance.player_id, status=appearance.status)


@router.post("/matchdays/{matchday_id}/lock", response_model=LockMatchDayOut)
def lock_matchday(matchday_id: int, db: DBSession, current_user: CurrentUser) -> LockMatchDayOut:
    matchday = get_matchday_or_404(db, matchday_id)
    season = db.get(Season, matchday.season_id)
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    require_role(db, group_id=season.group_id, user_id=current_user.id, minimum=RoleEnum.ADMIN)

    teams, match = generate_balanced_teams(db, matchday)
    db.commit()
    return LockMatchDayOut(matchday_id=matchday_id, locked=True, teams=teams, match_id=match.id if match else None)
