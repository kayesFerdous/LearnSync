from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.language_models.chat_models import BaseChatModel

from src.core.calendar_toolkit import get_current_time_context
from src.agents.model import AgentState
from src.agents.registry import build_calendar_agent

def make_calendar_node(llm: BaseChatModel):
    async def node(state: AgentState):
        
        user_id = state.get("user_id")
        if not user_id:
            return {'messages': [AIMessage(content="Error: User ID is missing from the conversation state.")]}

        # Build the executor dynamically for this user
        try:
            agent_executor = await build_calendar_agent(user_id, llm)
        except Exception as e:
            print(f"Error building calendar agent: {e}")
            return {'messages': [AIMessage(content="I'm having trouble accessing your calendar tools right now.")]}

        # Get the last few messages for context
        history = state['messages'][-4:] if len(state['messages']) >= 4 else state['messages']
        
        # Convert messages to a string format the agent can understand
        conversation_context = "\n".join([
                f"{ 'User' if isinstance(chat, HumanMessage) else 'Assistant'}: {chat.content}" for chat in history[:-1]
            ])

        current_query = history[-1].content if history else ""
        time_context = await get_current_time_context()
        
        # Create a comprehensive input for the agent
        agent_input = f"""
        You are a friendly, professional, and efficient Google Calendar assistant.
        Your goal is to help the user with their calendar requests. Please keep your final responses concise and helpful.
        Time context: {time_context}

        Here is the conversation so far:
        {conversation_context}

        The user's current request is: "{current_query}"
        """

        # print(f"Agent input: {agent_input}")
        
        try:
            result = await agent_executor.ainvoke({"input": agent_input})
            print(f"result from the calendar_agent: {result}")
            
            # Return the agent's response in the correct format for the state
            if result and 'output' in result:
                response_message = AIMessage(content=result['output'])
                print(f"Agent result:  {response_message}")
                return {'messages': [response_message]}
            else:
                # Fallback if no output
                response_message = AIMessage(content="I wasn't able to process your calendar request. Please try again.")
                return {'messages': [response_message]}
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error in calendar_agent: {str(e)}")
            error_message = AIMessage(content="Sorry, I encountered an error while processing your calendar request.")
            return {'messages': [error_message]}


    return node
