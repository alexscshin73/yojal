# PHASE2 — 개발 실행 계획

> MVP(D-01~D-06) 완료 기준: 2026-04-27  
> Phase 2 목표: "기억과 말하기를 동시에 훈련하는 스페인어 학습 OS"  
> 읽는 순서: CLAUDE.md → PRODUCT_DESIGN.md → 이 파일

---

## Phase 2 개발 게이트

```
[P2 게이트]
조건: 각 태스크의 완료 기준 명시 + 사용자 확인
통과 전: 다음 태스크 코드 작성 금지
의존성: P2-01 → P2-02 → P2-03 → (P2-04, P2-05 병렬 가능) → P2-06 → P2-07
```

---

## 태스크 목록

| ID | 태스크 | 의존 | 상태 |
|----|--------|------|------|
| P2-01 | SQLite DB 스키마 | — | ✅ 완료 |
| P2-02 | Learning Item 시드 데이터 (A1-M1~M2, 200개) | P2-01 | ⏳ 대기 |
| P2-03 | SRS 엔진 (SM-2) | P2-01 | ⏳ 대기 |
| P2-04 | 루틴 설정 화면 (S-07) | P2-01 | ⏳ 대기 |
| P2-05 | 학습 기록 화면 (S-08) | P2-03 | ⏳ 대기 |
| P2-06 | 개인화 알림 (SRS 연동) | P2-03, P2-04 | ⏳ 대기 |
| P2-07 | 음성 입력 STT | P2-03 | ⏳ 대기 |

---

## P2-01. SQLite DB 스키마

**목표**: 학습 데이터 영속성 — Learning Item, 진척도, 학습 로그 저장

**상태**: ⏳ 대기 중

### 스키마 정의

```sql
-- 학습 단위
CREATE TABLE learning_items (
    id          TEXT PRIMARY KEY,
    level       TEXT NOT NULL,          -- A1/A2/B1/B2/C1/C2
    type        TEXT NOT NULL,          -- word/grammar/sentence/expression/template
    content     TEXT NOT NULL,          -- 스페인어 원문
    meaning     TEXT NOT NULL,          -- 한국어 뜻
    example     TEXT,                   -- 예문
    audio_url   TEXT,
    tags        TEXT                    -- JSON 배열: ["인사", "동사"]
);

-- 사용자 진척도 (SRS 핵심)
CREATE TABLE user_progress (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL DEFAULT 'local',
    item_id         TEXT NOT NULL,
    stage           TEXT NOT NULL DEFAULT 'study',  -- study/retrieval/spacing/mastered
    interval_days   INTEGER NOT NULL DEFAULT 1,
    ease_factor     REAL NOT NULL DEFAULT 2.5,      -- SM-2 난이도 계수
    last_reviewed_at TEXT,
    next_review_at  TEXT,                           -- Spacing 엔진의 핵심
    success_rate    REAL NOT NULL DEFAULT 0.0,
    FOREIGN KEY (item_id) REFERENCES learning_items(id)
);

-- 학습 로그 (분석용)
CREATE TABLE study_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL DEFAULT 'local',
    item_id     TEXT NOT NULL,
    action      TEXT NOT NULL,    -- study/retrieval/speak
    result      TEXT NOT NULL,    -- correct/wrong
    time_spent  INTEGER,          -- 밀리초
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (item_id) REFERENCES learning_items(id)
);
```

### 구현 위치
- `backend/database.py` — SQLite 연결 + 테이블 생성
- `backend/models.py` — Pydantic 모델 (API 요청/응답)
- `backend/main.py` — DB 초기화 (앱 시작 시)

### 완료 기준
- [ ] `backend/database.py` 작성, 앱 시작 시 테이블 자동 생성
- [ ] `/health` 응답에 DB 연결 상태 포함
- [ ] `curl http://localhost:8000/health` → `{"db": "ok"}` 확인

---

## P2-02. Learning Item 시드 데이터

**목표**: `content/basic_Spanish_one_step_markdown_study.md` 교재 기반 초기 학습 데이터 입력

**상태**: ⏳ 대기 중 (P2-01 완료 후)

### 시드 데이터 구성 (1차: A1-M1~M2, CURRICULUM_DESIGN.md 기준)

