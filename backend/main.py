from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Literal, Optional
import httpx
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from prompts import SYSTEM_PROMPTS, LEARNING_TYPE_LABELS
from curriculum import get_level_prompt, CURRICULUM

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.3:latest")
NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "4096"))

LearningType = Literal[
    "greeting", "situational", "new_learning", "review", "mistake_review", "diary"
]

OLLAMA_OPTIONS = {"num_ctx": NUM_CTX, "num_gpu": 99, "num_predict": 600}


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    learning_type: LearningType
    history: Optional[list[Message]] = []
    level: Optional[int] = 1
    day: Optional[int] = 1


class StartRequest(BaseModel):
    learning_type: LearningType
    level: Optional[int] = 1
    day: Optional[int] = 1


class ChatResponse(BaseModel):
    reply: str
    learning_type: str
    learning_type_label: str


class TokenRequest(BaseModel):
    token: str


# ── 푸시 토큰 저장소 ─────────────────────────────────────────────────
TOKENS_FILE = Path("/tmp/picopico_tokens.json")

def load_tokens() -> list[str]:
    if TOKENS_FILE.exists():
        return json.loads(TOKENS_FILE.read_text())
    return []

def save_token(token: str):
    tokens = load_tokens()
    if token not in tokens:
        tokens.append(token)
        TOKENS_FILE.write_text(json.dumps(tokens))


# ── Expo Push 발송 ───────────────────────────────────────────────────
async def send_push(title: str, body: str, learning_type: str):
    tokens = load_tokens()
    if not tokens:
        return
    messages = [
        {"to": t, "title": title, "body": body,
         "data": {"learningType": learning_type}, "sound": "default"}
        for t in tokens
    ]
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://exp.host/--/api/v2/push/send",
            json=messages,
            headers={"Content-Type": "application/json"},
        )


app = FastAPI(title="PicoPico API", version="0.1.0")
scheduler = AsyncIOScheduler(timezone="America/Mexico_City")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


def build_messages(learning_type: LearningType, level: int, day: int,
                   history: list[Message], user_content: str) -> list:
    if learning_type == "new_learning":
        system_prompt = get_level_prompt(level, day)
    else:
        system_prompt = SYSTEM_PROMPTS[learning_type]

    msgs = [{"role": "system", "content": system_prompt}]
    for m in (history or [])[-10:]:
        msgs.append({"role": m.role, "content": m.content})
    msgs.append({"role": "user", "content": user_content})
    return msgs


def build_start_messages(learning_type: LearningType, level: int, day: int) -> list:
    triggers = {
        "greeting": "학생에게 스페인어로 먼저 인사를 건네세요. 지금 시간대에 맞는 인사를 사용하세요.",
        "situational": "오늘의 상황 단어 학습을 시작하세요. 주제를 정하고 첫 번째 단어를 소개하세요.",
        "new_learning": f"지금 바로 레벨 {level} 수업을 위의 형식대로 시작해주세요.",
        "review": "복습 퀴즈를 시작하세요. 첫 번째 문제를 내세요.",
        "mistake_review": "오답 복습을 시작하세요. 이전에 어려워했던 내용부터 시작하세요.",
        "diary": "일기 쓰기 시간을 시작하세요. 오늘 하루에 대해 스페인어로 써보도록 유도하세요.",
    }
    if learning_type == "new_learning":
        system_prompt = get_level_prompt(level, day)
    else:
        system_prompt = SYSTEM_PROMPTS[learning_type]

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": triggers[learning_type]},
    ]


async def call_ollama(messages: list) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages,
                  "stream": False, "options": OLLAMA_OPTIONS},
        )
        response.raise_for_status()
        return response.json()["message"]["content"]


async def stream_ollama(messages: list):
    """Ollama 스트리밍 → SSE 포맷으로 변환"""
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{OLLAMA_BASE_URL}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages,
                  "stream": True, "options": OLLAMA_OPTIONS},
        ) as response:
            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    token = data.get("message", {}).get("content", "")
                    if token:
                        yield f"data: {json.dumps({'token': token})}\n\n"
                    if data.get("done"):
                        yield "data: [DONE]\n\n"
                        return
                except json.JSONDecodeError:
                    pass


# ── 앱 시작/종료 ────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    scheduler.add_job(send_push, "cron", hour=6, minute=0,
                      args=["🌅 좋은 아침!", "스페인어로 인사해볼까요? ¡Buenos días!", "greeting"])
    scheduler.add_job(send_push, "cron", hour=9, minute=0,
                      args=["📚 새 학습 시간", "오늘의 스페인어 수업을 시작해요!", "new_learning"])
    scheduler.add_job(send_push, "cron", hour=21, minute=0,
                      args=["📔 일기 쓰기", "오늘 하루를 스페인어로 기록해봐요", "diary"])
    scheduler.start()

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()


# ── 헬스체크 ────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


# ── 푸시 토큰 등록 ───────────────────────────────────────────────────

@app.post("/register-token")
async def register_token(req: TokenRequest):
    save_token(req.token)
    return {"status": "ok"}


# ── 테스트용 즉시 발송 ───────────────────────────────────────────────

@app.post("/push-test")
async def push_test(learning_type: str = "greeting"):
    await send_push("🦜 PicoPico 테스트", "알림이 잘 도착했나요?", learning_type)
    return {"status": "sent", "tokens": len(load_tokens())}


@app.get("/curriculum")
async def get_curriculum_list():
    return {
        level: {"title": data["title"], "grammar": data["grammar"]}
        for level, data in CURRICULUM.items()
    }


# ── 스트리밍 엔드포인트 (앱 사용) ───────────────────────────────────

@app.post("/chat/start/stream")
async def chat_start_stream(req: StartRequest):
    messages = build_start_messages(req.learning_type, req.level or 1, req.day or 1)
    return StreamingResponse(
        stream_ollama(messages),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    messages = build_messages(
        req.learning_type, req.level or 1, req.day or 1,
        req.history or [], req.message
    )
    return StreamingResponse(
        stream_ollama(messages),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── 비스트리밍 (fallback) ───────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    messages = build_messages(
        req.learning_type, req.level or 1, req.day or 1,
        req.history or [], req.message
    )
    try:
        reply = await call_ollama(messages)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Ollama 연결 실패: {str(e)}")
    return ChatResponse(reply=reply, learning_type=req.learning_type,
                        learning_type_label=LEARNING_TYPE_LABELS[req.learning_type])


@app.post("/chat/start")
async def chat_start(req: StartRequest):
    messages = build_start_messages(req.learning_type, req.level or 1, req.day or 1)
    try:
        reply = await call_ollama(messages)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Ollama 연결 실패: {str(e)}")
    return ChatResponse(reply=reply, learning_type=req.learning_type,
                        learning_type_label=LEARNING_TYPE_LABELS[req.learning_type])
