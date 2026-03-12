from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .enums import PlayerPosition
from .shared import utcnow

if TYPE_CHECKING:
    from .group import Group


class Player(Base):
    __tablename__ = "players"
    __table_args__ = (UniqueConstraint("group_id", "name", name="uq_player_group_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(120))
    nickname: Mapped[str | None] = mapped_column(String(80), nullable=True)
    position: Mapped[PlayerPosition | None] = mapped_column(
        Enum(PlayerPosition, native_enum=False, length=20, name="playerposition"),
        nullable=True,
    )
    skill_rating: Mapped[int] = mapped_column(Integer, default=5)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    group: Mapped[Group] = relationship(back_populates="players")
