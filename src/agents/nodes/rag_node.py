from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
from langchain_core.language_models.chat_models import BaseChatModel
from qdrant_client.models import Filter, FieldCondition, MatchValue

from src.agents.model import AgentState
from src.rag.retrieval import retrieve_documents
import logging

logger = logging.getLogger(__name__)


async def rewrite_query(messages, llm: BaseChatModel) -> str:
    """
    Rewrite the user's query to be more suitable for semantic search.
    """
    if len(messages) <= 1:
        return messages[-1].content


    recent_history = messages[-3:]

    system_prompt = """You are an expert at rewriting user queries for semantic search.
    Your goal is to expand the query with relevant keywords and context
    to improve retrieval accuracy.
    
    Instructions:
    1. Identify the core intent of the query
    2. Add relevant keywords and synonyms
    3. Keep the query concise (max 20 words)
    4. Do NOT answer the question, only rewrite it
    5. Return ONLY the rewritten query, nothing else
    """
    
    prompt_messages = [SystemMessage(content=system_prompt)] + recent_history
    
    response = await llm.ainvoke(prompt_messages)
    return response.content.strip()


def make_rag_node(llm: BaseChatModel, rewrite_query_llm: BaseChatModel):
    async def rag_node(state: AgentState):
        try:
            messages = state["messages"]
            user_query = await rewrite_query(messages, rewrite_query_llm)
            logger.info(f"\n\nRag Node Rewritten Query: {user_query}")

            filter_conditions = [
                FieldCondition(key="metadata.user_id", match=MatchValue(value=state["user_id"]))
            ]
            
            if state["metadata"].get("folder_id"):
                filter_conditions.append(
                    FieldCondition(key="metadata.folder_id", match=MatchValue(value=state["metadata"]["folder_id"]))
                )

            else:
                filter_conditions.append(
                    FieldCondition(key="metadata.conversation_id", match=MatchValue(value=state["metadata"]["conversation_id"]))
                )

            docs = await retrieve_documents(
                query=user_query,
                k=5,
                filter_metadata=Filter(must=filter_conditions),
            )

            context = "\n\n---\n\n".join(doc.page_content for doc in docs)

            system_prompt = f"""You are a helpful AI assistant. Answer the user's question based on the following context.
If the context doesn't contain the answer, say you don't know.

Context:
{context}"""

            # Use the rewritten query (user_query) instead of the raw message to ensure 
            # the model understands the FULL intent (e.g. "Tell me more about ML" vs "Tell me more")
            prompt_messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_query)] 
            logger.info(f"\n\nRag Node Prompt messages: {prompt_messages}")

            response = await llm.ainvoke(prompt_messages)
            logger.info(f"\n\nRag Node Response: {response}")

            return {"messages": [AIMessage(content=response.content)]}

        except Exception as e:
            logger.error(f"Error in rag_node: {e}")
            return {
                "messages": [
                    AIMessage(content="Sorry, I encountered an error while searching.")
                ]
            }

    return rag_node
