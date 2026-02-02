from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, model_validator

class CalendarTime(BaseModel):
    """Start/End time using either a specific 'dateTime' or an all-day 'date'."""
    dateTime: Optional[datetime] = None
    date: Optional[str] = None
    timeZone: Optional[str] = "Asia/Dhaka"

class CalendarUser(BaseModel):
    """Basic identification for a person (creator, organizer, or attendee)."""
    email: Optional[str] = None
    displayName: Optional[str] = None
    self: Optional[bool] = None

class ReminderOverride(BaseModel):
    """Specific reminder method and time."""
    method: str = "popup"  # "email" or "popup"
    minutes: int = 0

class EventReminders(BaseModel):
    """Reminders settings for an event."""
    useDefault: bool = True
    overrides: Optional[List[ReminderOverride]] = None

    @model_validator(mode='after')
    def check_reminders(self) -> 'EventReminders':
        if self.overrides and len(self.overrides) > 0:
            self.useDefault = False
        return self

class Event(BaseModel):
    """Full representation of a Google Calendar event as returned by the API."""
    id: Optional[str] = None
    status: Optional[str] = None
    htmlLink: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    creator: Optional[CalendarUser] = None
    organizer: Optional[CalendarUser] = None
    start: Optional[CalendarTime] = None
    end: Optional[CalendarTime] = None
    reminders: Optional[EventReminders] = None
    recurrence: Optional[List[str]] = None
    
    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    """Required fields for creating a new calendar event."""
    summary: str
    description: Optional[str] = None
    location: Optional[str] = None
    start: CalendarTime
    end: CalendarTime
    attendees: Optional[List[Dict[str, str]]] = None
    reminders: Optional[EventReminders] = None
    recurrence: Optional[List[str]] = None

    @model_validator(mode='after')
    def validate_recurrence(self) -> 'EventCreate':
        if self.recurrence:
            for rule in self.recurrence:
                if not (rule.startswith("RRULE:") or rule.startswith("RDATE:")):
                    raise ValueError(f"Recurrence rule must start with 'RRULE:' or 'RDATE:'. Got: {rule}")
        return self

class EventUpdate(BaseModel):
    """Fields for updating an existing calendar event."""
    summary: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start: Optional[CalendarTime] = None
    end: Optional[CalendarTime] = None
    attendees: Optional[List[Dict[str, str]]] = None
    reminders: Optional[EventReminders] = None
    recurrence: Optional[List[str]] = None

    @model_validator(mode='after')
    def validate_recurrence(self) -> 'EventUpdate':
        if self.recurrence:
            for rule in self.recurrence:
                if not (rule.startswith("RRULE:") or rule.startswith("RDATE:")):
                    raise ValueError(f"Recurrence rule must start with 'RRULE:' or 'RDATE:'. Got: {rule}")
        return self

class EventList(BaseModel):
    """A collection of Event objects."""
    events: List[Event]

class EventRequest(BaseModel):
    """Filter and search parameters for listing calendar events."""
    min_datetime: Optional[datetime] = None
    max_datetime: Optional[datetime] = None
    query: Optional[str] = None
    max_results: int = 20
    single_events: bool = True
    show_deleted: bool = False
    order_by: str = "startTime"

class EventDelete(BaseModel):
    """Identifier for an event to be removed from a specific calendar."""
    calendar_id: str = "primary"
    event_id: str
