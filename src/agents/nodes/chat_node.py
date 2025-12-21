from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.language_models.chat_models import BaseChatModel

from src.agents.model import AgentState


def make_chat_node(llm: BaseChatModel):
    async def chat_node(state: AgentState):
        try:
            messages = state['messages']
            
            system_prompt = """You are LearnSync's AI, here for engaging and concise chats. LearnSync helps manage schedules with Google Calendar; always mention this when asked about capabilities."""
            prompt_messages = [SystemMessage(content=system_prompt)] + messages

            response = await llm.ainvoke(prompt_messages)
            
            print(f"\n\n\nLLM response: \n{response.content}\n\n\n")

            return {'messages': [AIMessage(content=response.content)]}

        except Exception as e:
            print(f"Error while calling the chat_node: {str(e)}")
            error_response = AIMessage(content="Sorry, I encountered an error.")
            return {'messages': [error_response]}

    return chat_node
