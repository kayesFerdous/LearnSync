#NOTE: This is the old version. This file is not being used. 

# import json
# from langchain_core.language_models import BaseChatModel
# from langchain_core.prompts import PromptTemplate
# from langchain_core.messages import AIMessage, AIMessageChunk, BaseMessage, HumanMessage, SystemMessage
# from langgraph.graph import StateGraph, START, END
# from typing import Literal, TypedDict, Annotated
# import aiosqlite
# from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
#
# from src.services.llm_service import setup_embeddings, setup_gemini_llm, setup_prompt_template, setup_groq_llm, setup_vector_store
# from src.schemas.bot import ToolSelection
# from .nodes import calendar_agent
#
#
# def chat_reducer(old: list[BaseMessage], new: list[BaseMessage]) -> list[BaseMessage]:
#     return old[-6:] + new
#
#
# # checkpointer = SqliteSaver(conn=conn)
#
# config = {"configurable": {"thread_id": "user_id-1"}}
#
#
# class ChatState(TypedDict):
#     messages: Annotated[list[BaseMessage], chat_reducer]
#     # message: str
#     tool: str
#     user_id: str
#     # agent_response: str
#
#
# class ChatBot():
#     def __init__(
#         self, 
#         llm_model: BaseChatModel,
#         prompt_template:PromptTemplate, 
#         checkpointer: AsyncSqliteSaver,
#         max_history: int = 6
#     ):
#
#         self.graph = StateGraph(ChatState)
#         self.prompt_template = prompt_template
#         self.llm_model = llm_model
#         self.max_history = max_history
#         self.checkpointer = checkpointer
#         self.define_nodes()
#         self.workflow = self.graph.compile(checkpointer=self.checkpointer)
#
#
#     @classmethod
#     async def from_pdf(cls):
#         # llm_model = await setup_groq_llm(max_tokens=500)
#         llm_model = await setup_gemini_llm(max_tokens=300)
#         prompt_template = await setup_prompt_template()
#         conn = await aiosqlite.connect("chat.sqlite")
#         checkpointer = AsyncSqliteSaver(conn=conn)
#         return cls(llm_model, prompt_template, checkpointer)
#
#
#     async def tool_selection(self, state: ChatState):
#         try:
#             tool_selection_model = self.llm_model.with_structured_output(ToolSelection)
#             print(f"\nmessages in selection tool:\n{state['messages'][-1]}")
#             question = state['messages'][-1].content
#             history_messages = state['messages'][:-1]
#             print(f"\nhistory messages in selection tool:\n{history_messages}")
#
#             chat_history = "\n".join([f"{'Human' if isinstance(chat, HumanMessage) else 'Ai'}: {chat.content}" for chat in history_messages])
#             print(f"pre messages: \n{history_messages}")
#
#             selection_prompt = f"""
#             You are a Google Calendar assistant. Your main goal is to manage the user's schedule.
#             
#             Tools:
#             - `calendar_agent`: For all calendar-related tasks. This is the default tool.
#             - `chat_node`: For non-calendar conversation.
#
#             History:
#             {chat_history}
#
#             Current User Request:
#             {question}
#
#             Focus on the user's intent, not past AI errors. If the request involves the calendar, you must use `calendar_agent`.
#
#             Tool:"""
#
#             print("\n\n prompt: ", selection_prompt)
#             response = await tool_selection_model.ainvoke(selection_prompt)
#             print(f"\n\nfrom tool_selection llm response: {response}\n")
#             return {"tool":response.tool}
#
#         except Exception as e:
#             print("\nError while calling tool_selection", str(e))
#             # Default to chat_node on error to avoid getting stuck
#             return {"tool": "chat_node"}
#
#
#     async def tool_needed(self, state: ChatState) -> Literal["chat_node", "calendar_agent"]:
#         tool = state['tool']
#         if tool == "chat_node":
#             return "chat_node"
#         return "calendar_agent"
#
#
#     async def chat_node(self, state:ChatState):
#         try:
#             messages = state['messages']
#             
#             system_prompt = """You are LearnSync's AI, here for engaging and concise chats. LearnSync helps manage schedules with Google Calendar; always mention this when asked about capabilities."""
#
#             prompt_messages = [SystemMessage(content=system_prompt)] + messages
#
#             response = await self.llm_model.ainvoke(prompt_messages)
#             
#             print(f"\n\n\nLLM response: \n{response.content}\n\n\n")
#             return {'messages': [AIMessage(content=response.content)]}
#         except Exception as e:
#             print(f"Error while calling the chat_node: {str(e)}")
#             error_response = AIMessage(content="Sorry, I encountered an error.")
#             return {'messages': [error_response]}
#
#
#     async def test_node(self, state:ChatState):
#         try:
#             # print(f"\n\ncurrent last message: \n{state['messages'][-1].content}\n\n")
#             # return {"agent_response": state["agent_response"]}
#             pass
#         except Exception as e:
#             print("\nerror in teh test node ", str(e))
#             return {'agent_response': 'Error occurred'}
#
#
#     def define_nodes(self):
#         try:
#             self.graph.add_node("chat_node", self.chat_node)
#             self.graph.add_node("calendar_agent", calendar_agent)
#             self.graph.add_node("tool_selection", self.tool_selection)
#
#             self.graph.add_edge(START, "tool_selection")
#             self.graph.add_conditional_edges("tool_selection", self.tool_needed)
#             self.graph.add_edge("calendar_agent", END)
#             self.graph.add_edge("chat_node", END)
#         except:
#             print("Error in the define_nodes function ")
#
#
#     async def run(self, query: str):
#
#         # Send immediate feedback
#         yield {"type": "status", "message": "Thinking..."}
#         
#         current_node = None
#
#         try:
#             async for event in self.workflow.astream_events(
#                 {"messages": [HumanMessage(query)]},
#                 config=config,
#                 version="v2"
#             ):
#                 kind = event["event"]
#                 name = event.get("name", "")
#
#                 # --- Chain start ---
#                 if kind == "on_chain_start":
#                     if name in self.graph.nodes:
#                         current_node = name
#                         if name not in ['chat_node', 'tool_selection']:
#                             yield {
#                                 "type": "step",
#                                 "name": name,
#                                 "message": "Processing your request…"
#                             }
#
#                 # --- Chain end ---
#                 elif kind == "on_chain_end":
#                     if name in self.graph.nodes:
#                         if name not in ['chat_node', 'tool_selection']:
#                             yield {
#                                 "type": "step",
#                                 "name": name,
#                                 "message": "Stpe completed"
#                             }
#                         if name == current_node:
#                             current_node = None
#
#                 # --- Tool start ---
#                 elif kind == "on_tool_start":
#                     yield {
#                         "type": "step",
#                         "name": name,
#                         "message": f"Gathering information…"
#                     }
#
#                 # --- Tool end ---
#                 elif kind == "on_tool_end":
#                     yield {
#                         "type": "step",
#                         "name": name,
#                         "message": "Done with that."
#                     }
#
#                 # --- Model tokens ---
#                 elif kind == "on_chat_model_stream":
#                     chunk = event["data"].get("chunk")
#                     if not isinstance(chunk, BaseMessage):
#                         continue
#                     
#                     if current_node == 'calendar_agent':
#                         if hasattr(chunk, "tool_call_chunks") and chunk.tool_call_chunks:
#                             yield {
#                                 "type": "thought",
#                                 "preview": "Thinking...",
#                                 "full": json.dumps(chunk.tool_call_chunks, indent=2),
#                             }
#                         if chunk.content:
#                             yield {"type": "chunk", "content": chunk.content}
#                             
#                     elif current_node == 'chat_node':
#                         if chunk.content:
#                             yield {"type": "chunk", "content": chunk.content}
#
#             # --- Completed ---
#             yield {"type": "done"}
#
#         except Exception as e:
#             yield {"type": "error", "message": str(e)}
