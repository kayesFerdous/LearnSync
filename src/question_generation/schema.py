from datetime import datetime
from typing import Dict, List
from pydantic import BaseModel, Field


class Option(BaseModel):
    id: int = Field(description="The unique integer ID for this option (e.g., 1, 2, 3, 4).")
    text: str = Field(description="The text content of the option.")


class Question(BaseModel):
    question: str = Field(description="The question to be posed.")
    options: List[Option] = Field(description="A list of exactly 4 possible answer options.", min_length=4, max_length=4)
    answers: List[int] = Field(description="A list of integers representing the IDs of the correct option(s) in the 'options' list.")

class QuestionList(BaseModel):
    questions: List[Question] = Field(description="A list of generated questions.")

class QuestionSet(BaseModel):
    owner: str
    shared: List[str]
    created: datetime
    questions: QuestionList


    
