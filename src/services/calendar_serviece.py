import json
from src.schemas.calendar import EventDelete, EventRequest
from src.core.calendar_toolkit import get_tools

"""
create_calendar_event
search_events
update_calendar_event
get_calendars_info
move_calendar_event
delete_calendar_event
get_current_datetime
tools = get_tools()
"""

class CalendarsCustomTools():
    def __init__(self):
        self.tools = get_tools()

    async def get_caltendar_info(self):
        get_calendars = next(tool for tool in self.tools if tool.name == "get_calendars_info")
        return get_calendars.invoke({})
    
    async def get_events(self, request: EventRequest):
        try:
            search_events_tool = next(tool for tool in self.tools if tool.name == "search_events")
            
            input_dict = request.model_dump(exclude_none=True)
            
            # Convert datetimes to string format expected by the tool
            input_dict["min_datetime"] = input_dict["min_datetime"].strftime('%Y-%m-%d %H:%M:%S')
            input_dict["max_datetime"] = input_dict["max_datetime"].strftime('%Y-%m-%d %H:%M:%S')

            # Get calendar info
            calendars_info = await self.get_caltendar_info()
            input_dict["calendars_info"] = calendars_info

            events = search_events_tool.invoke(input_dict)
            return events
        except Exception as e:
            print(f"Error while getting the events: {str(e)}")

    async def delete_event(self, calendar_id:str, event_id: str):
        try: 
            delete_events_tool = next(tool for tool in self.tools if tool.name == "delete_calendar_event")
            response  = delete_events_tool.invoke({"calendar_id":calendar_id, "event_id": event_id})
            print(f"response after delte: {response}")
        except Exception as e:
            print(f"Error while deleting the event: {str(e)}")

    




calendar_tools = CalendarsCustomTools()
