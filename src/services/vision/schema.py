from typing import List, Optional, Union
from datetime import datetime
from pydantic import BaseModel, field_validator
from pydantic.fields import Field

class TimeFormat(BaseModel):
    dateTime: Optional[datetime] = Field(default=None)

    @field_validator('dateTime', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        if isinstance(v, str):
            # If it's already a full ISO format, let it pass (pydantic handles it)
            # But "11:30 AM" or "14:00" needs help.
            
            formats = ["%I:%M %p", "%H:%M", "%I:%M%p"]
            
            for fmt in formats:
                try:
                    # Parse time string and combine with a default date (e.g., today)
                    t = datetime.strptime(v, fmt).time()
                    return datetime.combine(datetime.now().date(), t)
                except ValueError:
                    continue
            
            # If it fails our custom formats, return v and let Pydantic try its standard parsing
            # (or fail if it's invalid)
        return v

class ClassSession(BaseModel):
    day: str = Field(description="The day of the week (e.g., Saturday, Sunday, Monday)")
    start: TimeFormat = Field(description="The start time of the class")
    end: TimeFormat = Field(description="The end time of the class")
    course_name: str = Field(description="The name of the course or class (e.g., 'CSE-321', 'Physics')")

class WeeklyRoutine(BaseModel):
    title: str = Field(description="Title of the routine", default="Weekly Class Schedule")
    classes: List[ClassSession] = Field(description="List of all extracted classes/sessions")

