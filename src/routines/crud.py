from typing import Optional, List
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.routines.models import Routine, ClassSession
from src.routines.schemas import RoutineCreate, ClassSessionCreate, ClassSessionUpdate

async def get_user_routine(db: AsyncSession, user_id: UUID) -> Optional[Routine]:
    result = await db.execute(
        select(Routine)
        .where(Routine.user_id == user_id)
        .options(selectinload(Routine.classes))
    )
    return result.scalars().first()

async def create_routine_db(db: AsyncSession, user_id: UUID, routine_data: RoutineCreate) -> Routine:
    # Assumes cleanup is done by caller
    new_routine = Routine(
        user_id=user_id,
        title=routine_data.title
    )
    db.add(new_routine)
    await db.flush()

    class_objects = [
        ClassSession(
            routine_id=new_routine.id,
            day=cls.day,
            start_time=cls.start_time,
            end_time=cls.end_time,
            course_name=cls.course_name,
            recurrence=cls.recurrence
        )
        for cls in routine_data.classes
    ]
    db.add_all(class_objects)
    await db.commit()
    await db.refresh(new_routine, attribute_names=["classes"])
    return new_routine

async def delete_routine_object(db: AsyncSession, routine: Routine):
    await db.delete(routine)
    await db.commit()

async def add_class_to_routine_db(db: AsyncSession, routine_id: UUID, class_data: ClassSessionCreate) -> ClassSession:
    new_class = ClassSession(
        routine_id=routine_id,
        day=class_data.day,
        start_time=class_data.start_time,
        end_time=class_data.end_time,
        course_name=class_data.course_name,
        recurrence=class_data.recurrence
    )
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)
    return new_class

async def get_class_session(db: AsyncSession, user_id: UUID, class_id: UUID) -> Optional[ClassSession]:
    stmt = (
        select(ClassSession)
        .join(Routine)
        .where(ClassSession.id == class_id)
        .where(Routine.user_id == user_id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()

async def delete_class_session_db(db: AsyncSession, class_session: ClassSession):
    await db.delete(class_session)
    await db.commit()

async def update_class_session_db(db: AsyncSession, class_session: ClassSession, update_data: ClassSessionUpdate) -> ClassSession:
    update_dict = update_data.model_dump(exclude_none=True)
    for key, value in update_dict.items():
        setattr(class_session, key, value)
        
    await db.commit()
    await db.refresh(class_session)
    return class_session