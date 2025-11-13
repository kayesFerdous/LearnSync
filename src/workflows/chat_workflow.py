from langchain_core.prompts import PromptTemplate
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
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
    message: str
    tool: str
    agent_response: str


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
            question = state['messages'][-1].content
            history_messages = state['messages'][:-1]

            chat_history = "\n".join([f"{'Human' if isinstance(chat, HumanMessage) else 'Ai'}: {chat.content}" for chat in history_messages])
            # print(f"pre messages: \n{history_messages}")

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

            # selection_prompt = await PromptTemplate(
            #     template=SELECTION_PROMPT_WITH_HISTORY,
            #     input_variables=["chat_history", "question"]
            # ).ainvoke({"chat_history": chat_history, "question": question})
            # print(f"\n\n in the tool_selection node the messages are: \n{state['messages']}\n\n")
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
            response = await self.llm_model.ainvoke(f"system: answers should be short\n {messages[-6:]}")
            print(f"\n\n\nLLM response: \n{response.content}\n\n\n")
            return {'message': response.content}
        except Exception as e:
            print(f"Error while calling the chat_node: {str(e)}")
            error_response = AIMessage(content="Sorry, I encountered an error.")
            return {'messages': [error_response], 'agent_response': error_response.content}

    async def test_node(self, state:ChatState):
        try:
            # print(f"\n\ncurrent last message: \n{state['messages'][-1].content}\n\n")
            return {"agent_response": state["agent_response"]}
        except Exception as e:
            print("\nerror in teh test node ", str(e))
            return {'agent_response': 'Error occurred'}


    def define_nodes(self):
        try:
            self.graph.add_node("chat_node", self.chat_node)
            self.graph.add_node("calendar_agent", calendar_agent)
            self.graph.add_node("tool_selection", self.tool_selection)
            # self.graph.add_node("test_node", self.test_node)

            self.graph.add_edge(START, "tool_selection")
            self.graph.add_conditional_edges("tool_selection", self.tool_needed)

            # self.graph.add_edge("calendar_agent", "test_node")
            self.graph.add_edge("calendar_agent", END)

            # self.graph.add_edge("test_node", END)
            self.graph.add_edge("chat_node", END)
        except:
            print("Error in the define_nodes function ")


    async def run(self, query: str):
        try: 
            full_content = ""
            final_node = None
            
            async for chunk, metadata in self.workflow.astream(
                {"messages": [HumanMessage(query)],"message":"" ,"tool": "", "agent_response": ""}, 
                stream_mode='messages', 
                config=config
            ):
                if chunk.content:
                    full_content += chunk.content
                    yield {"type": "chunk", "content": chunk.content}
                
                # Track which node we're in
                if metadata:
                    final_node = metadata.get('langgraph_node')
            
            print(f"\n\nfull content: \n{full_content}\n")
            
            # After streaming completes, update the state with the AI message
            if full_content:
                await self.workflow.aupdate_state(
                    config=config,
                    values={"messages": [AIMessage(content=full_content)]},
                    as_node=final_node  # Update as the node that generated the response
                )
                print("✓ State updated with AI message")

        except Exception as e:
            print(f"\nError while streaming the response: {e}")


    # async def run(self, query:str):
    #     try: 
    #         full_content = ""
    #         async for chunk, _ in self.workflow.astream(
    #             {"messages":[HumanMessage(query)], "tool":"", "agent_response":""}, stream_mode='messages', config=config
    #         ):
    #             if chunk.content:
    #                 full_content += chunk.content
    #                 # print(chunk)
    #                 yield {"type": "chunk", "content": chunk.content}
    #         print(f"\n\nfull content: \n{full_content} \n\n")
    #
    #         # if full_content:
    #         #     await self.workflow.update_state(
    #         #         config=config,
    #         #         values={"messages": [AIMessage(content=full_content)]}
    #         #     )
    #
    #     except Exception as e:
    #         print(f"\nError while streaming the response: {e}")

    # async def run(self, query: str):
    #     try: 
    #         # full_content = ""
    #         async for event in self.workflow.astream(
    #             {"messages": [HumanMessage(query)], "tool": "", "agent_response": ""}, 
    #             stream_mode='values',  # Changed to 'values' to get full state updates
    #             config=config
    #         ):
    #             # Only yield the final agent_response after the run completes
    #             if 'agent_response' in event and event['agent_response']:
    #                 full_content = event['agent_response']
    #                 yield {"type": "chunk", "content": full_content}
    #
    #         # print("\n\n full content: \n", full_content)
    #
    #     except Exception as e:
    #         print(f"\nError while streaming the response: {e}")




#
    # async def _get_history(self) -> str:
    #     """ Returns the copy of the histroy list """
    #     return "\n".join([chat for chat in self.history])
    #
    # async def _update_histroy(self, human_msg:str, ai_msg:str):
    #     """ If the history list is higher than the max history,
    #         then delete 2 previous history items """
    #
    #     if len(self.history) > self.max_history:
    #         del self.history[:2]
    #
    #     self.history.extend([f"HUMAN: {human_msg}", f"AI: {ai_msg}"])


    # async def _tool_selection(self, state: ChatState):
    #     try:
    #         tool_selection_model = self.llm_model.with_structured_output(ToolSelection)
    #         human_msg = state["human_msg"]
    #         response = await tool_selection_model.ainvoke(
    #             f"for the follwing query return 'web_search' or 'no_tool' - {human_msg}"
    #         )
    #         print(response)
    #         state['tool'] = response.tool
    #         return state
    #     except:
    #         print("\nError while calling _tool_selection")
    #
    # async def _tool_needed(self, state: ChatState) -> Literal["web_search", "no_tool"]:
    #     tool = state['tool']
    #     if tool == "web_search":
    #         return "web_search"
    #     return "no_tool"


    # async def _chat_node(self, state: ChatState):
    #     history = await self._get_history()
    #     human_msg = state["human_msg"]
    #     
    #     message = await self.prompt_template.ainvoke({
    #         "chat_history": history,
    #         # "context": state["retrieved_msg"],
    #         "question": human_msg
    #
    #     })
    #     
    #     try:
    #         llm_response = self.llm_model.invoke(message)
    #         ai_msg = str(llm_response.content)
    #         state['ai_msg'] = ai_msg
    #         await self._update_histroy(human_msg, ai_msg)
    #         return state
    #     except:
    #         print("\nError while getting response from the llm")
