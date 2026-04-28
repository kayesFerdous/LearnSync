from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import HumanMessage, SystemMessage

from src.api.editor.schemas import TranslateRequest, TranslateResponse

router = APIRouter(prefix="/editor", tags=["Text Editor"])


def _extract_text_from_llm_response(content: object) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and "text" in item:
                parts.append(str(item["text"]))
        return "\n".join(parts).strip()

    return str(content).strip()


@router.post("/translate", response_model=TranslateResponse)
async def translate_to_english(payload: TranslateRequest, request: Request) -> TranslateResponse:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    llm = getattr(request.app.state, "gemini_llm_temp_0", None)
    if llm is None:
        raise HTTPException(status_code=503, detail="Translation service is unavailable")

    system_prompt = (
        "You are a professional translation engine. "
        "Your task is to convert Bangla or Banglish text into natural, fluent English while preserving meaning and tone. "
        "If the input is already English, return a polished English version with the same intent. "
        "Return only the final English text with no extra commentary."
    )

    try:
        response = await llm.ainvoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=text),
            ]
        )
        translated_text = _extract_text_from_llm_response(response.content)

        if not translated_text:
            raise HTTPException(status_code=502, detail="Empty translation received from model")

        return TranslateResponse(text=translated_text)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to translate text")

