# from datetime import datetime, timedelta
# from typing import Optional
# from fastapi import APIRouter
#
# from src.services.calendar_service import calendar_tools
# from src.schemas.calendar import EventDelete, EventList, EventRequest
#
# router = APIRouter(
#     prefix="/api/calendar",
#     tags=["Calendar"]
# )
#
# @router.get("/events", response_model = Optional[EventList])
# async def get_events_for_a_week(
#     min_datetime: Optional[datetime] = None,
#     max_datetime: Optional[datetime] = None,
#     query: Optional[str] = "",
#     show_deleted: Optional[bool] = False,
#     max_results: int = 20,
#     single_events: bool = True,
#     order_by: str = "startTime"
# ):
#     try:
#         if not min_datetime and not max_datetime:
#             time_dict = {
#                 "Sat": 0,
#                 "Sun": 1,
#                 "Mon": 2,
#                 "Tue": 3,
#                 "Wed": 4,
#                 "Thu": 5,
#                 "Fri": 6
#             }
#
#             now = datetime.now() 
#             need_to_minus = time_dict[now.strftime("%a")]
#
#             min_datetime = now - timedelta(days=need_to_minus)
#             max_datetime = min_datetime + timedelta(days=need_to_minus)
#
#         event_request = EventRequest(
#             min_datetime=min_datetime,
#             max_datetime=max_datetime,
#             query=query,
#             show_deleted=show_deleted,
#             max_results=max_results,
#             single_events=single_events,
#             order_by=order_by
#         )
#
#         print("the requst format: ",event_request.min_datetime)
#
#         events = await calendar_tools.get_events(event_request)
#         return EventList(event_list=events)
#
#     except Exception as e:
#         print("Error while getting the events", str(e))
#
#
# @router.delete("/events/{calendar_id}/{event_id}")
# async def delete_event_by_event_id(calendar_id: str, event_id: str):
#     # print(request)
#     try:
#         await calendar_tools.delete_event(calendar_id, event_id)
#     except Exception as e:
#         print("delete event error: ", str(e))
#
