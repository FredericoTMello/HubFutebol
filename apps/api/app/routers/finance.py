from decimal import Decimal

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func, select

from ..deps import CurrentUser, DBSession, get_membership_or_404, require_role
from ..models import Ledger, LedgerEntry, RoleEnum
from ..pagination import Pagination, PaginationParams, apply_pagination_headers
from ..schemas import LedgerEntryCreate, LedgerOut
from ..services import ensure_group_ledger

router = APIRouter(tags=["finance"])
ledger_router = APIRouter(prefix="/groups/{group_id}/ledger", tags=["finance"])


@ledger_router.post("/entries", response_model=LedgerOut, status_code=status.HTTP_201_CREATED)
def create_ledger_entry(
    group_id: int,
    payload: LedgerEntryCreate,
    db: DBSession,
    current_user: CurrentUser,
) -> LedgerOut:
    require_role(db, group_id=group_id, user_id=current_user.id, minimum=RoleEnum.ADMIN)
    ledger = ensure_group_ledger(db, group_id)
    amount = Decimal(payload.amount)
    if payload.kind in {"OUT", "EXPENSE"} and amount > 0:
        amount = -amount
    entry = LedgerEntry(
        ledger_id=ledger.id,
        amount=amount,
        kind=payload.kind,
        description=payload.description,
        created_by_user_id=current_user.id,
    )
    db.add(entry)
    ledger.balance = (ledger.balance or Decimal("0")) + amount
    db.commit()
    return _ledger_out(db, group_id=group_id, ledger_id=ledger.id)


@ledger_router.get("", response_model=LedgerOut)
def get_ledger(
    group_id: int,
    response: Response,
    pagination: Pagination,
    db: DBSession,
    current_user: CurrentUser,
) -> LedgerOut:
    get_membership_or_404(db, group_id=group_id, user_id=current_user.id)
    ledger = ensure_group_ledger(db, group_id)
    db.commit()
    return _ledger_out(db, group_id=group_id, ledger_id=ledger.id, response=response, pagination=pagination)


def _ledger_out(
    db: DBSession,
    group_id: int,
    ledger_id: int,
    *,
    response: Response | None = None,
    pagination: PaginationParams | None = None,
) -> LedgerOut:
    ledger = db.get(Ledger, ledger_id)
    if not ledger:
        raise HTTPException(status_code=404, detail="Ledger not found")
    entries_stmt = (
        select(LedgerEntry)
        .where(LedgerEntry.ledger_id == ledger_id)
        .order_by(LedgerEntry.created_at.desc(), LedgerEntry.id.desc())
    )
    if response and pagination:
        total = db.scalar(select(func.count()).select_from(LedgerEntry).where(LedgerEntry.ledger_id == ledger_id)) or 0
        apply_pagination_headers(response, total=total, pagination=pagination)
        entries_stmt = entries_stmt.offset(pagination.offset).limit(pagination.limit)
    entries = db.scalars(entries_stmt).all()
    return LedgerOut(
        group_id=group_id,
        ledger_id=ledger.id,
        balance=ledger.balance,
        entries=[
            {
                "id": e.id,
                "amount": e.amount,
                "kind": e.kind,
                "description": e.description,
                "created_at": e.created_at,
            }
            for e in entries
        ],
    )


router.include_router(ledger_router)
