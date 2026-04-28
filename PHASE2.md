# PHASE2 — 개발 실행 계획

> MVP(D-01~D-06) 완료 기준: 2026-04-27
> Phase 2 완료 기준: 2026-04-28 (코드 기준)
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
| P2-02 | Learning Item 시드 데이터 (A1-M1~M2, 100개) | P2-01 | ✅ 완료 |
| P2-03 | SRS 엔진 (SM-2) | P2-01 | ✅ 완료 |
| P2-04 | 루틴 설정 화면 + 커리큘럼 페이스 시스템 | P2-01 | ✅ 완료 |
| P2-05 | 학습 기록 화면 (S-08) | P2-03 | ✅ 완료 |
| P2-06 | 개인화 알림 (SRS 연동) | P2-03, P2-04 | ✅ 완료 |
| P2-07 | 음성 입력 STT | P2-03 | ✅ 코드 완성 / ⏳ 실기기 테스트 대기 |

---

## P2-01. SQLite DB 스키마 ✅

**완료 (2026-04-27)**

6테이블: `users`, `learning_items`, `user_progress`, `study_log`, `routines`, `user_settings`, `user_push_tokens`

---

## P2-02. Learning Item 시드 데이터 ✅

**완료 (2026-04-27)**

- A1-M1: 50개 (발음 규칙, 관사, 명사, 숫자, 색깔)
- A1-M2: 50개 (인사, 인칭대명사, ser 활용, 직업, 의문사)
- `backend/seed.py` — INSERT OR IGNORE로 중복 방지

---

## P2-03. SRS 엔진 (SM-2 알고리즘) ✅

**완료 (2026-04-27)**

```python
# backend/srs.py
def calculate_next_review(ease_factor, interval, quality):
    if quality < 3:
        interval = 1
        ease_factor = max(1.3, ease_factor - 0.2)
    else:
        interval = 6 if interval == 1 else round(interval * ease_factor)
        ease_factor = max(1.3, ease_factor + 0.1 - (5 - quality) * 0.08)
    next_review_at = (date.today() + timedelta(days=interval)).isoformat()
    return round(ease_factor, 3), interval, next_review_at
```

엔드포인트: `GET /review/today`, `POST /review/result`, `GET /progress/stats`

---

## P2-04. 루틴 설정 + 커리큘럼 페이스 시스템 ✅

**완료 (2026-04-27)**

### 365일 완성 기준 기본 페이스
| 레벨 | 일일 신규 | 총 아이템 |
|------|-----------|-----------|
| A1 | 5개 | 250개 |
| A2 | 4개 | 400개 |
| B1/B2 | 7개 | 500개 |
| C1/C2 | 14개 | 400/250개 |

엔드포인트: `GET/PATCH /settings/pace`, `GET /learning/today`  
화면: `RoutineScreen.tsx` (CRUD), `HomeScreen.tsx` (현황 카드)

---

## P2-05. 학습 기록 화면 ✅

**완료 (2026-04-28)**

`mobile/src/screens/RecordsScreen.tsx`:
- 연속 학습일(스트릭) + 총 아이템 수 + 오늘 학습 수
- 복습 대기 CTA → ChatScreen(review)
- 단계별 현황 바 (study / retrieval / spacing / mastered)
- 오답 유형 랭킹 (`GET /progress/errors`)

---

## P2-06. 개인화 알림 ✅

**완료 (2026-04-28)**

| 항목 | MVP | P2-06 |
|------|-----|-------|
| 토큰 저장 | 파일(/tmp) 익명 | user_push_tokens DB, JWT 연결 |
| 알림 문구 | 고정 | 복습 수 동적 포함 |
| 딥링크 | 루틴 타입 | 복습 있으면 review 우선 |

`fire_push_for_type(learning_type)`: 모든 등록 유저의 due 복습 수 조회 → 유저별 동적 메시지 발송

---

## P2-07. 음성 입력 STT ✅ (코드 완성)

**완료 (2026-04-28) — 실기기 테스트 대기**

- 패키지: `expo-speech-recognition` 3.1.3
- 위치: `ChatScreen.tsx` 입력창
- 기능: 🇪🇸/🇰🇷 언어 토글 + 🎤 마이크 버튼
- **Dev Build 필요** (Expo Go 미지원)

### 완료 기준 현황
- [x] 마이크 버튼 탭 → 녹음 시작/중지
- [x] 결과 → 입력창 자동 채움 (실시간 interim results)
- [x] 한국어/스페인어 전환
- [ ] 스페인어 인식 정확도 확인 — Dev Build 테스트 필요
- [ ] 실기기 동작 확인 — Dev Build 테스트 필요

### Dev Build 진행 방법
```bash
export PATH="/home/scshin/.local/opt/node/node-v22.22.2-linux-x64/bin:$PATH"
cd ~/projects/picopico/mobile

# iOS (Apple Developer 계정 활성화 후)
eas build --platform ios --profile development

# Android (무료, 즉시 가능)
eas build --platform android --profile development
```

---

## 현재 진행 상태

- [x] **P2-01**: SQLite DB 스키마 ✅
- [x] **P2-02**: Learning Item 시드 데이터 ✅
- [x] **P2-03**: SRS 엔진 ✅
- [x] **P2-04**: 루틴 설정 + 커리큘럼 페이스 ✅
- [x] **P2-05**: 학습 기록 화면 ✅
- [x] **P2-06**: 개인화 알림 ✅
- [x] **P2-07**: STT 코드 완성 ✅ / 실기기 테스트 ⏳

## 다음 과제

- Dev Build로 STT 실기기 테스트
- 시드 데이터 확충 (A1-M3 이후)
- 실사용 피드백 기반 UX 개선
