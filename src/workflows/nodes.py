from src.services.llm_service import setup_gemini_llm, setup_groq_llm #async
from langchain.hub import pull
from langchain.agents import create_tool_calling_agent, AgentExecutor  # Changed to tool-calling agent
from src.core.calendar_toolkit import get_tools 
from langchain_core.messages import HumanMessage, AIMessage


async def calendar_agent(state):
    try:
        tools = get_tools()
        # llm = await setup_groq_llm(max_tokens=8000, model="qwen/qwen3-32b")
        llm = await setup_groq_llm(max_tokens=1000)
        # llm = await setup_gemini_llm(max_tokens=1000)
        tools_llm = llm.bind_tools(tools)

        prompt = pull("hwchase17/openai-functions-agent")

        agent = create_tool_calling_agent(
            llm=tools_llm,
            tools=tools,
            prompt=prompt
        )

        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
        )

        # Get the last few messages for context
        history = state['messages'][-4:] if len(state['messages']) >= 4 else state['messages']
        
        # Convert messages to a string format the agent can understand
        conversation_context = "\n".join([f"{'User' if isinstance(chat, HumanMessage) else 'Assistant'}: {chat.content}" for chat in history[:-1]])

        # Get the current user query
        current_query = history[-1].content if history else ""
        
        # Create a comprehensive input for the agent
        agent_input = f"""
        Previous conversation context:
        {conversation_context}

        Current request: {current_query}

        Please help with this calendar-related request. Use the available tools to create, delete, or manage calendar events as requested.
        """

        # print(f"Agent input: {agent_input}")
        
        result = await agent_executor.ainvoke({"input": agent_input})
        
        # Return the agent's response in the correct format for the state
        if result and 'output' in result:
            response_message = AIMessage(content=result['output'])
            print(f"Agent result:  {response_message}")
            return {'messages': [response_message]}
            # return {"messages": [response_message]}
        else:
            # Fallback if no output
            response_message = AIMessage(content="I wasn't able to process your calendar request. Please try again.")
            return {'messages': [response_message]}
            
    except Exception as e:
        print(f"Error in calendar_agent: {str(e)}")
        error_message = AIMessage(content="Sorry, I encountered an error while processing your calendar request.")
        return {'messages': [error_message]}

