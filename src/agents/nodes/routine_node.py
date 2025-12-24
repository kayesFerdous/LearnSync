from langchain_core.language_models.chat_models import BaseChatModel

from src.services.vision.schema import WeeklyRoutine
from src.agents.model import AgentState
from src.services.vision.extractor import image_extractor


def make_routine_node(llm: BaseChatModel):
    async def routine_node(state: AgentState):

        message = state['messages'][-1]

        result:WeeklyRoutine = await image_extractor(llm, message)

        state['scratchpad']['extracted_routine'] = result.model_dump()
        # print(f'in the routine_node{state['scratchpad']}')

        #delete the last message which contains base64
        state['messages'].pop()
        print("\nfull message:\n",state['messages'])
        # print(f"\n\nfrom the image to text:\n {result}\n\n")

        return state['scratchpad']

    return routine_node


