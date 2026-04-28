# HANDOVER — 2026-04-28 기준 현재 상태

> 읽는 순서: HANDOVER.md → CLAUDE.md → PHASE2.md → PROGRESS.md

---

## 한 줄 요약

MVP(D-01~D-06) + Phase 2 전체(P2-01~P2-07) 코드 완성.  
STT는 Dev Build 필요 (Apple Developer 계정 활성화 대기 중).  
다음 할 일: **실기기 통합 테스트 + 콘텐츠 확충**

---

## 지금 당장 시작하려면

### 1. Ollama 켜기 (GPU LLM 서버)
```bash
nohup ollama serve > /tmp/ollama.log 2>&1 &
curl http://localhost:11434/api/tags
```

### 2. 백엔드 켜기 (FastAPI)
```bash
cd ~/projects/picopico/backend
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/picopico_backend.log 2>&1 &
curl http://localhost:8000/health   # {"status":"ok","db":"ok"}
```

### 3. 앱 개발 서버 (Expo)
```bash
cd ~/projects/picopico/mobile
npx expo start --port 8085          # Expo Go로 P2-07 STT 제외 전 기능 테스트 가능
```

---

## 서버 구성

| 서비스 | 주소 | 비고 |
|--------|------|------|
| Ollama (LLM) | http://localhost:11434 | scshin 유저로 직접 실행 (GPU 감지 조건) |
| FastAPI 백엔드 | http://localhost:8000 | SQLite picopico.db |
| Cloudflare Tunnel | https://picopico.carroamix.com | 외부(모바일) 접속용 |
| Expo Metro | http://192.168.100.169:8085 | 개발 시에만 |

**GPU**: RTX 5090 x2 / **모델**: llama3.3:latest (42GB, num_ctx=4096)  
**API_BASE_URL**: `mobile/src/config.ts` → `https://picopico.carroamix.com`

---

## 전체 파일 구조

```
picopico/
├── HANDOVER.md           ← 지금 읽는 파일 (세션 시작 시 1순위)
├── CLAUDE.md             ← Harness Engineering 규칙 + 게이트 정의
├── PHASE2.md             ← Phase 2 개발 계획 (P2-01~P2-07)
├── PROGRESS.md           ← 세션별 작업 기록
├── CURRICULUM_DESIGN.md  ← CEFR 커리큘럼 설계 결정사항 (46모듈)
├── content/
│   └── basic_Spanish_one_step_markdown_study.md  ← 교재 OCR
│
├── backend/
│   ├── main.py           ← FastAPI 진입점 (모든 엔드포인트)
│   ├── auth.py           ← JWT 발급/검증, bcrypt 해싱
│   ├── database.py       ← SQLite 연결 + 6테이블 생성
│   ├── models.py         ← Pydantic 모델
│   ├── srs.py            ← SM-2 알고리즘
│   ├── seed.py           ← A1-M1, A1-M2 Learning Item 100개
│   ├── prompts.py        ← 학습 타입별 시스템 프롬프트
│   ├── curriculum.py     ← 20단계 커리큘럼
│   ├── requirements.txt
│   ├── .env              ← OLLAMA_MODEL, JWT_SECRET_KEY
│   └── picopico.db       ← SQLite DB (gitignore 권장)
│
└── mobile/
    ├── App.tsx                        ← NavigationContainer + AuthProvider + 딥링크
    ├── app.json                       ← Expo 설정 (bundleIdentifier, 권한 문구)
    ├── eas.json                       ← EAS 빌드 프로필 (dev/preview/production)
    └── src/
        ├── config.ts                  ← API_BASE_URL
        ├── theme.ts                   ← Teal (#00897B) 브랜드 색상
        ├── types.ts                   ← ChatMessage, LearningType 등
        ├── context/
        │   └── AuthContext.tsx        ← 전역 인증 상태 (user, token, login/logout)
        ├── services/
        │   └── api.ts                 ← 모든 API 호출 함수
        └── screens/
            ├── auth/
            │   ├── LoginScreen.tsx
            │   └── RegisterScreen.tsx
            ├── HomeScreen.tsx         ← 오늘 학습 현황 + 신규/복습 버튼
            ├── ChatScreen.tsx         ← AI 대화 + STT 마이크 버튼
            ├── RecordsScreen.tsx      ← 학습 기록 (스트릭, 단계별 현황, 오답)
            ├── RoutineScreen.tsx      ← 루틴 CRUD
            └── SettingsScreen.tsx     ← 프로필 + 루틴 진입 + 로그아웃
```

---

## DB 스키마 (6테이블)

```sql
users            (id, email, password_hash, nickname, created_at, is_active)
learning_items   (id, level, module_id, type, content, meaning,
                  example_1, example_2, audio_url, tags JSON)
user_progress    (id, user_id, item_id, stage, interval_days, ease_factor,
                  last_reviewed_at, next_review_at, success_rate)
                 → UNIQUE(user_id, item_id)
study_log        (id, user_id, item_id, action, result, time_spent, created_at)
routines         (id, user_id, learning_type, hour, minute, days_of_week JSON, is_active)
user_settings    (user_id PK, daily_new_per_level JSON)
                 default: {"A1":5,"A2":4,"B1":7,"B2":7,"C1":14,"C2":14}
user_push_tokens (user_id PK, push_token, updated_at)
```

---

## API 엔드포인트 전체

### 인증
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/auth/register` | 회원가입 → `{access_token, user}` |
| POST | `/auth/login` | 로그인 → `{access_token, user}` |
| GET | `/auth/me` | 내 정보 (Bearer 필요) |

### 학습 아이템
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/items` | 목록 (`?level=A1&module_id=A1-M1&type=word`) |
| POST | `/items` | 아이템 추가 |
| GET | `/items/count` | 레벨별 수량 |

