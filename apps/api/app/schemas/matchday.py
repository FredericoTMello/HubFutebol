from datetime import date, datetime

from pydantic import BaseModel, Field

from ..models import AppearanceStatus


class MatchDayCreate(BaseModel):
    title: str
    scheduled_for: date
    notes: str | None = None


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
    players: list[TeamPlayerOut] = Field(default_factory=list)


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
    attendance: list[AppearanceOut] = Field(default_factory=list)
    teams: list[TeamOut] = Field(default_factory=list)
    matches: list[MatchSummaryOut] = Field(default_factory=list)


class LockMatchDayOut(BaseModel):
    matchday_id: int
    locked: bool
    teams: list[TeamOut] = Field(default_factory=list)
    match_id: int | None = None
