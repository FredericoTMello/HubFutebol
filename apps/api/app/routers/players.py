from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from ..deps import CurrentUser, DBSession, get_membership_or_404, require_role
from ..models import Group, Player, RoleEnum
from ..schemas import PlayerCreate, PlayerOut, PlayerUpdate

router = APIRouter(tags=["players"])


@router.post("/groups/{group_id}/players", response_model=PlayerOut, status_code=status.HTTP_201_CREATED)
def create_player(group_id: int, payload: PlayerCreate, db: DBSession, current_user: CurrentUser) -> PlayerOut:
    require_role(db, group_id=group_id, user_id=current_user.id, minimum=RoleEnum.ADMIN)
    if not db.get(Group, group_id):
        raise HTTPException(status_code=404, detail="Group not found")
    player = Player(group_id=group_id, **payload.model_dump())
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.get("/groups/{group_id}/players", response_model=list[PlayerOut])
def list_players(group_id: int, db: DBSession, current_user: CurrentUser) -> list[PlayerOut]:
    get_membership_or_404(db, group_id=group_id, user_id=current_user.id)
    return db.scalars(select(Player).where(Player.group_id == group_id).order_by(Player.name)).all()


@router.patch("/players/{player_id}", response_model=PlayerOut)
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

