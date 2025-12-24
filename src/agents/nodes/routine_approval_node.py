from langchain_core.messages import SystemMessage
from langgraph.types import interrupt

from src.agents.model import AgentState


def make_routine_approval_node():
    async def routine_approval_node(state: AgentState):
        """
        Extract routine and interrupt for human approval
        """
        # print("this is the make_routine_approval_node node")

        extracted_routine = state['scratchpad'].get('extracted_routine')
        # print(extracted_routine)

        user_dicision = interrupt({
            "type": "routine_approval_required",
            "extracted_data": extracted_routine,
        })

        print(f'\nuser dicision: {user_dicision}\n')

        messages = []
        metadata = state.get('metadata', {}).copy()

        if isinstance(user_dicision, dict) and user_dicision.get('approved'):
            metadata['routine'] = user_dicision.get('data')
            # print(metadata)
            messages.append(SystemMessage(content="The routine has been approved and saved"))

        else:
            messages.append(SystemMessage(content="The routine has been rejected"))


        return {"metadata": metadata, "messages": messages}

    return routine_approval_node


