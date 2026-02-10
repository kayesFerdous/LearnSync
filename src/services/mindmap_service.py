"""
Mindmap generation service for folders and conversations.

This module provides functions to generate hierarchical mindmaps from file metadata
using LLM-based analysis with structured output.
"""

import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from langchain_core.language_models.chat_models import BaseChatModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.conversations.model import File, Folder, Conversation

logger = logging.getLogger(__name__)


class MindmapNode(BaseModel):
    """
    Represents a node in a hierarchical mindmap structure.
    
    Each node can have a title, description, optional children,
    and metadata for additional information.
    """
    title: str = Field(description="Title of the mindmap node")
    description: str = Field(description="Brief description or summary of this node")
    children: List["MindmapNode"] = Field(
        default_factory=list,
        description="Child nodes in the hierarchy"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata (e.g., file_id, doc_type, topics)"
    )


class MindmapGenerationInput(BaseModel):
    """Input format for LLM to understand the files being processed."""
    files: List[Dict[str, Any]] = Field(description="List of file metadata")
    context: str = Field(description="Context about what these files represent (folder name, conversation title, etc.)")


async def _fetch_folder_files(
    db: AsyncSession,
    folder_id: UUID,
    user_id: UUID
) -> tuple[List[File], Optional[Folder]]:
    """
    Fetch all files belonging to a folder and verify ownership.
    
    Args:
        db: Database session
        folder_id: UUID of the folder
        user_id: UUID of the user making the request
        
    Returns:
        Tuple of (list of files, folder object) or ([], None) if not found
    """
    # Verify folder ownership
    folder_stmt = select(Folder).where(
        Folder.id == folder_id,
        Folder.user_id == user_id
    )
    folder_result = await db.execute(folder_stmt)
    folder = folder_result.scalar_one_or_none()
    
    if not folder:
        return [], None
    
    # Fetch all files in the folder
    files_stmt = select(File).where(
        File.folder_id == folder_id
    ).order_by(File.created_at.asc())
    
    files_result = await db.execute(files_stmt)
    files = files_result.scalars().all()
    
    return list(files), folder


async def _fetch_conversation_files(
    db: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
) -> tuple[List[File], Optional[Conversation]]:
    """
    Fetch all files belonging to a conversation and verify ownership.
    
    Args:
        db: Database session
        conversation_id: UUID of the conversation
        user_id: UUID of the user making the request
        
    Returns:
        Tuple of (list of files, conversation object) or ([], None) if not found
    """
    # Verify conversation ownership
    conv_stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    )
    conv_result = await db.execute(conv_stmt)
    conversation = conv_result.scalar_one_or_none()
    
    if not conversation:
        return [], None
    
    # Fetch all files in the conversation
    files_stmt = select(File).where(
        File.conversation_id == conversation_id
    ).order_by(File.created_at.asc())
    
    files_result = await db.execute(files_stmt)
    files = files_result.scalars().all()
    
    return list(files), conversation


def _prepare_file_data(files: List[File]) -> List[Dict[str, Any]]:
    """
    Prepare file data for LLM processing.
    
    Args:
        files: List of File objects
        
    Returns:
        List of dictionaries with file metadata
    """
    file_data = []
    for file in files:
        file_data.append({
            "id": str(file.id),
            "filename": file.filename,
            "doc_type": file.doc_type or "Unknown",
            "summary": file.summary or "No summary available",
            "topics": file.topics or [],
            "file_type": file.file_type.value if file.file_type else "unknown"
        })
    
    return file_data


