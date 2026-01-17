from langchain_core.language_models.chat_models import BaseChatModel

from src.services.vision.schema import WeeklyRoutine
from src.agents.model import AgentState
from src.services.vision.extractor import image_extractor


def make_routine_node(llm: BaseChatModel):
    async def routine_node(state: AgentState):

        message = state['messages'][-1]
        result:WeeklyRoutine = await image_extractor(llm, message)
        state['scratchpad']['extracted_routine'] = result.model_dump()

        # Clean image data from all messages to save tokens/space
        cleaned_messages = []
        for msg in state['messages']:
            if isinstance(msg.content, list):
                # Keep only non-image content
                msg.content = [
                    part for part in msg.content 
                    if isinstance(part, dict) and part.get('type') != 'image_url'
                ]
            cleaned_messages.append(msg)

        # Signal the reducer to replace the history with this cleaned list
        if cleaned_messages:
            cleaned_messages[0].additional_kwargs['replace_history'] = True

        # Debug print
        debug_msgs = [
            f"{type(m).__name__}: {str(m.content)[:50]}..." 
            for m in cleaned_messages
        ]
        print(f"\nCleaned messages sent to state:\n {debug_msgs}")

        return {
            "scratchpad": state['scratchpad'],
            "messages": cleaned_messages
        }

    return routine_node


