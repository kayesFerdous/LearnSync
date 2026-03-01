"""
Response schemas for mindmap generation endpoints.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any
from pydantic import BaseModel, Field


class MindmapNodeResponse(BaseModel):
    """
    API response representation of a mindmap node.
    
    This is the external-facing version of the MindmapNode from the service layer.
    """
    title: str = Field(description="Title of the mindmap node")
    description: str = Field(description="Brief description or summary of this node")
    children: List["MindmapNodeResponse"] = Field(
        default_factory=list,
        description="Child nodes in the hierarchy"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata (e.g., file_id, doc_type, topics)"
    )


class MindmapResponse(BaseModel):
    """
    Root response wrapper for mindmap generation.
    
    Includes the mindmap structure along with metadata about the generation.
    """
    root: MindmapNodeResponse = Field(description="Root node of the mindmap")
    total_files: int = Field(description="Total number of files processed")
    generated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when the mindmap was generated"
    )
    context: str = Field(description="Context information (folder name or conversation title)")


class MindmapCreateRequest(BaseModel):
    """
    Request body for creating a mindmap.
    
    Allows specifying a subset of files to include in the mindmap.
    """
    file_ids: List[str] = Field(
        default_factory=list,
        description="Optional list of file UUIDs to include. If empty, all files in the context will be used."
    )
