from fastapi import APIRouter, Depends, Query, Path, status

from src.api.dependencies import get_calendar_client
from src.calendar.google_client import GoogleCalendarClient
from src.calendar import EventList, EventRequest, EventCreate, EventUpdate, Event

router = APIRouter(
    prefix="/calendar",
    tags=["Calendar"]
)

@router.get("", response_model=EventList)
async def list_events(
    request: EventRequest = Depends(),
    calendar_id: str = Query("primary", description="Calendar ID to list events from"),
    client: GoogleCalendarClient = Depends(get_calendar_client)
) -> EventList:
    """
    List events from the specified calendar.
    """
    events = await client.list_events(
        calendar_id=calendar_id,
        time_min=request.min_datetime,
        time_max=request.max_datetime,
        max_results=request.max_results,
        single_events=request.single_events,
        order_by=request.order_by,
        query=request.query
    )
    return EventList(events=events)


@router.post("", response_model=Event, status_code=status.HTTP_201_CREATED)
async def create_event(
    body: EventCreate,
    calendar_id: str = Query("primary", description="Calendar ID to create the event in"),
    client: GoogleCalendarClient = Depends(get_calendar_client)
) -> Event:
    """
    Create a new event in the specified calendar.
    """
    return await client.create_event(event_data=body, calendar_id=calendar_id)


@router.get("/{event_id}", response_model=Event)
async def get_event(
    event_id: str = Path(..., description="The ID of the event to retrieve"),
    calendar_id: str = Query("primary", description="Calendar ID where the event is located"),
    client: GoogleCalendarClient = Depends(get_calendar_client)
) -> Event:
    """
    Retrieve a specific event by ID.
    """
    return await client.get_event(event_id=event_id, calendar_id=calendar_id)


@router.put("/{event_id}", response_model=Event)
async def update_event(
    body: EventUpdate,
    event_id: str = Path(..., description="The ID of the event to update"),
    calendar_id: str = Query("primary", description="Calendar ID where the event is located"),
    client: GoogleCalendarClient = Depends(get_calendar_client)
) -> Event:
    """
    Update an existing event.
    """
    return await client.update_event(
        event_id=event_id,
        event_data=body,
        calendar_id=calendar_id
    )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str = Path(..., description="The ID of the event to delete"),
    calendar_id: str = Query("primary", description="Calendar ID where the event is located"),
    client: GoogleCalendarClient = Depends(get_calendar_client)
):
    """
    Delete an event by ID.
    """
    await client.delete_event(event_id=event_id, calendar_id=calendar_id)
