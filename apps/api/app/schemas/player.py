from pydantic import BaseModel, ConfigDict, Field


class PlayerCreate(BaseModel):
    name: str
    nickname: str | None = None
    position: str | None = None
    skill_rating: int = Field(default=5, ge=1, le=10)
    user_id: int | None = None


class PlayerUpdate(BaseModel):
    name: str | None = None
    nickname: str | None = None
    position: str | None = None
    skill_rating: int | None = Field(default=None, ge=1, le=10)
    is_active: bool | None = None


class PlayerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    group_id: int
    user_id: int | None
    name: str
    nickname: str | None
    position: str | None
    skill_rating: int
    is_active: bool
