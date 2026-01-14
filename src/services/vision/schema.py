from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from pydantic.fields import Field

class TimeFormat(BaseModel):
    dateTime: Optional[datetime] = Field(default=None)

class ClassSession(BaseModel):
    day: str = Field(description="The day of the week (e.g., Saturday, Sunday, Monday)")
    start: TimeFormat = Field(description="The start time of the class")
    end: TimeFormat = Field(description="The end time of the class")
    course_name: str = Field(description="The name of the course or class (e.g., 'CSE-321', 'Physics')")

class WeeklyRoutine(BaseModel):
    title: str = Field(description="Title of the routine", default="Weekly Class Schedule")
    classes: List[ClassSession] = Field(description="List of all extracted classes/sessions")

