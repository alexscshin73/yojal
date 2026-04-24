from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional
import httpx
import os
from dotenv import load_dotenv
from prompts import SYSTEM_PROMPTS, LEARNING_TYPE_LABELS
from curriculum import get_level_prompt, CURRICULUM

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.3:latest")
NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "4096"))

LearningType = Literal[
    "greeting", "situational", "new_learning", "review", "mistake_review", "diary"
]


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    learning_type: LearningType
    history: Optional[list[Message]] = []
    level: Optional[int] = 1
    day: Optional[int] = 1


class ChatResponse(BaseModel):
    reply: str
    learning_type: str
    learning_type_label: str


app = FastAPI(title="Yojal API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def call_ollama(messages: list) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {"num_ctx": NUM_CTX, "num_gpu": 99, "num_predict": 600},
            },
        )
        response.raise_for_status()
        return response.json()["message"]["content"]


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/curriculum")
async def get_curriculum():
    return {
        level: {
            "title": data["title"],
            "grammar": data["grammar"],
        }
        for level, data in CURRICULUM.items()
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if req.learning_type == "new_learning":
        system_prompt = get_level_prompt(req.level or 1, req.day or 1)
    else:
        system_prompt = SYSTEM_PROMPTS[req.learning_type]

    recent_history = req.history[-10:] if req.history else []
    messages = [{"role": "system", "content": system_prompt}]
    for msg in recent_history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    try:
        reply = await call_ollama(messages)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Ollama 연결 실패: {str(e)}")

    return ChatResponse(
        reply=reply,
        learning_type=req.learning_type,
        learning_type_label=LEARNING_TYPE_LABELS[req.learning_type],
    )


@app.post("/chat/start")
async def chat_start(learning_type: LearningType, level: int = 1, day: int = 1):
    if learning_type == "new_learning":
        system_prompt = get_level_prompt(level, day)
        trigger = f"지금 바로 레벨 {level} 수업을 위의 형식대로 시작해주세요."
    else:
        system_prompt = SYSTEM_PROMPTS[learning_type]
        trigger = {
            "greeting": "학생에게 스페인어로 먼저 인사를 건네세요. 지금 시간대에 맞는 인사를 사용하세요.",
            "situational": "오늘의 상황 단어 학습을 시작하세요. 주제를 정하고 첫 번째 단어를 소개하세요.",
            "review": "복습 퀴즈를 시작하세요. 첫 번째 문제를 내세요.",
            "mistake_review": "오답 복습을 시작하세요. 이전에 어려워했던 내용부터 시작하세요.",
            "diary": "일기 쓰기 시간을 시작하세요. 오늘 하루에 대해 스페인어로 써보도록 유도하세요.",
        }[learning_type]

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": trigger},
    ]

    try:
        reply = await call_ollama(messages)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Ollama 연결 실패: {str(e)}")

    return ChatResponse(
        reply=reply,
        learning_type=learning_type,
        learning_type_label=LEARNING_TYPE_LABELS[learning_type],
    )