### 커리큘럼 + 학습 진행
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/learning/today` | 오늘 학습 현황 (현재 모듈, 신규N개, 복습M개, 진척도) |
| GET | `/review/today` | SRS 복습 대상 목록 |
| POST | `/review/result` | 복습 결과 + SM-2 재계산 |
| GET | `/progress/stats` | 전체 통계 (스테이지별 수, 스트릭) |
| GET | `/progress/errors` | 자주 틀린 유형 상위 3개 |

### 페이스 설정
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/settings/pace` | 레벨별 일일 신규 목표 + 예상 완료일 |
| PATCH | `/settings/pace` | 레벨별 목표 수정 |

### 루틴
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/routines` | 내 루틴 목록 |
| POST | `/routines` | 루틴 추가 |
| DELETE | `/routines/{id}` | 루틴 삭제 |

### 알림
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/register-token` | Expo push 토큰 등록 (JWT 필요) |
| POST | `/push-test` | 즉시 테스트 발송 |

### AI 채팅
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/chat/start/stream` | 대화 시작 (SSE) |
| POST | `/chat/stream` | 메시지 전송 (SSE) |
| POST | `/chat/start` | 대화 시작 (비스트리밍 fallback) |
| POST | `/chat` | 메시지 전송 (비스트리밍 fallback) |

### 시스템
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | `{"status":"ok","db":"ok"}` |
| GET | `/curriculum` | 커리큘럼 목록 |

---

## 커리큘럼 페이스 시스템 (365일 완성 기준)

| 레벨 | 일일 신규 | 총 아이템 | 예상 기간 |
|------|-----------|-----------|-----------|
| A1 | 5개 | 250개 | ~50일 |
| A2 | 4개 | 400개 | ~100일 |
| B1 | 7개 | 500개 | ~72일 |
| B2 | 7개 | 500개 | ~72일 |
| C1 | 14개 | 400개 | ~29일 |
| C2 | 14개 | 250개 | ~18일 |

`MODULE_ORDER`: 46개 모듈 순서 (A1-M1 ~ C2-M5) — `backend/main.py`에 정의

---

## SRS 엔진 (SM-2)

```python
# backend/srs.py
def calculate_next_review(ease_factor, interval, quality):
    if quality < 3:   # 실패
        interval, ease_factor = 1, max(1.3, ease_factor - 0.2)
    else:             # 성공
        interval = 6 if interval == 1 else round(interval * ease_factor)
        ease_factor = max(1.3, ease_factor + 0.1 - (5 - quality) * 0.08)
    next_review_at = (date.today() + timedelta(days=interval)).isoformat()
    return round(ease_factor, 3), interval, next_review_at

# stage: study(≤1일) / retrieval(≤7일) / spacing(≤21일) / mastered(21일+)
```

**주의**: SQLite 복습 쿼리는 반드시 `date('now')` 사용 — `datetime('now')`는 UTC라 당일 복습 누락 가능

---

## 개인화 알림 시스템 (P2-06)

- 루틴 저장 시 APScheduler 자동 갱신 (`refresh_scheduler()`)
- 알림 발송 시 유저별 due 복습 수 조회 → 동적 문구
  - 복습 있음: "복습할 표현이 N개 있어요. 지금 시작해볼까요? 💪"
  - 복습 없음: 학습 타입별 기본 문구
- 딥링크: 복습 있으면 → review 타입, 없으면 → 루틴 타입
- push 토큰: 로그인 후 JWT와 함께 `/register-token` 등록 → `user_push_tokens` DB 저장

---

## STT 음성 입력 (P2-07)

- 패키지: `expo-speech-recognition` 3.1.3
- 위치: `ChatScreen.tsx` 입력창 옆
- UI: 🇪🇸/🇰🇷 언어 토글 버튼 + 🎤 마이크 버튼
- 동작: 탭 → 녹음 시작 → 실시간 텍스트 입력창 반영 → 탭(⏹) → 중지
- **주의: Dev Build 필요 (Expo Go 미지원)**

### Dev Build 방법
```bash
export PATH="/home/scshin/.local/opt/node/node-v22.22.2-linux-x64/bin:$PATH"
cd ~/projects/picopico/mobile

# iOS (Apple Developer 계정 활성화 후)
eas build --platform ios --profile development

# Android (무료, 즉시 가능)
eas build --platform android --profile development
```
- Apple 계정: `alexscshin@gmail.com` — 가입 완료, 팀 활성화 대기 중
- Bundle ID (iOS): `com.alexscshin73.picopico`
- Package (Android): `com.alexscshin73.picopico`

---

## 인증 흐름

```
앱 시작 → SecureStore 토큰 확인
  ├── 있음 → GET /auth/me 검증 → 성공: 메인 앱 / 실패: 로그인 화면
  └── 없음 → 로그인 화면

로그인 성공 → JWT(30일) SecureStore 저장 → 메인 앱
           → push 토큰 /register-token 등록 (JWT 포함)
```

---

## 주의사항

1. **Ollama는 scshin 유저로 직접 실행해야 GPU 감지** (systemd 아님)
2. **Expo 포트 8081 금지** — VSCode Remote 선점, `--port 8085` 사용
3. **SQLite 복습 쿼리는 `date('now')` 사용** — `datetime('now')`는 UTC
4. **bcrypt 직접 사용** — passlib+bcrypt 4.x 버전 충돌
5. **pip install `--break-system-packages`** — 시스템 Python3 환경
6. **`eas` 명령어 PATH 없음** — `export PATH="/home/scshin/.local/opt/node/node-v22.22.2-linux-x64/bin:$PATH"` 필요
7. **Cloudflare Tunnel**: `nohup cloudflared tunnel run --token eyJh...` → `/tmp/picopico_tunnel.log`
