from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class MCQOption(BaseModel):
    id: int = Field(description="The unique integer ID for this option (e.g., 1, 2, 3, 4).")
    text: str = Field(description="The text content of the option.")

class MCQ(BaseModel):
    question: str = Field(description="The question to be posed.")
    options: List[MCQOption] = Field(description="A list of exactly 4 possible answer options.", min_length=4, max_length=4)
    answers: List[int] = Field(description="A list of integers representing the IDs of the correct option(s) in the 'options' list.")
    explanation: Optional[str] = Field(description="A brief explanation of why the answer is correct.")
    reference_text: Optional[str] = Field(description="Distilled text from the source document that supports the answer.")
    reference_id: Optional[str] = Field(description="The ID of the source document or chunk.")

class MCQList(BaseModel):
    questions: List[MCQ] = Field(description="A list of generated questions.")

class MCQRequest(BaseModel):
    amount: int = Field(5, description="Number of questions to generate.")
    hardness: Literal["Easy", "Medium", "Hard"] = Field("Medium", description="Difficulty level of the questions.")
    file_ids: Optional[List[str]] = Field(None, description="List of file IDs to generate questions from.")
    folder_id: Optional[str] = Field(None, description="Folder ID to generate questions from.")
    conversation_id: Optional[str] = Field(None, description="Conversation ID to generate questions from.")