async def _generate_mindmap_with_llm(
    files_data: List[Dict[str, Any]],
    context: str,
    llm: BaseChatModel
) -> MindmapNode:
    """
    Generate a mindmap structure using LLM with structured output.
    
    Args:
        files_data: List of file metadata dictionaries
        context: Context string (folder name, conversation title)
        llm: LLM instance to use for generation
        
    Returns:
        Root MindmapNode with hierarchical structure
    """
    if not files_data:
        # Return empty mindmap for no files
        return MindmapNode(
            title=context or "Empty Collection",
            description="No files have been added yet.",
            children=[],
            metadata={"file_count": 0}
        )
    
    # Use structured output for reliable parsing
    structured_llm = llm.with_structured_output(MindmapNode)
    
    # Prepare the prompt
    files_summary = "\n\n".join([
        f"File: {f['filename']}\n"
        f"Type: {f['doc_type']}\n"
        f"Topics: {', '.join(f['topics']) if f['topics'] else 'None'}\n"
        f"Summary: {f['summary'][:500]}..."  # Limit summary length
        for f in files_data
    ])
    
    prompt = f"""You are an expert at organizing academic materials into hierarchical mindmaps.

Context: {context}

Given the following files with their summaries, topics, and document types, create a comprehensive mindmap that shows:
1. Main themes/topics as top-level nodes
2. Related documents grouped under themes
3. Subtopics and concepts as child nodes
4. Logical relationships between materials

Files ({len(files_data)} total):

{files_summary}

Create a mindmap with a clear root node representing the overall subject area or collection.
Group related files under thematic parent nodes. Include the filename and key information in each node's metadata field.
Make the structure intuitive and easy to navigate."""

    try:
        logger.info(f"Generating mindmap for {len(files_data)} files with context: {context}")
        mindmap = await structured_llm.ainvoke(prompt)
        
        # Add file count to root metadata
        if isinstance(mindmap, MindmapNode):
            mindmap.metadata["file_count"] = len(files_data)
            return mindmap
        else:
            raise ValueError("LLM did not return a valid MindmapNode")
            
    except Exception as e:
        logger.error(f"Error generating mindmap with LLM: {e}", exc_info=True)
        # Return a simple fallback mindmap
        return MindmapNode(
            title=context or "Files Collection",
            description=f"Contains {len(files_data)} files. (Mindmap generation failed)",
            children=[
                MindmapNode(
                    title=f"{f['filename']}",
                    description=f"{f['doc_type']}: {f['summary'][:200]}...",
                    metadata={"file_id": f["id"], "doc_type": f["doc_type"]}
                )
                for f in files_data[:10]  # Limit to first 10 files in fallback
            ],
            metadata={"file_count": len(files_data), "generation_error": str(e)}
        )


async def generate_folder_mindmap(
    db: AsyncSession,
    folder_id: UUID,
    user_id: UUID,
    llm: BaseChatModel
) -> Optional[MindmapNode]:
    """
    Generate a mindmap for all files in a folder.
    
    Args:
        db: Database session
        folder_id: UUID of the folder
        user_id: UUID of the user making the request
        llm: LLM instance for mindmap generation
        
    Returns:
        MindmapNode representing the folder's file structure, or None if folder not found
    """
    files, folder = await _fetch_folder_files(db, folder_id, user_id)
    
    if folder is None:
        return None
    
    files_data = _prepare_file_data(files)
    context = f"Folder: {folder.name}"
    
    mindmap = await _generate_mindmap_with_llm(files_data, context, llm)
    return mindmap


async def generate_conversation_mindmap(
    db: AsyncSession,
    conversation_id: UUID,
    user_id: UUID,
    llm: BaseChatModel
) -> Optional[MindmapNode]:
    """
    Generate a mindmap for all files in a conversation.
    
    Args:
        db: Database session
        conversation_id: UUID of the conversation
        user_id: UUID of the user making the request
        llm: LLM instance for mindmap generation
        
    Returns:
        MindmapNode representing the conversation's file structure, or None if conversation not found
    """
    files, conversation = await _fetch_conversation_files(db, conversation_id, user_id)
    
    if conversation is None:
        return None
    
    files_data = _prepare_file_data(files)
    context = f"Conversation: {conversation.title}"
    
    mindmap = await _generate_mindmap_with_llm(files_data, context, llm)
    return mindmap
