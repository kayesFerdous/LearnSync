from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages.base import BaseMessage

from src.services.vision.schema import WeeklyRoutine

async def image_extractor(llm: BaseChatModel, message: BaseMessage) -> WeeklyRoutine:
    routine_generator_llm = llm.with_structured_output(WeeklyRoutine)
    result = await routine_generator_llm.ainvoke([message])

    return WeeklyRoutine.model_validate(result)



