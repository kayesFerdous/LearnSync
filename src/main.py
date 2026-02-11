from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from src.core.config import settings

# from src.api.routes.calendar import router as calendar_router
# from src.api.routes.text_editor import router as editor_router
from src.api.auth.router import router as auth_router
# from src.api.routes.study_bot import router as study_router
from src.api.uploads.router import router as upload_router
from src.api.conversations.router import router as agent_router
from src.api.users.router import router as user_router
from src.api.calendar.router import router as calendar_router
from src.api.routines.router import router as routine_router
from src.api.conversations.router import router as conversation_router
from src.api.admin.router import router as admin_router
from src.api.question_generation.router import router as mcq_router
from src.core.lifespan import lifespan


app = FastAPI(lifespan=lifespan)
app.include_router(agent_router)
# app.include_router(editor_router)
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(user_router)
app.include_router(calendar_router)
app.include_router(routine_router)
app.include_router(conversation_router)
app.include_router(admin_router)
app.include_router(mcq_router)
app.add_middleware(SessionMiddleware, secret_key="amijanikintubolbona")
# app.include_router(study_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_LINK, "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Include OPTIONS
    allow_headers=["*"],
)

@app.get("/heath")
async def check_healt():
    return {"message": "all is well"}
