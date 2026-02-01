from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langgraph.types import interrupt
from sqlalchemy.ext.asyncio.session import AsyncSession

from src.services.vision.schema import WeeklyRoutine, ApprovedWeeklyRoutine
from src.services.vision.models import ClassSession, Routine
from src.agents.model import AgentState
from src.core.integrations.google.calendar_service import sync_routine_to_google_calendar
from src.core.integrations.google.auth_utils import get_service_and_timezone


def make_routine_approval_node():
    async def routine_approval_node(state: AgentState, config: RunnableConfig):
        """
        Extract routine and interrupt for human approval
        """
        extracted_routine = state['scratchpad'].get('extracted_routine')
        print("\n\nextracted routine:\n", extracted_routine)

        user_dicision = interrupt({
            "type": "routine_approval_required",
            "extracted_data": extracted_routine,
        })

        print(f'\nuser decision: {user_dicision}\n')

        messages = []

        if isinstance(user_dicision, dict) and user_dicision.get('approved'):
            db: AsyncSession = config["configurable"]["db"] #type: ignore
            user_id = state['user_id']

            approved_routine = ApprovedWeeklyRoutine.model_validate(user_dicision.get("data")) 
            # Create and add the parent Routine first
            new_routine = Routine(title=approved_routine.title, user_id=user_id)
            db.add(new_routine)
            await db.flush() # Generates the ID for new_routine

            all_classes: list[ClassSession] = []
            for single_class in approved_routine.classes:
                new_class = ClassSession(
                    day=single_class.day, 
                    start_time=single_class.start.dateTime,
                    end_time=single_class.end.dateTime,
                    course_name=single_class.course_name,
                    routine_id=new_routine.id,
                    recurrence=single_class.recurrence
                )
                all_classes.append(new_class)
            
            db.add_all(all_classes)
            await db.commit()
            
            # Sync to Google Calendar
            try:
                service, timezone = await get_service_and_timezone(user_id, db)
                if service:
                    await sync_routine_to_google_calendar(service, approved_routine, timezone)
                    print(f"Successfully synced routine to Google Calendar for user {user_id}")
                else:
                    print(f"Skipping Google Calendar sync: No service found for user {user_id}")
            except Exception as e:
                print(f"Failed to sync routine to Google Calendar: {e}")

            # Construct routine data to embed in message
            routine_data = {
                "title": approved_routine.title,
                "classes": [
                    {
                        "day": c.day, 
                        "start": c.start_time.isoformat() if c.start_time else None, 
                        "end": c.end_time.isoformat() if c.end_time else None, 
                        "course": c.course_name
                    } 
                    for c in all_classes
                ]
            }

            # Embed routine data in the message using additional_kwargs
            messages.append(AIMessage(
                content="The routine has been approved, saved to the database, and synced to Google Calendar.",
                additional_kwargs={
                    "routine_approved": True,
                    "routine_data": routine_data
                }
            ))

        else:
            messages.append(SystemMessage(content="The routine has been rejected."))

        return {"messages": messages}

    return routine_approval_node
