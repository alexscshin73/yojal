# HANDOVER — 2026-04-27 기준 현재 상태

> 읽는 순서: HANDOVER.md → CLAUDE.md → PHASE2.md → PROGRESS.md

---

## 한 줄 요약

MVP(D-01~D-06) + Phase 2 P2-01~P2-04 완료.  
SRS 엔진, 365일 커리큘럼 페이스 시스템, 루틴 설정 화면 완성.  
다음 작업: **P2-05 학습 기록 화면 (RecordsScreen)**

---

## 지금 당장 시작하려면

### 1. Ollama 켜기 (GPU LLM 서버)
```bash
nohup ollama serve > /tmp/ollama.log 2>&1 &
curl http://localhost:11434/api/tags   # 확인
```

### 2. 백엔드 켜기 (FastAPI)
```bash
cd ~/projects/picopico/backend
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/picopico_backend.log 2>&1 &
curl http://localhost:8000/health      # {"status":"ok","db":"ok"}
```

### 3. 앱 개발 서버 (Expo)
```bash
cd ~/projects/picopico/mobile
npx expo start --port 8085             # 8081은 VSCode Remote 선점
```

---

## 현재 서버 구성

| 서비스 | 주소 | 비고 |
|--------|------|------|
| Ollama (LLM) | http://localhost:11434 | scshin 유저로 직접 실행 |
| FastAPI 백엔드 | http://localhost:8000 | SQLite picopico.db |
| Cloudflare Tunnel | https://picopico.carroamix.com | 외부 접속용 |
| Expo Metro | http://192.168.100.169:8085 | 개발 시에만 |

**GPU**: RTX 5090 x2 / **모델**: llama3.3:latest (42GB, num_ctx=4096)  
**API_BASE_URL**: `mobile/src/config.ts` → `https://picopico.carroamix.com`

---

## 전체 파일 구조

```
picopico/
├── HANDOVER.md          ← 지금 읽는 파일 (세션 시작 시 1순위)
├── CLAUDE.md            ← Harness Engineering 규칙 + 게이트 정의
├── PHASE2.md            ← Phase 2 개발 계획 (P2-01~P2-07)
├── PROGRESS.md          ← 세션별 작업 기록
├── CURRICULUM_DESIGN.md ← CEFR 커리큘럼 설계 결정사항 (46모듈)
├── content/
│   └── basic_Spanish_one_step_markdown_study.md  ← 한국 스페인어 교재 OCR
│
├── backend/
│   ├── main.py          ← FastAPI 앱 진입점 (모든 엔드포인트)
│   ├── auth.py          ← JWT 발급/검증, bcrypt 비밀번호 해싱
│   ├── database.py      ← SQLite 연결 + 5테이블 생성
│   ├── models.py        ← Pydantic 모델 (요청/응답 스키마)
│   ├── srs.py           ← SM-2 알고리즘 (calculate_next_review, interval_to_stage)
│   ├── seed.py          ← A1-M1, A1-M2 Learning Item 100개 삽입
│   ├── prompts.py       ← 6가지 학습 타입 시스템 프롬프트
│   ├── curriculum.py    ← 20단계 커리큘럼 + 레벨별 프롬프트
│   ├── requirements.txt
│   ├── .env             ← OLLAMA_MODEL, JWT_SECRET_KEY 등
│   └── picopico.db      ← SQLite 데이터 (gitignore 권장)
│
└── mobile/
    ├── App.tsx                          ← NavigationContainer + AuthProvider + 푸시 알림 등록
    └── src/
        ├── config.ts                    ← API_BASE_URL
        ├── theme.ts                     ← 색상 (Teal #00897B)
        ├── types.ts                     ← 공통 타입 (ChatMessage, LearningType 등)
        ├── context/
        │   └── AuthContext.tsx          ← 전역 인증 상태 (user, token, login/logout)
        ├── services/
        │   └── api.ts                   ← streamStart, streamChat, getRoutines, createRoutine, deleteRoutine
        └── screens/
            ├── auth/
            │   ├── LoginScreen.tsx      ← 이메일+비밀번호 로그인
            │   └── RegisterScreen.tsx   ← 닉네임+이메일+비밀번호 회원가입
            ├── HomeScreen.tsx           ← 오늘 학습 현황 + 신규/복습 버튼 + 빠른 학습
            ├── ChatScreen.tsx           ← AI 대화 화면 (핵심)
            ├── RecordsScreen.tsx        ← 학습 기록 (P2-05 대상 — 현재 플레이스홀더)
            ├── RoutineScreen.tsx        ← 루틴 CRUD (P2-04 완료)
            └── SettingsScreen.tsx       ← 프로필 + 루틴 설정 진입 + 로그아웃
```

