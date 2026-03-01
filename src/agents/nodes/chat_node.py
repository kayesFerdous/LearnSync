from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.language_models.chat_models import BaseChatModel

from src.agents.model import AgentState
from src.core.logging_config import get_logger

logger = get_logger(__name__)


def make_chat_node(llm: BaseChatModel):
    async def chat_node(state: AgentState):
        try:
            messages = state['messages']
            
            system_prompt = """You are LearnSync's intelligent study companion.

            Your Mission:
            1. Help students manage their time effectively (Google Calendar integration).
            2. Clarify academic concepts, debug code, or explain complex topics simply.
            3. Be encouraging, concise, and structured in your responses.

            Capabilities to Mention (only if relevant):
            - "I can schedule study sessions or reminders on your calendar."
            - "I can answer questions from your uploaded documents (RAG)."
            - "I can extract routines from images of your class schedule."

            Tone: Friendly, professional, and student-focused."""
            prompt_messages = [SystemMessage(content=system_prompt)] + messages

            response = await llm.ainvoke(prompt_messages)
            
            logger.debug(f"Chat node LLM response: {response.content[:200]}")

            return {'messages': [AIMessage(content=response.content)]}

        except Exception as e:
            logger.error(f"Error in chat_node: {e}")
            error_response = AIMessage(content="Sorry, I encountered an error.")
            return {'messages': [error_response]}

    return chat_node
