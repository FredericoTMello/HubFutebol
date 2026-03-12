class DomainError(Exception):
    status_code = 400

    def __init__(self, detail: str, *, status_code: int | None = None) -> None:
        super().__init__(detail)
        self.detail = detail
        if status_code is not None:
            self.status_code = status_code


class DomainNotFoundError(DomainError):
    status_code = 404


class DomainPermissionError(DomainError):
    status_code = 403


class DomainValidationError(DomainError):
    status_code = 400
