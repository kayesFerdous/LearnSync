from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class ClassSessionBase(BaseModel):
    day: str = Field(description="The day of the week")
    start_time: datetime = Field(description="Start time of the class")
    end_time: datetime = Field(description="End time of the class")
    course_name: str = Field(description="Name of the course")
    recurrence: Optional[List[str]] = Field(default=None, description="Recurrence rules")

class ClassSessionCreate(ClassSessionBase):
    pass

class ClassSessionUpdate(BaseModel):
    day: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    course_name: Optional[str] = None
    recurrence: Optional[List[str]] = None

class ClassSessionResponse(ClassSessionBase):
    id: UUID
    routine_id: UUID

    class Config:
        from_attributes = True

class RoutineBase(BaseModel):
    title: str = Field(default="Weekly Class Schedule")

class RoutineCreate(RoutineBase):
    classes: List[ClassSessionCreate]

class RoutineResponse(RoutineBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    classes: List[ClassSessionResponse] = []

    class Config:
        from_attributes = True
