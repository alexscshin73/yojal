from fastapi import FastAPI, HTTPException, Query, Depends
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
from database import init_db, check_db, get_db
from models import (
    LearningItem, LearningItemCreate,
    RegisterRequest, LoginRequest, AuthResponse, UserPublic,
    ReviewResultRequest, ReviewItem, ReviewResultResponse, ProgressStats, StageCount,
    RoutineCreate, Routine,
)
from auth import hash_password, verify_password, create_token, new_user_id, get_current_user
from seed import seed_learning_items
from srs import calculate_next_review, interval_to_stage

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


# ── 학습 타입별 푸시 문구 ────────────────────────────────────────────
PUSH_CONTENT = {
    "greeting":      ("🌅 좋은 아침!", "스페인어로 인사해볼까요? ¡Buenos días!"),
    "situational":   ("🗣 상황 단어 학습", "오늘의 상황 단어 학습을 시작해요!"),
    "new_learning":  ("📚 새 학습 시간", "오늘의 스페인어 수업을 시작해요!"),
    "review":        ("🔄 복습 시간", "배운 내용을 복습해볼까요?"),
    "mistake_review":("❌ 오답 복습", "틀렸던 문제를 다시 풀어봐요"),
    "diary":         ("📔 일기 쓰기", "오늘 하루를 스페인어로 기록해봐요"),
}


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


async def refresh_scheduler():
    """DB의 active 루틴 전체로 APScheduler 잡을 재구성한다."""
    for job in scheduler.get_jobs():
        if job.id.startswith("routine_"):
            scheduler.remove_job(job.id)

    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        async with db.execute(
            "SELECT DISTINCT hour, minute, learning_type FROM routines WHERE is_active = 1"
        ) as cur:
            rows = await cur.fetchall()

    if not rows:
        # 루틴이 없으면 기본 3개 복원
        _add_default_jobs()
        return

    # 기본 잡 제거
    for job in scheduler.get_jobs():
        if not job.id.startswith("routine_"):
            try:
                scheduler.remove_job(job.id)
            except Exception:
                pass

    for row in rows:
        lt = row["learning_type"]
        title, body = PUSH_CONTENT.get(lt, ("🦜 PicoPico", "학습 시간이에요!"))
        job_id = f"routine_{row['hour']}_{row['minute']}_{lt}"
        scheduler.add_job(
            send_push, "cron",
            hour=row["hour"], minute=row["minute"],
            id=job_id, replace_existing=True,
            args=[title, body, lt],
        )


def _add_default_jobs():
    scheduler.add_job(send_push, "cron", hour=6, minute=0, id="default_greeting", replace_existing=True,
                      args=["🌅 좋은 아침!", "스페인어로 인사해볼까요? ¡Buenos días!", "greeting"])
    scheduler.add_job(send_push, "cron", hour=9, minute=0, id="default_new_learning", replace_existing=True,
                      args=["📚 새 학습 시간", "오늘의 스페인어 수업을 시작해요!", "new_learning"])
    scheduler.add_job(send_push, "cron", hour=21, minute=0, id="default_diary", replace_existing=True,
                      args=["📔 일기 쓰기", "오늘 하루를 스페인어로 기록해봐요", "diary"])

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
    await init_db()
    await seed_learning_items()
    scheduler.start()
    await refresh_scheduler()

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()


# ── 헬스체크 ────────────────────────────────────────────────────────

# ── Auth ────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=AuthResponse, status_code=201)
async def register(req: RegisterRequest):
    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        async with db.execute("SELECT id FROM users WHERE email = ?", (req.email,)) as cur:
            if await cur.fetchone():
                raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다")

        uid = new_user_id()
        await db.execute(
            "INSERT INTO users (id, email, password_hash, nickname) VALUES (?, ?, ?, ?)",
            (uid, req.email, hash_password(req.password), req.nickname),
        )
        await db.commit()

        async with db.execute("SELECT * FROM users WHERE id = ?", (uid,)) as cur:
            user = await cur.fetchone()

    return AuthResponse(
        access_token=create_token(uid),
        user=UserPublic(**user),
    )


@app.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        async with db.execute("SELECT * FROM users WHERE email = ?", (req.email,)) as cur:
            user = await cur.fetchone()

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="비활성화된 계정입니다")

    return AuthResponse(
        access_token=create_token(user["id"]),
        user=UserPublic(**user),
    )


@app.get("/auth/me", response_model=UserPublic)
async def me(user_id: str = Depends(get_current_user)):
    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cur:
            user = await cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    return UserPublic(**user)


