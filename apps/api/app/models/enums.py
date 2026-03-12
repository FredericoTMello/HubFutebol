import enum


class RoleEnum(str, enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"


class AppearanceStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    DECLINED = "DECLINED"
    NO_SHOW = "NO_SHOW"


class MatchEventType(str, enum.Enum):
    GOAL = "GOAL"


class PlayerPosition(str, enum.Enum):
    DEF = "DEF"
    MID = "MID"
    FWD = "FWD"
    GK = "GK"
