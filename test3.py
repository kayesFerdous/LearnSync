#!/usr/bin/env python3
"""
Memory-enhanced LangChain Agent using Memori and Groq
"""

# import os
# from dotenv import load_dotenv
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.callbacks import get_openai_callback
from langchain.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from memori.core.memory import Memori
from memori.tools import create_memory_tool
from src.core.config import settings
from src.services.llm_service import setup_groq_llm_not_async

# load_dotenv()

# Configure environment for Groq
# os.environ["OPENAI_API_KEY"] = settings.GROQ_API_KEY.get_secret_value()
# os.environ["OPENAI_BASE_URL"] = "https://api.groq.com/openai/v1"

print("🧠 Initializing Memori memory system...")

# Initialize Memori
memory_system = Memori(
    database_connect="sqlite:///langchain_example_memory.db",
    conscious_ingest=True,
    verbose=False,
    user_id="kayes",
    model="openai/gpt-oss-20b",
    api_key=settings.GROQ_API_KEY.get_secret_value(),
    base_url="https://api.groq.com/openai/v1",
)

memory_system.enable()
memory_tool = create_memory_tool(memory_system)

print("🤖 Creating memory-enhanced LangChain agent...")


class MemorySearchInput(BaseModel):
    query: str = Field(
        description="What to search for in memory (e.g., 'past conversations', 'user preferences')"
    )


class MemorySearchTool(BaseTool):
    name: str = "search_memory"
    description: str = "Search the agent's memory for past conversations and information."
    args_schema: type[BaseModel] = MemorySearchInput

    def _run(self, query: str, run_manager: CallbackManagerForToolRun | None = None) -> str:
        try:
            if not query.strip():
                return "Please provide a search query"
            result = memory_tool.execute(query=query.strip())
            return str(result) if result else "No relevant memories found"
        except Exception as e:
            return f"Memory search error: {str(e)}"


memory_search_tool = MemorySearchTool()
llm = setup_groq_llm_not_async(model="openai/gpt-oss-20b", max_tokens=500)

prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful AI assistant with memory. Always check your memory first.
    
Instructions:
1. Search your memory for relevant past conversations
2. Use memories to provide personalized responses
3. Be conversational and friendly

If this is the first conversation, introduce yourself."""),
    ("placeholder", "{chat_history}"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_openai_tools_agent(llm, [memory_search_tool], prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=[memory_search_tool],
    verbose=False,
    handle_parsing_errors=True,
    max_iterations=5,
)


def chat_with_memory(user_input: str) -> str:
    try:
        with get_openai_callback() as cb:
            result = agent_executor.invoke({
                "input": user_input,
                "chat_history": [],
            })

            response_content = result.get("output", "I couldn't generate a response.")
            memory_system.record_conversation(user_input=user_input, ai_output=response_content)

            # Print token usage
            print(f"Tokens used: {cb.total_tokens} (prompt: {cb.prompt_tokens}, completion: {cb.completion_tokens})")
            print(f"Total cost: ${cb.total_cost}")
            
            return response_content
    except Exception as e:
        return f"Sorry, I encountered an error: {str(e)}"


# Main loop
print("✅ Setup complete! Chat with your memory-enhanced AI assistant.")
print("Type 'quit' or 'exit' to end the conversation.\n")

conversation_count = 0

while True:
    try:
        user_input = input("You: ").strip()
        
        if user_input.lower() in ["quit", "exit", "bye"]:
            print("\nAI: Goodbye! I'll remember our conversation for next time. 🤖✨")
            break
        
        if not user_input:
            continue
        
        conversation_count += 1
        print(f"\nAI (thinking... conversation #{conversation_count})")
        response = chat_with_memory(user_input)
        print(f"AI: {response}\n")
        
    except KeyboardInterrupt:
        print("\n\nAI: Goodbye! I'll remember our conversation for next time. 🤖✨")
        break
    except Exception as e:
        print(f"\nError: {str(e)}")
        print("Please try again.\n")

print(f"\n📊 Session Summary:")
print(f"- Conversations processed: {conversation_count}")
print(f"- Memory database: langchain_example_memory.db")
print(f"\nYour memories are saved and will be available in future sessions!")
