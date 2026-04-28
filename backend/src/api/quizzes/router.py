from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from src.quizzes.schemas import MCQRequest, MCQList, QuizResponse, QuizQuestionResponse, QuizSummary, QuizScoreUpdate
from src.quizzes.service import generate_questions, save_quiz, get_all_quizzes, get_quiz_with_questions, update_quiz_score
from src.db.session import get_db
from src.api.dependencies import get_current_user
from src.users.model import User

router = APIRouter(prefix="/mcq", tags=["MCQ Generation"])

@router.post("/generate", response_model=MCQList)
async def generate_mcqs(
    request: Request, 
    mcq_request: MCQRequest,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
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

@router.get("", response_model=List[QuizSummary])
async def get_quizzes(
    folder_id: Optional[UUID] = None,
    conversation_id: Optional[UUID] = None,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get all quizzes for the current user.
    Optionally filter by folder_id or conversation_id.
    """
    quizzes = await get_all_quizzes(session, user.user_id, folder_id, conversation_id)
    return quizzes

@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz_detail(
    quiz_id: UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get a specific quiz with all its questions.
    """
    quiz = await get_quiz_with_questions(session, user.user_id, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@router.patch("/{quiz_id}/score", response_model=dict)
async def update_score(
    quiz_id: UUID,
    score_update: QuizScoreUpdate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Update the score for a specific quiz.
    """
    success = await update_quiz_score(session, user.user_id, quiz_id, score_update.score)
    if not success:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    return {"message": "Score updated successfully"}
