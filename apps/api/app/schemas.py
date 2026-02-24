from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import AppearanceStatus, RoleEnum


class MessageOut(BaseModel):
    message: str


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


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
    memberships: list[MembershipOut] = []
    active_season_id: int | None = None


class InviteOut(BaseModel):
    group_id: int
    join_code: str
    join_link: str


class JoinGroupIn(BaseModel):
    join_code: str


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


class SeasonCreate(BaseModel):
    name: str
    win_points: int = 3
    draw_points: int = 1
    loss_points: int = 0
    no_show_points: int = -1


class SeasonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    group_id: int
    name: str
    is_active: bool
    started_at: date
    ended_at: date | None


class StandingItem(BaseModel):
    player_id: int
    player_name: str
    points: int
    wins: int
    draws: int
    losses: int
    no_shows: int
    games_played: int


class StandingsOut(BaseModel):
    season_id: int
    items: list[StandingItem]


class PlayerStatItem(BaseModel):
    player_id: int
    player_name: str
    appearances: int
    goals: int
    no_shows: int


class PlayerStatsOut(BaseModel):
    season_id: int
    items: list[PlayerStatItem]


class MatchDayCreate(BaseModel):
    title: str
    scheduled_for: date
    notes: str | None = None


class MatchDayListItem(BaseModel):
    id: int
    season_id: int
    title: str
    scheduled_for: date
    is_locked: bool


class AppearanceIn(BaseModel):
    player_id: int
    status: AppearanceStatus


class AppearanceOut(BaseModel):
    matchday_id: int
    player_id: int
    status: AppearanceStatus


class TeamPlayerOut(BaseModel):
    player_id: int
    player_name: str
    position: str | None
    skill_rating: int


class TeamOut(BaseModel):
    team_id: int
    name: str
    total_rating: int
    players: list[TeamPlayerOut]


class MatchSummaryOut(BaseModel):
    id: int
    home_team_id: int
    away_team_id: int
    home_score: int | None = None
    away_score: int | None = None
    finished_at: datetime | None = None


class MatchDayOut(BaseModel):
    id: int
    season_id: int
    title: str
    scheduled_for: date
    notes: str | None
    is_locked: bool
    locked_at: datetime | None
    attendance: list[AppearanceOut]
    teams: list[TeamOut]
    matches: list[MatchSummaryOut]


class LockMatchDayOut(BaseModel):
    matchday_id: int
    locked: bool
    teams: list[TeamOut]
    match_id: int | None = None


class MatchCreate(BaseModel):
    home_team_id: int
    away_team_id: int


class GoalEventIn(BaseModel):
    player_id: int
    quantity: int = Field(default=1, ge=1, le=20)


class MatchResultIn(BaseModel):
    home_score: int = Field(ge=0, le=99)
    away_score: int = Field(ge=0, le=99)
    goals: list[GoalEventIn] = []


class MatchOut(BaseModel):
    id: int
    matchday_id: int
    home_team_id: int
    away_team_id: int
    home_score: int | None
    away_score: int | None


class LedgerEntryCreate(BaseModel):
    amount: Decimal
    kind: Literal["IN", "OUT", "FEE", "EXPENSE"] = "IN"
    description: str | None = None


class LedgerEntryOut(BaseModel):
    id: int
    amount: Decimal
    kind: str
    description: str | None
    created_at: datetime


class LedgerOut(BaseModel):
    group_id: int
    ledger_id: int
    balance: Decimal
    entries: list[LedgerEntryOut]
