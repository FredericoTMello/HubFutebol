from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func, select

from ..deps import CurrentUser, DBSession, get_membership_or_404, require_role
from ..models import Group, Player, RoleEnum
from ..pagination import Pagination, apply_pagination_headers
from ..schemas import PlayerCreate, PlayerOut, PlayerUpdate

router = APIRouter(tags=["players"])
group_players_router = APIRouter(prefix="/groups/{group_id}/players", tags=["players"])
player_router = APIRouter(prefix="/players", tags=["players"])


@group_players_router.post("", response_model=PlayerOut, status_code=status.HTTP_201_CREATED)
def create_player(group_id: int, payload: PlayerCreate, db: DBSession, current_user: CurrentUser) -> PlayerOut:
    require_role(db, group_id=group_id, user_id=current_user.id, minimum=RoleEnum.ADMIN)
    if not db.get(Group, group_id):
        raise HTTPException(status_code=404, detail="Group not found")
    player = Player(group_id=group_id, **payload.model_dump())
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@group_players_router.get("", response_model=list[PlayerOut])
def list_players(
    group_id: int,
    response: Response,
    pagination: Pagination,
    db: DBSession,
    current_user: CurrentUser,
) -> list[PlayerOut]:
    get_membership_or_404(db, group_id=group_id, user_id=current_user.id)
    total = db.scalar(select(func.count()).select_from(Player).where(Player.group_id == group_id)) or 0
    apply_pagination_headers(response, total=total, pagination=pagination)
    return db.scalars(
        select(Player)
        .where(Player.group_id == group_id)
        .order_by(Player.name)
        .offset(pagination.offset)
        .limit(pagination.limit)
    ).all()


@player_router.patch("/{player_id}", response_model=PlayerOut)
def update_player(player_id: int, payload: PlayerUpdate, db: DBSession, current_user: CurrentUser) -> PlayerOut:
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    require_role(db, group_id=player.group_id, user_id=current_user.id, minimum=RoleEnum.ADMIN)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(player, key, value)
    db.commit()
    db.refresh(player)
    return player


router.include_router(group_players_router)
router.include_router(player_router)
