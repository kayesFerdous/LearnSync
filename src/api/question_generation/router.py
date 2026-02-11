from fastapi import APIRouter, HTTPException, Request
from src.question_generation.schema import MCQRequest, MCQList
from src.question_generation.service import generate_questions

router = APIRouter(prefix="/mcq", tags=["MCQ Generation"])

@router.post("/generate", response_model=MCQList)
async def generate_mcqs(request: Request, mcq_request: MCQRequest):
    """
    Generate multiple-choice questions based on the provided scope (files, folders, consumption).
    Uses LLM and Qdrant client instance from application state.
    """
    try:
        # Access dependencies from app state
        llm = request.app.state.gemini_llm
        qdrant_client = request.app.state.qdrant_client
        
        result = await generate_questions(llm, qdrant_client, mcq_request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
