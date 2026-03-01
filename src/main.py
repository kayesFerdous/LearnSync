from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from src.core.config import settings
from src.api.auth.router import router as auth_router
from src.api.uploads.router import router as upload_router
from src.api.conversations.router import router as conversation_router
from src.api.me.router import router as me_router
from src.api.users.router import router as users_router
from src.api.calendar.router import router as calendar_router
from src.api.routines.router import router as routine_router
from src.api.admin.router import router as admin_router
from src.api.quizzes.router import router as mcq_router
from src.api.messaging.router import router as messaging_router
from src.core.lifespan import lifespan
from src.core.exceptions import register_exception_handlers


app = FastAPI(lifespan=lifespan)
register_exception_handlers(app)
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(conversation_router)
app.include_router(me_router)
app.include_router(users_router)
app.include_router(calendar_router)
app.include_router(routine_router)
app.include_router(admin_router)
app.include_router(mcq_router)
app.include_router(messaging_router)
app.add_middleware(SessionMiddleware, secret_key=settings.SESSION_SECRET_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_LINK, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

@app.get("/health")
async def check_health():
    return {"message": "all is well"}
