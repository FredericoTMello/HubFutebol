from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import Membership, RoleEnum, User
from .security import decode_access_token

DBSession = Annotated[Session, Depends(get_db)]

ROLE_WEIGHT = {
    RoleEnum.MEMBER: 1,
    RoleEnum.ADMIN: 2,
    RoleEnum.OWNER: 3,
}


def get_current_user(
    db: DBSession,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_membership_or_404(db: Session, group_id: int, user_id: int) -> Membership:
    membership = db.scalar(
        select(Membership).where(Membership.group_id == group_id, Membership.user_id == user_id)
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found for group")
    return membership


def require_role(db: Session, group_id: int, user_id: int, minimum: RoleEnum) -> Membership:
    membership = get_membership_or_404(db, group_id=group_id, user_id=user_id)
    if ROLE_WEIGHT[membership.role] < ROLE_WEIGHT[minimum]:
        raise HTTPException(status_code=403, detail="Insufficient role")
    return membership

