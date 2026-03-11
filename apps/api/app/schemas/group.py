from pydantic import BaseModel, ConfigDict, Field

from ..models import RoleEnum


class GroupCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)


class MembershipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    group_id: int
    role: RoleEnum


class GroupOut(BaseModel):
    id: int
    name: str
    join_code: str | None = None
    created_by_user_id: int
    memberships: list[MembershipOut] = Field(default_factory=list)
    active_season_id: int | None = None


class InviteOut(BaseModel):
    group_id: int
    join_code: str
    join_link: str


class JoinGroupIn(BaseModel):
    join_code: str