---

## DB 스키마 (5테이블)

```sql
-- 사용자 계정
users (id TEXT PK, email UNIQUE, password_hash, nickname, created_at, is_active)

-- 학습 단위 (콘텐츠 원장)
learning_items (id TEXT PK, level, module_id, type, content, meaning,
                example_1, example_2, audio_url, tags JSON)

-- 사용자별 SRS 진척도
user_progress (id, user_id, item_id, stage, interval_days, ease_factor,
               last_reviewed_at, next_review_at, success_rate)
              → UNIQUE(user_id, item_id)

-- 학습 로그 (분석용)
study_log (id, user_id, item_id, action, result, time_spent, created_at)

-- 루틴 설정
routines (id, user_id, learning_type, hour, minute, days_of_week JSON, is_active)

-- 사용자별 페이스 설정
user_settings (user_id TEXT PK, daily_new_per_level JSON)
  default: {"A1":5,"A2":4,"B1":7,"B2":7,"C1":14,"C2":14}  ← 365일 완료 기준
```

---

## API 엔드포인트 전체 목록

### 인증
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/auth/register` | 회원가입 → `{access_token, user}` |
| POST | `/auth/login` | 로그인 → `{access_token, user}` |
| GET | `/auth/me` | 내 정보 조회 (Bearer 토큰 필요) |

### 학습 아이템
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/items` | 아이템 목록 (`?level=A1&module_id=A1-M1&type=word`) |
| POST | `/items` | 아이템 추가 |
| GET | `/items/count` | 레벨별 아이템 수 |

### SRS / 학습 진행
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/learning/today` | 오늘 학습 현황 (현재 모듈, 신규N개, 복습M개, 진척도) |
| GET | `/review/today` | 오늘 복습 대상 목록 |
| POST | `/review/result` | 복습 결과 기록 + SM-2 재계산 |
| GET | `/progress/stats` | 전체 통계 (스테이지별 수, 스트릭) |
| GET | `/progress/errors` | 자주 틀린 유형 분석 (P2-05 예정) |

### 루틴 설정
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/routines` | 내 루틴 목록 |
| POST | `/routines` | 루틴 추가 `{learning_type, hour, minute, days_of_week}` |
| DELETE | `/routines/{id}` | 루틴 삭제 |

### 페이스 설정
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/settings/pace` | 레벨별 일일 신규 목표 + 예상 완료일 |
| PATCH | `/settings/pace` | 레벨별 일일 신규 목표 수정 |

### AI 채팅
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/chat/start/stream` | 대화 시작 (SSE 스트리밍) |
| POST | `/chat/stream` | 메시지 전송 (SSE 스트리밍) |
| POST | `/chat/start` | 대화 시작 (비스트리밍 fallback) |
| POST | `/chat` | 메시지 전송 (비스트리밍 fallback) |

### 시스템
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | `{"status":"ok","db":"ok"}` |
| POST | `/register-token` | Expo 푸시 토큰 등록 |
| POST | `/push-test` | 테스트 푸시 발송 |

---

## 커리큘럼 페이스 시스템

365일 완성 기준 레벨별 기본 일일 신규 수:

