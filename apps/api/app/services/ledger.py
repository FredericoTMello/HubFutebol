from sqlalchemy import select
from sqlalchemy.orm import Session

from ..exceptions import DomainNotFoundError
from ..models import Group, Ledger


def ensure_group_ledger(db: Session, group_id: int) -> Ledger:
    ledger = db.scalar(select(Ledger).where(Ledger.group_id == group_id))
    if ledger:
        return ledger
    if not db.get(Group, group_id):
        raise DomainNotFoundError("Group not found")
    ledger = Ledger(group_id=group_id)
    db.add(ledger)
    db.flush()
    return ledger
