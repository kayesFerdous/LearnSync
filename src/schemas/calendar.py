from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class Event(BaseModel):
    id: str
    htmlLink: str
    summary: str
    creator: str
    organizer: str
    start:datetime
    end: datetime

class EventList(BaseModel):
    event_list: list[Event]

class EventRequest(BaseModel):
    min_datetime: Optional[datetime]
    max_datetime: Optional[datetime]
    query: Optional[str] = None
    max_results: int = 20
    single_events: bool = True
    show_deleted: Optional[bool] = False
    order_by: str = "startTime"


class EventDelete(BaseModel):
    calendarId:str
    eventId:str