| 레벨 | 일일 신규 | 총 아이템 | 예상 기간 |
|------|-----------|-----------|-----------|
| A1 | 5개 | 250개 | ~50일 |
| A2 | 4개 | 400개 | ~100일 |
| B1 | 7개 | 500개 | ~72일 |
| B2 | 7개 | 500개 | ~72일 |
| C1 | 14개 | 400개 | ~29일 |
| C2 | 14개 | 250개 | ~18일 |

- MODULE_ORDER: 46개 모듈 (A1-M1 ~ C2-M5) — main.py에 정의
- `GET /learning/today`: 현재 모듈에서 오늘 N개 신규 + SRS 복습 반환
- `GET /settings/pace`: daily_new_per_level + 레벨별 예상 완료일 반환

---

## SRS 엔진 (SM-2 알고리즘)

```python
# backend/srs.py
def calculate_next_review(ease_factor, interval, quality) -> (float, int, str):
    if quality < 3:   # 실패
        interval = 1
        ease_factor = max(1.3, ease_factor - 0.2)
    else:             # 성공
        interval = 6 if interval == 1 else round(interval * ease_factor)
        ease_factor = max(1.3, ease_factor + 0.1 - (5-quality)*0.08)
    next_review_at = (date.today() + timedelta(days=interval)).isoformat()
    return round(ease_factor, 3), interval, next_review_at

def interval_to_stage(interval):  # study/retrieval/spacing/mastered
    if interval <= 1: return "study"
    elif interval <= 7: return "retrieval"
    elif interval <= 21: return "spacing"
    else: return "mastered"
```

**중요**: SQLite `datetime('now')`는 UTC 저장. 복습 쿼리는 `date('now')` 사용 → 로컬 타임존 불일치 방지

---

## 인증 흐름

```
앱 시작 → SecureStore 토큰 확인
  ├── 있음 → GET /auth/me 검증 → 성공: 메인 앱 / 실패: 로그인 화면
  └── 없음 → 로그인 화면

로그인/회원가입 성공 → JWT(30일) SecureStore 저장 → 메인 앱
```

---

## Phase 2 진행 상태

| 태스크 | 내용 | 상태 |
|--------|------|------|
| P2-01 | SQLite DB 스키마 (5테이블) | ✅ 완료 |
| P2-02 | Learning Item 시드 데이터 100개 | ✅ 완료 |
| P2-03 | SRS 엔진 (SM-2 알고리즘) | ✅ 완료 |
| P2-04 | 루틴 설정 화면 + 커리큘럼 페이스 시스템 | ✅ 완료 |
| P2-05 | 학습 기록 화면 | ← **다음 작업** |
| P2-06 | 개인화 알림 (SRS 연동) | ⏳ 대기 |
| P2-07 | 음성 입력 STT | ⏳ 대기 |

---

## P2-05 다음 작업 예고 (학습 기록 화면)

`mobile/src/screens/RecordsScreen.tsx` 구현:
- `GET /progress/stats` → 스트릭, 스테이지별 수량
- `GET /review/today` → 복습 대기 수
- 단계별 현황 바 (study/retrieval/spacing/mastered)
- "오늘 복습하기" → ChatScreen(review 타입)
- `GET /progress/errors` 백엔드 구현 필요

---

## 주의사항 (실수하기 쉬운 것들)

1. **Ollama를 systemd로 실행하면 GPU 미감지** → `nohup ollama serve ...`로 직접 실행
2. **Expo 포트 8081 사용 금지** → VSCode Remote 선점, 8085 사용
3. **Ollama num_ctx 옵션 필수** → 없으면 128K 컨텍스트로 VRAM 폭발
4. **bcrypt 직접 사용, passlib 미사용** → passlib+bcrypt4.x 버전 충돌 있음
5. **pip install 시 `--break-system-packages` 필요** → 시스템 Python3 환경
6. **SQLite 복습 쿼리는 `date('now')` 사용** → `datetime('now')`는 UTC라 당일 복습 누락 가능
7. **JWT_SECRET_KEY는 .env에서 관리** → 기본값은 개발용, 프로덕션 변경 필수
