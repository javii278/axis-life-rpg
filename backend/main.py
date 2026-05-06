from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db
from backend.api.routes import habits, character, focus, goals, quests, coach, achievements, analytics
from backend.api.routes import auth

app = FastAPI(title="Axis API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
