from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .exceptions import DomainError
from .routers import auth, finance, groups, matchdays, matches, players, seasons

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
async def handle_domain_error(_request: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(players.router)
app.include_router(seasons.router)
app.include_router(matchdays.router)
app.include_router(matches.router)
app.include_router(finance.router)

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(auth.router)
v1_router.include_router(groups.router)
v1_router.include_router(players.router)
v1_router.include_router(seasons.router)
v1_router.include_router(matchdays.router)
v1_router.include_router(matches.router)
v1_router.include_router(finance.router)

app.include_router(v1_router)
