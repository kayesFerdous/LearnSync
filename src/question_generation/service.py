import asyncio
import random
from typing import List, Optional
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models

from src.core.config import settings
from src.core.logging_config import get_logger
from src.question_generation.schema import MCQRequest, MCQList

log = get_logger(__name__)


async def _fetch_context_from_qdrant(qdrant_client: AsyncQdrantClient, scope: MCQRequest) -> str:
    """
    Fetches relevant or random context chunks from Qdrant based on the scope.
    If scope.file_ids is provided, it tries to fetch a few chunks from EACH file to ensure broad coverage.
    """
    
    all_points = []
    
    try:
        if scope.file_ids:
            # Strategy: Fetch a small number of chunks from EACH file explicitly.
            # This ensures no file is left behind if the user selected multiple.
            limit_per_file = 3 # Adjust based on expected number of files. If 10 files, 30 chunks.
            
            for file_id in scope.file_ids:
                # Filter specifically for this file
                search_filter = models.Filter(
                    must=[
                        models.FieldCondition(key="metadata.document_id", match=models.MatchValue(value=file_id))
                    ]
                )
                
                scroll_result = await qdrant_client.scroll(
                    collection_name=settings.QDRANT_COLLECTION_NAME,
                    scroll_filter=search_filter,
                    limit=limit_per_file, 
                    with_payload=True,
                    with_vectors=False
                )
                
                points = scroll_result[0]
                if points:
                    # Randomly pick from this file if we got the start of the file or just take the top ones (scroll is ordered usually by ID unless shuffled?)
                    # Scroll usually returns in point ID order. 
                    # To get "random" parts, we'd need random access or vector search.
                    # For now, just taking the first few is acceptable, or we could scroll with random offset if we knew count.
                    # Qdrant scroll offset is UUID based, harder to skip.
                    # Let's just take what we get.
                    all_points.extend(points)
                    
        else:
            # Folder or Conversation or Global (if none)
            filter_conditions = []
            if scope.folder_id:
                 filter_conditions.append(
                    models.FieldCondition(key="metadata.folder_id", match=models.MatchValue(value=scope.folder_id))
                )
            if scope.conversation_id:
                 filter_conditions.append(
                    models.FieldCondition(key="metadata.conversation_id", match=models.MatchValue(value=scope.conversation_id))
                )
            
            search_filter = None
            if filter_conditions:
                # If strictly single folder OR conversation, 'should' or 'must' doesn't matter much if one item.
                # If both provided by mistake/intent, 'must' implies intersection. Let's start with 'must'.
                search_filter = models.Filter(must=filter_conditions)

            limit = 20
            
            scroll_result = await qdrant_client.scroll(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                scroll_filter=search_filter,
                limit=limit,
                with_payload=True,
                with_vectors=False
            )
            all_points.extend(scroll_result[0])

        if not all_points:
            log.warning("No context found in Qdrant for the given scope.")
            return ""

        # Shuffle accumulated points to mix content from different files
        random.shuffle(all_points)
        
        # Limit total context size (e.g., 20 chunks max to fit in context window)
        selected_points = all_points[:scope.amount] 
        
        context_text = ""
        for point in selected_points:
            payload = point.payload or {}
            content = payload.get("page_content", "")
            if not content:
                content = payload.get("text", "") 
                
            context_text += f"---\nReference ID: {point.id}\n{content}\n"
            
        return context_text

    except Exception as e:
        log.error(f"Error fetching from Qdrant: {e}", exc_info=True)
        return ""


async def generate_questions(llm: BaseChatModel, qdrant_client: AsyncQdrantClient, request: MCQRequest) -> MCQList:
    context = await _fetch_context_from_qdrant(qdrant_client, request)
    
    if not context:
        log.warning("No context available to generate questions.")
        return MCQList(questions=[])

    structured_llm = llm.with_structured_output(MCQList)

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", "You are an expert educator. Generate multiple-choice questions based ONLY on the provided text context."),
        ("human", """
Generate {amount} multiple-choice questions at '{hardness}' difficulty level.
Each question must have exactly 4 options.
Provide the correct answer(s) as integer indices (1-based: 1, 2, 3, 4).
Include a brief explanation and an EXACT quote from the text as 'reference_text'.
Also include the 'Reference ID' from the context that provided the answer.

Context:
{context}
        """)
    ])
    
    chain = prompt_template | structured_llm
    
    try:
        result = await chain.ainvoke({
            "amount": request.amount, 
            "hardness": request.hardness, 
            "context": context
        })
        log.info(f"Generated {len(result.questions)} MCQs.")
        return result # type: ignore
    except Exception as e:
        log.error(f"Error generating MCQs: {e}", exc_info=True)
        raise
