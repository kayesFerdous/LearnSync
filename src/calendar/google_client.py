from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from pydantic import BaseModel

from .schemas import Event, EventCreate, EventUpdate

class GoogleCalendarClient:
    """
    A wrapper class for Google Calendar API operations.
    Initialized with an authenticated Google Calendar service object.
    """
    def __init__(self, service: Any):
        self.service = service

    async def list_events(
        self, 
        calendar_id: str = 'primary', 
        time_min: Optional[datetime] = None, 
        time_max: Optional[datetime] = None, 
        max_results: int = 10,
        single_events: bool = True,
        order_by: str = 'startTime',
        query: Optional[str] = None
    ) -> List[Event]:
        """
        Lists events from the specified calendar.
        """
        try:
            time_min_str = None
            if time_min:
                time_min_str = time_min.isoformat()
                if time_min.tzinfo is None:
                    time_min_str += 'Z'

            time_max_str = None
            if time_max:
                time_max_str = time_max.isoformat()
                if time_max.tzinfo is None:
                    time_max_str += 'Z'
            
            # Build the request
            request = self.service.events().list(
                calendarId=calendar_id,
                timeMin=time_min_str,
                timeMax=time_max_str,
                maxResults=max_results,
                singleEvents=single_events,
                orderBy=order_by,
                q=query
            )
            
            events_result = request.execute()
            items = events_result.get('items', [])
            return [Event.model_validate(item) for item in items]
        except Exception as e:
            print(f"Error listing events: {e}")
            raise e

    async def create_event(self, event_data: Union[EventCreate, Dict[str, Any]], calendar_id: str = 'primary') -> Event:
        """
        Creates a new event in the specified calendar.
        """
        try:
            if isinstance(event_data, (EventCreate, BaseModel)):
                body = event_data.model_dump(exclude_none=True, mode='json')
            else:
                body = event_data

            event = self.service.events().insert(
                calendarId=calendar_id,
                body=body
            ).execute()
            return Event.model_validate(event)
        except Exception as e:
            print(f"Error creating event: {e}")
            raise e

    async def update_event(
        self, 
        event_id: str, 
        event_data: Union[EventUpdate, Dict[str, Any]], 
        calendar_id: str = 'primary'
    ) -> Event:
        """
        Updates an existing event.
        """
        try:
            if isinstance(event_data, (EventUpdate, BaseModel)):
                 body = event_data.model_dump(exclude_none=True, mode='json')
            else:
                body = event_data

            event = self.service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=body
            ).execute()
            return Event.model_validate(event)
        except Exception as e:
            print(f"Error updating event: {e}")
            raise e

    async def delete_event(self, event_id: str, calendar_id: str = 'primary') -> None:
        """
        Deletes an event from the specified calendar.
        """
        try:
            self.service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
        except Exception as e:
            print(f"Error deleting event: {e}")
            raise e

    async def get_event(self, event_id: str, calendar_id: str = 'primary') -> Event:
        """
        Retrieves a specific event.
        """
        try:
            event = self.service.events().get(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            return Event.model_validate(event)
        except Exception as e:
            print(f"Error getting event: {e}")
            raise e
