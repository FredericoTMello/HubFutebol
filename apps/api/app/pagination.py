from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Query, Response


@dataclass(slots=True)
class PaginationParams:
    limit: int
    offset: int


def get_pagination_params(
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PaginationParams:
    return PaginationParams(limit=limit, offset=offset)


Pagination = Annotated[PaginationParams, Depends(get_pagination_params)]


def apply_pagination_headers(response: Response, *, total: int, pagination: PaginationParams) -> None:
    response.headers["X-Total-Count"] = str(total)
    response.headers["X-Limit"] = str(pagination.limit)
    response.headers["X-Offset"] = str(pagination.offset)
