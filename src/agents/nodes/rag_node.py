from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.language_models.chat_models import BaseChatModel

from src.agents.model import AgentState
from src.rag.retrieval import retrieve_documents
import logging

logger = logging.getLogger(__name__)

def make_rag_node(llm: BaseChatModel):
    async def rag_node(state: AgentState):
        try:
            messages = state["messages"]
            user_query = messages[-1].content

            filter_conditions = [{"key": "user_id", "match": {"value": state["user_id"]}}]
            
            if state["metadata"].get("folder_id"):
                filter_conditions.append(
                    {"key": "folder_id", "match": {"value": state["metadata"]["folder_id"]}}
                )

            else:
                filter_conditions.append(
                    {"key": "conversation_id", "match": {"value": state["metadata"]["conversation_id"]}}
                )
            

            docs = await retrieve_documents(
                query=user_query,
                k=5,
                filter_metadata={"must": filter_conditions},
            )

            context = "\n\n---\n\n".join(doc.page_content for doc in docs)

            system_prompt = f"""You are a helpful AI assistant. Answer the user's question based on the following context.
If the context doesn't contain the answer, say you don't know.

Context:
{context}"""

            prompt_messages = [SystemMessage(content=system_prompt), messages[-1]] 

            response = await llm.ainvoke(prompt_messages)

            return {"messages": [AIMessage(content=response.content)]}

        except Exception as e:
            logger.error(f"Error in rag_node: {e}")
            return {
                "messages": [
                    AIMessage(content="Sorry, I encountered an error while searching.")
                ]
            }

    return rag_node
