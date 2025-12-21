from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings

from src.api.routes.calendar import router as calendar_router
from src.api.routes.text_editor import router as editor_router
# from src.api.routes.study_bot import router as study_router
from src.api.agents.router import router as agent_router
from src.core.lifespan import lifespan


app = FastAPI(lifespan=lifespan)
app.include_router(agent_router)
app.include_router(calendar_router)
app.include_router(editor_router)
# app.include_router(study_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_LINK, "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Include OPTIONS
    allow_headers=["*"],
)

@app.get("/heath")
async def check_healt():
    return {"message": "all is well"}
