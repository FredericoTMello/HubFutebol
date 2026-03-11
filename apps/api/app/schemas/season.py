from datetime import date

from pydantic import BaseModel, ConfigDict


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


class MatchDayListItem(BaseModel):
    id: int
    season_id: int
    title: str
    scheduled_for: date
    is_locked: bool
