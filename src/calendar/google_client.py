import asyncio
from typing import Any, Dict, List, Optional, Union, Sequence
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
            def _do_list():
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

            return await asyncio.to_thread(_do_list)
        except Exception as e:
            print(f"Error listing events: {e}")
            raise e

    async def create_event(self, event_data: Union[EventCreate, Dict[str, Any]], calendar_id: str = 'primary') -> Event:
        """
        Creates a new event in the specified calendar.
        """
        try:
            def _do_create():
                if isinstance(event_data, (EventCreate, BaseModel)):
                    body = event_data.model_dump(exclude_none=True, mode='json')
                else:
                    body = event_data

                event = self.service.events().insert(
                    calendarId=calendar_id,
                    body=body
                ).execute()
                return Event.model_validate(event)

            return await asyncio.to_thread(_do_create)
        except Exception as e:
            print(f"Error creating event: {e}")
            raise e

    async def batch_create_events(self, events_data: Sequence[Union[EventCreate, Dict[str, Any]]], calendar_id: str = 'primary') -> List[Optional[Event]]:
        """
        Creates multiple events in a batch request and returns the created events.
        """
        try:
            def _do_batch():
                batch = self.service.new_batch_http_request()
                created_events: List[Optional[Event]] = [None] * len(events_data)
                
                def callback(request_id, response, exception):
                    if exception:
                        print(f"Error in batch item {request_id}: {exception}")
                    else:
                        # Request ID is usually "1", "2", etc. corresponding to order added?
                        # Actually googleapiclient might randomize IDs or use custom ones.
                        # It's safer to rely on order if we implement a custom callback closure or just append to a list
                        # BUT batch callbacks are async/threaded potentially? No, execute() is blocking.
                        # Let's rely on the fact that we can pass a unique callback for each item
                        pass

                # We need to map results back to the input order.
                # A closure for each item is the safest way.
                
                for i, event_data in enumerate(events_data):
                    if isinstance(event_data, (EventCreate, BaseModel)):
                        body = event_data.model_dump(exclude_none=True, mode='json')
                    else:
                        body = event_data
                    
                    def make_callback(index):
                        def _cb(request_id, response, exception):
                            if exception:
                                print(f"Error in batch item {index}: {exception}")
                            else:
                                created_events[index] = Event.model_validate(response)
                        return _cb
                        
                    batch.add(
                        self.service.events().insert(calendarId=calendar_id, body=body),
                        callback=make_callback(i)
                    )
                
                batch.execute()
                return created_events

            return await asyncio.to_thread(_do_batch)
        except Exception as e:
            print(f"Error in batch creation: {e}")
            raise e

    async def batch_delete_events(self, event_ids: List[str], calendar_id: str = 'primary') -> None:
        """
        Deletes multiple events in a batch request.
        """
        if not event_ids:
            return

        try:
            def _do_batch_delete():
                batch = self.service.new_batch_http_request()
                
                for event_id in event_ids:
                    def make_callback(eid):
                        def _cb(request_id, response, exception):
                            if exception:
                                print(f"Error deleting event {eid}: {exception}")
                        return _cb

                    batch.add(
                        self.service.events().delete(calendarId=calendar_id, eventId=event_id),
                        callback=make_callback(event_id)
                    )
                
                batch.execute()

            await asyncio.to_thread(_do_batch_delete)
        except Exception as e:
            print(f"Error in batch deletion: {e}")
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
            def _do_update():
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

            return await asyncio.to_thread(_do_update)
        except Exception as e:
            print(f"Error updating event: {e}")
            raise e

    async def delete_event(self, event_id: str, calendar_id: str = 'primary') -> None:
        """
        Deletes an event from the specified calendar.
        """
        try:
            def _do_delete():
                self.service.events().delete(
                    calendarId=calendar_id,
                    eventId=event_id
                ).execute()

            await asyncio.to_thread(_do_delete)
        except Exception as e:
            print(f"Error deleting event: {e}")
            raise e

    async def get_event(self, event_id: str, calendar_id: str = 'primary') -> Event:
        """
        Retrieves a specific event.
        """
        try:
            def _do_get():
                event = self.service.events().get(
                    calendarId=calendar_id,
                    eventId=event_id
                ).execute()
                return Event.model_validate(event)

            return await asyncio.to_thread(_do_get)
        except Exception as e:
            print(f"Error getting event: {e}")
            raise e