| 모듈 | 타입 | 수량 | 내용 |
|------|------|------|------|
| A1-M1 | 발음/문법 | 100개 | 알파벳, 발음 규칙, 강세, 명사, 관사 |
| A1-M2 | 표현/단어 | 100개 | 인사 표현, 인칭대명사, ser 활용, 예문 |

### 구현 위치
- `backend/seed.py` — 시드 데이터 정의 + DB 삽입 함수
- `backend/main.py` — 앱 시작 시 시드 여부 확인 후 1회 실행

### 완료 기준
- [ ] `GET /items` → 35개 이상 Learning Item 반환
- [ ] 레벨별 필터 `GET /items?level=A1` 작동
- [ ] 타입별 필터 `GET /items?type=word` 작동

---

## P2-03. SRS 엔진 (SM-2 알고리즘)

**목표**: 학습 이력 기반 자동 복습 스케줄링 — "성공하면 간격 늘리고, 실패하면 간격 줄인다"

**상태**: ⏳ 대기 중 (P2-01 완료 후)

### SM-2 알고리즘

```python
def calculate_next_review(ease_factor, interval, quality):
    """
    quality: 0~5 (0~2: 실패, 3~5: 성공)
    """
    if quality < 3:
        interval = 1
        ease_factor = max(1.3, ease_factor - 0.2)
    else:
        if interval == 1:
            interval = 6
        else:
            interval = round(interval * ease_factor)
        ease_factor = ease_factor + 0.1 - (5 - quality) * 0.08

    next_review_at = datetime.now() + timedelta(days=interval)
    return ease_factor, interval, next_review_at
```

### API 엔드포인트

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `GET /review/today` | GET | 오늘 복습할 Item 목록 |
| `POST /review/result` | POST | 복습 결과 기록 + next_review_at 재계산 |
| `GET /progress/stats` | GET | 전체 진척도 통계 |

### 완료 기준
- [ ] `POST /review/result` 호출 시 `next_review_at` 자동 업데이트
- [ ] quality=5 → interval 증가 확인
- [ ] quality=1 → interval=1 리셋 확인
- [ ] `GET /review/today` → 오늘 복습 대상만 반환 확인

---

## P2-04. 루틴 설정 화면 (S-07)

**목표**: 사용자가 직접 요일/시간/학습타입을 설정 → 알림 스케줄 저장

**상태**: ⏳ 대기 중 (P2-01 완료 후)

### 화면 구성

```
[루틴 설정]
┌─────────────────────────────┐
│  + 루틴 추가                 │
├─────────────────────────────┤
│  🌅 06:00  매일  인사말      │ ← 슬라이드 삭제
│  📚 13:00  평일  새 학습     │
│  🌙 21:00  매일  일기 쓰기   │
└─────────────────────────────┘

[루틴 추가 모달]
- 시간 선택 (TimePicker)
- 요일 선택 (토글: 월화수목금토일)
- 학습 타입 선택 (6종 중 선택)
- 저장
```

### DB 스키마 추가

```sql
CREATE TABLE routines (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL DEFAULT 'local',
    learning_type   TEXT NOT NULL,   -- greeting/new_learning/diary 등
    hour            INTEGER NOT NULL,
    minute          INTEGER NOT NULL,
    days_of_week    TEXT NOT NULL,   -- JSON: [1,2,3,4,5] (월~금)
    is_active       INTEGER NOT NULL DEFAULT 1
);
```

### 구현 위치
- `mobile/src/screens/SettingsScreen.tsx` → `RoutineScreen.tsx` 분리
- `backend/main.py` — `GET/POST/DELETE /routines` 추가

### 완료 기준
- [ ] 루틴 추가 → 목록에 표시
- [ ] 루틴 삭제 → 목록에서 제거
- [ ] 저장된 루틴이 앱 재시작 후에도 유지
- [ ] 저장된 루틴 기반으로 백엔드 APScheduler 스케줄 자동 갱신

---

## P2-05. 학습 기록 화면 (S-08)

**목표**: 학습 통계 + 오늘 복습 목록 + 오답 패턴 시각화

**상태**: ⏳ 대기 중 (P2-03 완료 후)

