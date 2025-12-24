from typing import List
from pydantic import BaseModel
from pydantic.fields import Field

class ClassSession(BaseModel):
    day: str = Field(description="The day of the week (e.g., Saturday, Sunday, Monday)")
    time: str = Field(description="The time duration of the class (e.g., '08:30 AM - 10:00 AM')")
    course_name: str = Field(description="The name of the course or class (e.g., 'CSE-321', 'Physics')")

class WeeklyRoutine(BaseModel):
    title: str = Field(description="Title of the routine", default="Weekly Class Schedule")
    classes: List[ClassSession] = Field(description="List of all extracted classes/sessions")

