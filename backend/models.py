from pydantic import BaseModel, field_validator
from typing import Optional, List
import json


class LearningItem(BaseModel):
    id: str
    level: str          # A1/A2/B1/B2/C1/C2
    module_id: str      # A1-M1, A1-M2 ...
    type: str           # word/grammar/sentence/expression/template
    content: str        # 스페인어 원문
    meaning: str        # 한국어 뜻
    example_1: Optional[str] = None
    example_2: Optional[str] = None
    audio_url: Optional[str] = None
    tags: List[str] = []

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v


class LearningItemCreate(BaseModel):
    id: str
    level: str
    module_id: str
    type: str
    content: str
    meaning: str
    example_1: Optional[str] = None
    example_2: Optional[str] = None
    audio_url: Optional[str] = None
    tags: List[str] = []


class UserProgress(BaseModel):
    id: int
    user_id: str
    item_id: str
    stage: str          # study/retrieval/spacing/mastered
    interval_days: int
    ease_factor: float
    last_reviewed_at: Optional[str]
    next_review_at: Optional[str]
    success_rate: float


class StudyLogCreate(BaseModel):
    item_id: str
    action: str         # study/retrieval/speak
    result: str         # correct/wrong
    time_spent: Optional[int] = None


class StudyLog(StudyLogCreate):
    id: int
    user_id: str
    created_at: str


class RoutineCreate(BaseModel):
    learning_type: str
    hour: int
    minute: int = 0
    days_of_week: List[int] = [1, 2, 3, 4, 5, 6, 7]
    is_active: bool = True


class Routine(RoutineCreate):
    id: int
    user_id: str

    @field_validator("days_of_week", mode="before")
    @classmethod
    def parse_days(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v
