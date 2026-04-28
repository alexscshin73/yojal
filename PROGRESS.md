# PROGRESS — 인수인계 노트

> 새 세션 시작 시 이 파일을 읽어 현재 상태를 파악한다.
> 세션 종료 시 반드시 업데이트한다.

---

## 현재 상태 (2026-04-27)

**현재 게이트**: Phase 2 진행 중  
**완료된 마일스톤**: D-01~D-06 (MVP) + P2-01 + P2-02 + P2-03 + P2-04  
**다음 할 일**: P2-05 학습 기록 화면 → PHASE2.md 참고

---

## 게이트 현황

- [x] **기획 게이트**: PLANNING.md 완성 + 승인 ✅
- [x] **설계 게이트**: DESIGN.md 화면별 상세 UI + 승인 ✅
- [x] **개발 게이트**: FEATURES.md 기능별 완료 기준 + 승인 ✅

---

## 완료된 작업

| 태스크 | 내용 | 날짜 |
|--------|------|------|
| D-01 | Ollama 설치 + llama3.3:latest (42GB) 로드, RTX 5090 x2 GPU 100% 활용 | 2026-04-23 |
| D-02 | FastAPI 백엔드 — /health, /chat, /chat/start, 6가지 학습 타입 프롬프트 | 2026-04-23 |
| D-03 | Expo 앱 — 하단 탭 3개, Teal 브랜드, 실 기기 확인 | 2026-04-23 |
| D-04 | ChatScreen — AI 교정 카드, 힌트 패널, 폰트 크기 토글, 실 기기 확인 | 2026-04-23 |
| D-04+ | SSE 스트리밍 — 백엔드 /chat/stream, /chat/start/stream 추가, 앱 token-by-token 출력 | 2026-04-24 |
| UI | 20단계 스페인어 커리큘럼 구조화 (curriculum.py), 한국어 전용 강제 규칙 | 2026-04-24 |
| UI | AI 교정 블록 파싱 (⚠️ 내 답 / 정답 / 설명) → 별도 카드 렌더링 | 2026-04-24 |
| UI | 브랜드명 "조잘재잘" → **"PicoPico"** 변경 | 2026-04-24 |
| Fix | SSE 스트리밍: response.body.getReader() → XMLHttpRequest.onprogress 교체 (React Native 호환) | 2026-04-27 |
| D-05 | Cloudflare Tunnel — picopico.carroamix.com → localhost:8000, 모바일 데이터 실기기 확인 | 2026-04-27 |
| D-06 | 푸시 알림 — APScheduler(6시/9시/21시) + Expo Push + 딥링크(알림 탭→ChatScreen) 실기기 확인 | 2026-04-27 |
| P2-01 | SQLite DB 스키마 — 5테이블 + 멀티유저 JWT 인증 (register/login/me) | 2026-04-27 |
| P2-02 | Learning Item 시드 데이터 — A1-M1(50) + A1-M2(50) = 100개, GET /items 확인 | 2026-04-27 |
| P2-03 | SRS 엔진 — SM-2 알고리즘 (backend/srs.py), /review/today + /review/result + /progress/stats | 2026-04-27 |
| P2-04a | 커리큘럼 페이스 시스템 — 365일 완성 기준, 레벨별 DEFAULT_PACE, /learning/today, /settings/pace | 2026-04-27 |
| P2-04b | HomeScreen 재설계 — 오늘 학습 현황 카드, 모듈 진행 바, 신규/복습 버튼, 빠른 학습 그리드 | 2026-04-27 |
| P2-04c | RoutineScreen 신설 — 루틴 CRUD (▲▼ 시간 선택 + 요일 토글 + 4가지 학습 타입) | 2026-04-27 |
| P2-04d | SettingsScreen 재설계 — 프로필 카드 + 루틴 설정 진입 + 로그아웃 | 2026-04-27 |
| Fix | expo-notifications API 변경 대응 — shouldShowBanner, shouldShowList 추가 | 2026-04-27 |

---

## Phase 2 진행 상태

- [x] **P2-01**: SQLite DB 스키마 ✅
- [x] **P2-02**: Learning Item 시드 데이터 ✅
- [x] **P2-03**: SRS 엔진 (SM-2) ✅
- [x] **P2-04**: 루틴 설정 화면 + 커리큘럼 페이스 시스템 ✅
- [ ] **P2-05**: 학습 기록 화면 ← **다음 작업**
- [ ] **P2-06**: 개인화 알림 (SRS 연동)
- [ ] **P2-07**: 음성 입력 STT

---

## 세션 기록

| 날짜 | 작업 내용 | 결과 |
|------|-----------|------|
| 2026-04-23 | 프로젝트 초기 설정, 방법론 정의, PLANNING.md 작성 | 완료 |
| 2026-04-23 | D-01~D-04 연속 완료 — Ollama, FastAPI, Expo, ChatScreen | 완료 |
| 2026-04-24 | SSE 스트리밍 구현, 브랜드 PicoPico로 변경, UI 디테일 수정 | 완료 |
| 2026-04-27 | SSE XHR 수정, D-05 Cloudflare Tunnel, D-06 푸시 알림, **MVP 완성** | 완료 |
| 2026-04-27 | P2-01~P2-03: DB 스키마, 시드 데이터, SRS 엔진, 실기기 통합 테스트 통과 | 완료 |
| 2026-04-27 | P2-04: 커리큘럼 페이스 시스템, HomeScreen 재설계, RoutineScreen, SettingsScreen | 완료 |

---

## 알려진 문제 / 주의사항

- **Ollama는 scshin 유저로 직접 실행해야 GPU 감지됨** (systemd 서비스 아님)
- **백엔드 수동 실행**: `nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/picopico_backend.log 2>&1 &`
- **Expo 개발 서버**: `npx expo start --port 8085` (8081 = VSCode Remote 선점)
- **Cloudflare Tunnel**: `nohup cloudflared tunnel run --token eyJh...` → `/tmp/picopico_tunnel.log`
- **SQLite 복습 쿼리**: `date('now')` 사용 필수 — `datetime('now')`는 UTC라 당일 복습 아이템 누락 가능