@app.get("/health")
async def health():
    db_ok = await check_db()
    return {"status": "ok", "db": "ok" if db_ok else "error"}


# ── Learning Items ───────────────────────────────────────────────────

@app.get("/items", response_model=list[LearningItem])
async def get_items(
    level: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
):
    query = "SELECT * FROM learning_items WHERE 1=1"
    params = []
    if level:
        query += " AND level = ?"
        params.append(level)
    if module_id:
        query += " AND module_id = ?"
        params.append(module_id)
    if type:
        query += " AND type = ?"
        params.append(type)
    query += " ORDER BY module_id, id"

    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
    return [LearningItem(**r) for r in rows]


@app.post("/items", response_model=LearningItem, status_code=201)
async def create_item(item: LearningItemCreate):
    async with get_db() as db:
        await db.execute(
            """INSERT INTO learning_items
               (id, level, module_id, type, content, meaning, example_1, example_2, audio_url, tags)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (item.id, item.level, item.module_id, item.type, item.content,
             item.meaning, item.example_1, item.example_2, item.audio_url,
             json.dumps(item.tags, ensure_ascii=False)),
        )
        await db.commit()
    return LearningItem(**item.model_dump())


@app.get("/items/count")
async def count_items():
    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        async with db.execute(
            "SELECT level, COUNT(*) as count FROM learning_items GROUP BY level ORDER BY level"
        ) as cursor:
            rows = await cursor.fetchall()
    total = sum(r["count"] for r in rows)
    return {"total": total, "by_level": rows}


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


# ── SRS 엔진 ─────────────────────────────────────────────────────────

@app.get("/review/today", response_model=dict)
async def review_today(
    limit: int = Query(20, ge=1, le=50),
    user_id: str = Depends(get_current_user),
):
    """오늘 복습 대상 + 신규 아이템을 합산해 반환."""
    from datetime import date
    today = date.today().isoformat()

    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))

        async with db.execute(
            """
            SELECT li.*, up.stage, up.interval_days, up.ease_factor,
                   up.last_reviewed_at, up.next_review_at, up.success_rate,
                   0 AS is_new
            FROM learning_items li
            JOIN user_progress up ON li.id = up.item_id
            WHERE up.user_id = ? AND up.next_review_at <= ?
            ORDER BY up.next_review_at ASC
            LIMIT ?
            """,
            (user_id, today, limit),
        ) as cur:
            due = await cur.fetchall()

        remaining = limit - len(due)
        new_items = []
        if remaining > 0:
            async with db.execute(
                """
                SELECT li.*,
                       'study' AS stage, 1 AS interval_days, 2.5 AS ease_factor,
                       NULL AS last_reviewed_at, NULL AS next_review_at, 0.0 AS success_rate,
                       1 AS is_new
                FROM learning_items li
                WHERE li.id NOT IN (
                    SELECT item_id FROM user_progress WHERE user_id = ?
                )
                ORDER BY li.level, li.module_id, li.id
                LIMIT ?
                """,
                (user_id, remaining),
            ) as cur:
                new_items = await cur.fetchall()

    items = [ReviewItem(**row) for row in due + new_items]
    return {
        "items": [i.model_dump() for i in items],
        "total": len(items),
        "due_count": len(due),
        "new_count": len(new_items),
    }


@app.post("/review/result", response_model=ReviewResultResponse)
async def review_result(
    req: ReviewResultRequest,
    user_id: str = Depends(get_current_user),
):
    """복습 결과를 기록하고 SM-2로 다음 복습일을 계산한다."""
    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))

        async with db.execute(
            "SELECT * FROM user_progress WHERE user_id = ? AND item_id = ?",
            (user_id, req.item_id),
        ) as cur:
            prog = await cur.fetchone()

        ease_factor = prog["ease_factor"] if prog else 2.5
        interval = prog["interval_days"] if prog else 1
        prev_success = prog["success_rate"] if prog else 0.0

        new_ef, new_interval, next_review_at = calculate_next_review(ease_factor, interval, req.quality)
        new_stage = interval_to_stage(new_interval)

        success = 1.0 if req.quality >= 3 else 0.0
        total_reviews = 1
        if prog:
            async with db.execute(
                "SELECT COUNT(*) AS cnt FROM study_log WHERE user_id = ? AND item_id = ?",
                (user_id, req.item_id),
            ) as cur:
                row = await cur.fetchone()
                total_reviews = (row["cnt"] or 0) + 1
        new_success_rate = prev_success + (success - prev_success) / total_reviews

        from datetime import datetime
        now = datetime.utcnow().isoformat()

        await db.execute(
            """
            INSERT INTO user_progress
                (user_id, item_id, stage, interval_days, ease_factor,
                 last_reviewed_at, next_review_at, success_rate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, item_id) DO UPDATE SET
                stage = excluded.stage,
                interval_days = excluded.interval_days,
                ease_factor = excluded.ease_factor,
                last_reviewed_at = excluded.last_reviewed_at,
                next_review_at = excluded.next_review_at,
                success_rate = excluded.success_rate
            """,
            (user_id, req.item_id, new_stage, new_interval, new_ef,
             now, next_review_at, round(new_success_rate, 3)),
        )
        await db.execute(
            "INSERT INTO study_log (user_id, item_id, action, result, time_spent) VALUES (?, ?, ?, ?, ?)",
            (user_id, req.item_id, "retrieval",
             "correct" if req.quality >= 3 else "wrong", req.time_spent),
        )
        await db.commit()

    return ReviewResultResponse(
        item_id=req.item_id,
        stage=new_stage,
        interval_days=new_interval,
        ease_factor=new_ef,
        next_review_at=next_review_at,
    )


@app.get("/progress/stats", response_model=ProgressStats)
async def progress_stats(user_id: str = Depends(get_current_user)):
    """단계별 아이템 수, 오늘 복습 수, 연속 학습 일수."""
    from datetime import timedelta
    from datetime import timezone
    from datetime import datetime as dt

    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))

        async with db.execute(
            "SELECT stage, COUNT(*) AS cnt FROM user_progress WHERE user_id = ? GROUP BY stage",
            (user_id,),
        ) as cur:
            rows = await cur.fetchall()
        stage_map = {r["stage"]: r["cnt"] for r in rows}

        # SQLite는 UTC 저장 → date('now')로 UTC 기준 비교
        async with db.execute(
            "SELECT COUNT(*) AS cnt FROM study_log WHERE user_id = ? AND date(created_at) = date('now')",
            (user_id,),
        ) as cur:
            row = await cur.fetchone()
        today_reviewed = row["cnt"] if row else 0

        async with db.execute(
            """
            SELECT DISTINCT date(created_at) AS study_date
            FROM study_log WHERE user_id = ?
            ORDER BY study_date DESC LIMIT 365
            """,
            (user_id,),
        ) as cur:
            date_rows = await cur.fetchall()
        dates = [r["study_date"] for r in date_rows]

        # UTC 오늘 날짜 기준으로 연속 일수 계산
        utc_today = dt.now(timezone.utc).date()
        streak = 0
        for i, d in enumerate(dates):
            if d == (utc_today - timedelta(days=i)).isoformat():
                streak += 1
            else:
                break

    return ProgressStats(
        total_studied=sum(stage_map.values()),
        by_stage=StageCount(
            study=stage_map.get("study", 0),
            retrieval=stage_map.get("retrieval", 0),
            spacing=stage_map.get("spacing", 0),
            mastered=stage_map.get("mastered", 0),
        ),
        today_reviewed=today_reviewed,
        streak_days=streak,
    )


# ── 루틴 CRUD ────────────────────────────────────────────────────────

@app.get("/routines", response_model=list[Routine])
async def list_routines(user_id: str = Depends(get_current_user)):
    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        async with db.execute(
            "SELECT * FROM routines WHERE user_id = ? ORDER BY hour, minute",
            (user_id,),
        ) as cur:
            rows = await cur.fetchall()
    return [Routine(**r) for r in rows]


@app.post("/routines", response_model=Routine, status_code=201)
async def create_routine(req: RoutineCreate, user_id: str = Depends(get_current_user)):
    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        await db.execute(
            """INSERT INTO routines (user_id, learning_type, hour, minute, days_of_week, is_active)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, req.learning_type, req.hour, req.minute,
             json.dumps(req.days_of_week), 1 if req.is_active else 0),
        )
        await db.commit()
        async with db.execute(
            "SELECT * FROM routines WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,)
        ) as cur:
            row = await cur.fetchone()

    await refresh_scheduler()
    return Routine(**row)


@app.delete("/routines/{routine_id}", status_code=204)
async def delete_routine(routine_id: int, user_id: str = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM routines WHERE id = ? AND user_id = ?", (routine_id, user_id)
        ) as cur:
            if not await cur.fetchone():
                raise HTTPException(status_code=404, detail="루틴을 찾을 수 없습니다")
        await db.execute("DELETE FROM routines WHERE id = ?", (routine_id,))
        await db.commit()

    await refresh_scheduler()
