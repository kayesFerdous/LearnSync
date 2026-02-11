from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from src.quizzes.schemas import MCQRequest, MCQList, QuizResponse, QuizQuestionResponse
from src.quizzes.service import generate_questions, save_quiz, get_all_quizzes, get_quiz_with_questions
from src.db.session import get_db
from src.users.service import current_user
from src.users.model import User

router = APIRouter(prefix="/mcq", tags=["MCQ Generation"])

@router.post("/generate", response_model=MCQList)
async def generate_mcqs(
    request: Request, 
    mcq_request: MCQRequest,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(current_user)
):
    """
    Generate multiple-choice questions based on the provided scope (files, folders, consumption).
    Uses LLM and Qdrant client instance from application state.
    Persists the generated quiz to the database.
    """
    try:
        # Access dependencies from app state
        llm = request.app.state.gemini_llm
        qdrant_client = request.app.state.qdrant_client
        
        result = await generate_questions(llm, qdrant_client, mcq_request)
        
        # Save to DB
        if result.questions:
            await save_quiz(session, user.user_id, mcq_request, result)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[QuizResponse])
async def get_quizzes(
    session: AsyncSession = Depends(get_db),
    user: User = Depends(current_user)
):
    """
    Get all quizzes for the current user.
    """
    quizzes = await get_all_quizzes(session, user.user_id)
    return quizzes

@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz_detail(
    quiz_id: UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(current_user)
):
    """
    Get a specific quiz with all its questions.
    """
    quiz = await get_quiz_with_questions(session, user.user_id, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz
