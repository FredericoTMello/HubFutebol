from pydantic import BaseModel, Field


class MatchCreate(BaseModel):
    home_team_id: int
    away_team_id: int


class GoalEventIn(BaseModel):
    player_id: int
    quantity: int = Field(default=1, ge=1, le=20)


class MatchResultIn(BaseModel):
    home_score: int = Field(ge=0, le=99)
    away_score: int = Field(ge=0, le=99)
    goals: list[GoalEventIn] = Field(default_factory=list)


class MatchOut(BaseModel):
    id: int
    matchday_id: int
    home_team_id: int
    away_team_id: int
    home_score: int | None
    away_score: int | None
