import secrets

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from ..deps import CurrentUser, DBSession, get_membership_or_404, require_role
from ..models import Group, Ledger, Membership, RoleEnum, Season
from ..schemas import GroupCreate, GroupOut, InviteOut, JoinGroupIn

router = APIRouter(prefix="/groups", tags=["groups"])


def _group_out(db: DBSession, group: Group) -> GroupOut:
    memberships = db.scalars(select(Membership).where(Membership.group_id == group.id)).all()
    active_season = db.scalar(
        select(Season).where(Season.group_id == group.id, Season.is_active.is_(True)).order_by(Season.id.desc())
    )
    return GroupOut(
        id=group.id,
        name=group.name,
        join_code=group.join_code,
        created_by_user_id=group.created_by_user_id,
        memberships=memberships,
        active_season_id=active_season.id if active_season else None,
    )


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(payload: GroupCreate, db: DBSession, current_user: CurrentUser) -> GroupOut:
    group = Group(name=payload.name.strip(), created_by_user_id=current_user.id)
    db.add(group)
    db.flush()
    db.add(Membership(user_id=current_user.id, group_id=group.id, role=RoleEnum.OWNER))
    db.add(Ledger(group_id=group.id))
    db.commit()
    db.refresh(group)
    return _group_out(db, group)


@router.get("/{group_id}", response_model=GroupOut)
def get_group(group_id: int, db: DBSession, current_user: CurrentUser) -> GroupOut:
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    get_membership_or_404(db, group_id=group_id, user_id=current_user.id)
    return _group_out(db, group)


@router.post("/{group_id}/invite", response_model=InviteOut)
def generate_invite(
    group_id: int,
    db: DBSession,
    current_user: CurrentUser,
    base_url: str = Query(default="http://localhost/join"),
) -> InviteOut:
    require_role(db, group_id=group_id, user_id=current_user.id, minimum=RoleEnum.ADMIN)
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group.join_code = secrets.token_urlsafe(8)
    db.commit()
    return InviteOut(group_id=group.id, join_code=group.join_code, join_link=f"{base_url}?code={group.join_code}")


@router.post("/join", response_model=GroupOut)
def join_group(payload: JoinGroupIn, db: DBSession, current_user: CurrentUser) -> GroupOut:
    group = db.scalar(select(Group).where(Group.join_code == payload.join_code.strip()))
    if not group:
        raise HTTPException(status_code=404, detail="Invalid join code")
    membership = db.scalar(
        select(Membership).where(Membership.group_id == group.id, Membership.user_id == current_user.id)
    )
    if not membership:
        db.add(Membership(group_id=group.id, user_id=current_user.id, role=RoleEnum.MEMBER))
        db.commit()
    return _group_out(db, group)
