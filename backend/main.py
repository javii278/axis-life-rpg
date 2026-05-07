import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.database import init_db
from backend.core.limiter import limiter
from backend.api.routes import habits, character, focus, goals, quests, coach, achievements, analytics
from backend.api.routes import auth

app = FastAPI(title="Axis API", version="0.2.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_extra = os.getenv("CORS_ORIGINS", "")
if _extra:
    _cors_origins.extend(o.strip() for o in _extra.split(",") if o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(habits.router, prefix="/api")
app.include_router(character.router, prefix="/api")
app.include_router(focus.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(quests.router, prefix="/api")
app.include_router(coach.router, prefix="/api")
app.include_router(achievements.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Axis", "version": "0.2.0"}
