from langchain_core.prompts import PromptTemplate
from langchain_core.messages import AIMessage, AIMessageChunk, BaseMessage, HumanMessage
# from langchain_google_genai import GoogleGenerativeAIEmbeddings
# from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from typing import Literal, TypedDict, Annotated
import aiosqlite
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from src.services.llm_service import setup_embeddings, setup_gemini_llm, setup_prompt_template, setup_groq_llm, setup_vector_store
from src.schemas.bot import ToolSelection
from .nodes import calendar_agent


def chat_reducer(old: list[BaseMessage], new: list[BaseMessage]) -> list[BaseMessage]:
    return old[-6:] + new


# checkpointer = SqliteSaver(conn=conn)

config = {"configurable": {"thread_id": "user_id-1"}}


class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], chat_reducer]
    # message: str
    tool: str
    # agent_response: str


class ChatBot():
    def __init__(
        self, 
        llm_model,
        prompt_template:PromptTemplate, 
        checkpointer: AsyncSqliteSaver,
        max_history: int = 6
    ):

        self.graph = StateGraph(ChatState)
        self.prompt_template = prompt_template
        self.llm_model = llm_model
        self.max_history = max_history
        self.checkpointer = checkpointer
        self.define_nodes()
        self.workflow = self.graph.compile(checkpointer=self.checkpointer)


    @classmethod
    async def from_pdf(cls):
        # llm_model = await setup_groq_llm(max_tokens=500)
        llm_model = await setup_gemini_llm(max_tokens=300)
        prompt_template = await setup_prompt_template()
        conn = await aiosqlite.connect("chat.sqlite")
        checkpointer = AsyncSqliteSaver(conn=conn)
        return cls(llm_model, prompt_template, checkpointer)


    async def tool_selection(self, state: ChatState):
        try:
            tool_selection_model = self.llm_model.with_structured_output(ToolSelection)
            print(f"\nmessages in selection tool:\n{state['messages'][-1]}")
            question = state['messages'][-1].content
            history_messages = state['messages'][:-1]
            print(f"\nhistory messages in selection tool:\n{history_messages}")

            chat_history = "\n".join([f"{'Human' if isinstance(chat, HumanMessage) else 'Ai'}: {chat.content}" for chat in history_messages])
            print(f"pre messages: \n{history_messages}")

            selection_prompt = f"""
            You are a Google Calendar assistant. Your main goal is to manage the user's schedule.
            
            Tools:
            - `calendar_agent`: For all calendar-related tasks. This is the default tool.
            - `chat_node`: For non-calendar conversation.

            History:
            {chat_history}

            Current User Request:
            {question}

            Focus on the user's intent, not past AI errors. If the request involves the calendar, you must use `calendar_agent`.

            Tool:"""

            print("\n\n prompt: ", selection_prompt)
            response = await tool_selection_model.ainvoke(selection_prompt)
            print(f"\n\nfrom tool_selection llm response: {response}\n")
            return {"tool":response.tool}

        except Exception as e:
            print("\nError while calling tool_selection", str(e))
            # Default to chat_node on error to avoid getting stuck
            return {"tool": "chat_node"}


    async def tool_needed(self, state: ChatState) -> Literal["chat_node", "calendar_agent"]:
        tool = state['tool']
        if tool == "chat_node":
            return "chat_node"
        return "calendar_agent"


    async def chat_node(self, state:ChatState):
        try:
            messages = state['messages']
            print(messages[-6:])
            response = await self.llm_model.ainvoke(f"system: answers should be short\n\nhistory:\n{messages[-6:]}")
            print(f"\n\n\nLLM response: \n{response.content}\n\n\n")
            return {'messages': [AIMessage(content=response.content)]}
        except Exception as e:
            print(f"Error while calling the chat_node: {str(e)}")
            error_response = AIMessage(content="Sorry, I encountered an error.")
            return {'messages': [error_response]}


    async def test_node(self, state:ChatState):
        try:
            # print(f"\n\ncurrent last message: \n{state['messages'][-1].content}\n\n")
            # return {"agent_response": state["agent_response"]}
            pass
        except Exception as e:
            print("\nerror in teh test node ", str(e))
            return {'agent_response': 'Error occurred'}


    def define_nodes(self):
        try:
            self.graph.add_node("chat_node", self.chat_node)
            self.graph.add_node("calendar_agent", calendar_agent)
            self.graph.add_node("tool_selection", self.tool_selection)

            self.graph.add_edge(START, "tool_selection")
            self.graph.add_conditional_edges("tool_selection", self.tool_needed)
            self.graph.add_edge("calendar_agent", END)
            self.graph.add_edge("chat_node", END)
        except:
            print("Error in the define_nodes function ")


    async def run(self, query: str):
        try: 

            async for event in self.workflow.astream_events({"messages": [HumanMessage(query)]}, config=config, version="v2"):
                kind = event['event']
        
                if kind == "on_chat_model_stream":
                    chunk: AIMessageChunk = event['data']['chunk']
                    yield {"type": "chunk", "content": chunk.content}

                # tool name
                # if kind == "on_chat_model_end":
                #     msg = event["data"]["output"]  # Full AIMessage after stream
                #     if hasattr(msg, "tool_calls") and msg.tool_calls:
                #         for tc in msg.tool_calls:
                #             yield {"type": "chunk", "content": f"Tool Use: {tc['name']}"}


            # full_content = ""
            # final_node = None
            
            # async for chunk, metadata in self.workflow.astream(
            #     {"messages": [HumanMessage(query)],"message":"" ,"tool": "", "agent_response": ""}, 
            #     stream_mode='messages', 
            #     config=config
            # ):
            #     if chunk.content:
            #         full_content += chunk.content
            #         yield {"type": "chunk", "content": chunk.content}
            #     
            #     # Track which node we're in
            #     if metadata:
            #         final_node = metadata.get('langgraph_node')
            # 
            # print(f"\n\nfull content: \n{full_content}\n")
            # 
            # # After streaming completes, update the state with the AI message
            # if full_content:
            #     await self.workflow.aupdate_state(
            #         config=config,
            #         values={"messages": [AIMessage(content=full_content)]},
            #         as_node=final_node  # Update as the node that generated the response
            #     )
            #     print("✓ State updated with AI message")

        except Exception as e:
            print(f"\nError while streaming the response: {e}")
