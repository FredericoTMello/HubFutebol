from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


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
    entries: list[LedgerEntryOut] = Field(default_factory=list)