### 화면 구성

```
[학습 기록]
┌─────────────────────────────┐
│  🔥 스트릭: 7일              │
│  총 학습 아이템: 42개         │
│  오늘 복습 대상: 8개          │
├─────────────────────────────┤
│  [오늘 복습하기] ←── CTA     │
├─────────────────────────────┤
│  단계별 현황                 │
│  Study    ████░░  28개       │
│  Retrieval ██░░░  10개       │
│  Spacing  █░░░░   3개        │
│  Mastered █░░░░   1개        │
├─────────────────────────────┤
│  자주 틀리는 유형             │
│  문법 > 표현 > 단어           │
└─────────────────────────────┘
```

### API

| 경로 | 설명 |
|------|------|
| `GET /progress/stats` | 전체 통계 (스트릭, 단계별 수량) |
| `GET /review/today` | 오늘 복습 대상 목록 |
| `GET /progress/errors` | 자주 틀린 유형 분석 |

### 구현 위치
- `mobile/src/screens/RecordsScreen.tsx` — 플레이스홀더 → 실제 구현

### 완료 기준
- [ ] 스트릭 일수 표시
- [ ] 단계별(study/retrieval/spacing/mastered) 아이템 수 표시
- [ ] "오늘 복습하기" 버튼 → ChatScreen으로 이동 (review 타입)
- [ ] 자주 틀리는 유형 1~3위 표시

---

## P2-06. 개인화 알림 (SRS 연동)

**목표**: 고정 시간 알림 → SRS 기반 동적 알림 ("오늘 복습할 것이 8개 있어요!")

**상태**: ⏳ 대기 중 (P2-03, P2-04 완료 후)

### 변경 내용 (MVP 대비)

| | MVP (D-06) | Phase 2 (P2-06) |
|---|---|---|
| 알림 시간 | 하드코딩 (6시/9시/21시) | 사용자 루틴 설정 기반 |
| 알림 내용 | 고정 문구 | 오늘 복습 수 포함 동적 문구 |
| 딥링크 | ChatScreen (학습 타입) | ChatScreen (review 타입 우선) |

### 알림 문구 예시
```
🌅 좋은 아침이에요! 오늘 복습할 표현이 5개 있어요.
📚 [시작하기]
```

### 완료 기준
- [ ] 루틴 설정 변경 시 APScheduler 스케줄 자동 갱신
- [ ] 알림 문구에 오늘 복습 수 동적 포함
- [ ] 알림 탭 → 복습 타입 ChatScreen 진입

---

## P2-07. 음성 입력 STT

**목표**: 타이핑 없이 말하기로 답변 입력 → Speaking Engine 첫 단계

**상태**: ⏳ 대기 중 (P2-03 완료 후)

### 구현 범위

- `expo-speech-recognition` 또는 `@react-native-voice/voice` 패키지
- ChatScreen 입력창 옆 마이크 버튼 추가
- 녹음 중 → 텍스트 변환 → 입력창 자동 채움
- 한국어/스페인어 언어 전환 지원

### 완료 기준
- [ ] 마이크 버튼 탭 → 녹음 시작
- [ ] 말하기 완료 → 입력창에 텍스트 자동 입력
- [ ] 스페인어 발화 인식 정확도 기본 수준 확인
- [ ] 실 기기(iPhone)에서 동작 확인

---

## 개발 순서 (의존성 기준)

```
P2-01 DB 스키마
    ↓
P2-02 시드 데이터    P2-03 SRS 엔진
    ↓                    ↓
    └──────┬─────────────┘
           ↓
    P2-04 루틴 설정    P2-05 학습 기록
           ↓
    P2-06 개인화 알림
           ↓
    P2-07 STT (독립 진행 가능)
```

---

## 현재 진행 상태

- [x] **P2-01**: SQLite DB 스키마 ✅
- [ ] **P2-02**: Learning Item 시드 데이터 ← **다음 작업**
- [ ] **P2-03**: SRS 엔진
- [ ] **P2-04**: 루틴 설정 화면
- [ ] **P2-05**: 학습 기록 화면
- [ ] **P2-06**: 개인화 알림
- [ ] **P2-07**: 음성 입력 STT
