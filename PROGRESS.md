# PROGRESS — 인수인계 노트

> 새 세션 시작 시 이 파일을 읽어 현재 상태를 파악한다.
> 세션 종료 시 반드시 업데이트한다.

---

## 현재 상태 (2026-04-28)

**현재 단계**: Phase 2 전체 코드 완성  
**완료**: D-01~D-06 (MVP) + P2-01~P2-07 (Phase 2 전체)  
**남은 것**: STT Dev Build 테스트 + 콘텐츠 확충 (A1-M3 이후 시드 데이터)

---

## 완료된 작업 전체 목록

| 태스크 | 내용 | 날짜 |
|--------|------|------|
| D-01 | Ollama + llama3.3:latest (42GB), RTX 5090 x2 GPU 활용 | 2026-04-23 |
| D-02 | FastAPI 백엔드 — /health, /chat, 6가지 학습 타입 프롬프트 | 2026-04-23 |
| D-03 | Expo 앱 — 하단 탭 3개, Teal 브랜드, 실기기 확인 | 2026-04-23 |
| D-04 | ChatScreen — AI 교정 카드, 힌트 패널, 폰트 크기 토글 | 2026-04-23 |
| D-04+ | SSE 스트리밍 — XHR 기반 (React Native body.getReader 미지원) | 2026-04-24 |
| UI | 커리큘럼 구조화 (curriculum.py), 한국어 전용 강제, 브랜드명 PicoPico | 2026-04-24 |
| D-05 | Cloudflare Tunnel — picopico.carroamix.com → localhost:8000 | 2026-04-27 |
| D-06 | 푸시 알림 — APScheduler + Expo Push + 딥링크, 실기기 확인 | 2026-04-27 |
| P2-01 | SQLite DB 스키마 — 6테이블 + 멀티유저 JWT 인증 | 2026-04-27 |
| P2-02 | Learning Item 시드 — A1-M1(50) + A1-M2(50) = 100개 | 2026-04-27 |
| P2-03 | SRS 엔진 — SM-2 알고리즘 (srs.py), /review/today, /review/result, /progress/stats | 2026-04-27 |
| P2-04 | 커리큘럼 페이스 시스템 (365일 기준) + /learning/today + /settings/pace | 2026-04-27 |
| P2-04 | HomeScreen 재설계 — 모듈 진행 바, 신규/복습 버튼, 빠른 학습 그리드 | 2026-04-27 |
| P2-04 | RoutineScreen — 루틴 CRUD (▲▼ 시간 선택 + 요일 토글 + 4가지 학습 타입) | 2026-04-27 |
| P2-04 | SettingsScreen 재설계 — 프로필 카드 + 루틴 진입 + 로그아웃 | 2026-04-27 |
| P2-05 | RecordsScreen — 스트릭, 단계별 현황 바, 복습 CTA, 오답 유형 랭킹 | 2026-04-28 |
| P2-05 | 백엔드 /progress/errors — 자주 틀린 유형 상위 3개 | 2026-04-28 |
| P2-06 | 개인화 알림 — 복습 수 동적 문구 + 유저별 push 토큰 DB 저장 | 2026-04-28 |
| P2-06 | /register-token JWT 인증 필수화, App.tsx 로그인 후 등록 | 2026-04-28 |
| P2-07 | STT — expo-speech-recognition, ChatScreen 마이크 버튼, 언어 토글 | 2026-04-28 |
| Build | eas.json, expo-dev-client 설치, bundleIdentifier 설정 | 2026-04-28 |

---

## Phase 2 진행 상태

- [x] **P2-01**: SQLite DB 스키마 ✅
- [x] **P2-02**: Learning Item 시드 데이터 ✅
- [x] **P2-03**: SRS 엔진 (SM-2) ✅
- [x] **P2-04**: 루틴 설정 + 커리큘럼 페이스 시스템 ✅
- [x] **P2-05**: 학습 기록 화면 ✅
- [x] **P2-06**: 개인화 알림 ✅
- [x] **P2-07**: 음성 입력 STT (코드 완성 ✅ / 실기기 테스트 ⏳ Dev Build 필요)

---

## 남은 작업

### 즉시 가능
- [ ] Expo Go로 P2-01~P2-06 실기기 통합 테스트
- [ ] Android Dev Build → STT 테스트

### Apple Developer 계정 활성화 후
- [ ] iOS Dev Build (`eas build --platform ios --profile development`)
- [ ] STT iOS 실기기 테스트 (es-ES / ko-KR 인식 확인)

### 콘텐츠
- [ ] A1-M3 ~ A1-M5 시드 데이터 추가 (현재 A1-M1, M2 100개만 있음)
- [ ] A2 이후 모듈 시드 데이터

---

## 세션 기록

| 날짜 | 작업 내용 |
|------|-----------|
| 2026-04-23 | D-01~D-04: 초기 설정, Ollama, FastAPI, Expo, ChatScreen |
| 2026-04-24 | SSE 스트리밍, PicoPico 브랜드, AI 교정 블록 파싱 |
| 2026-04-27 | D-05~D-06: Cloudflare Tunnel, 푸시 알림, MVP 완성 |
| 2026-04-27 | P2-01~P2-04: DB 스키마, 시드, SRS, 커리큘럼 페이스, 루틴, 홈 화면 |
| 2026-04-28 | P2-05~P2-07: 학습 기록, 개인화 알림, STT 코드 완성, EAS 빌드 설정 |

---

## 알려진 문제 / 주의사항

- **eas 명령어 PATH 없음**: `export PATH="/home/scshin/.local/opt/node/node-v22.22.2-linux-x64/bin:$PATH"`
- **Apple Developer 계정**: alexscshin@gmail.com 가입 완료, 팀 활성화 대기 중
- **STT Expo Go 미지원**: expo-speech-recognition은 Dev Build에서만 동작
- **Ollama GPU**: scshin 유저로 직접 실행해야 감지 (`nohup ollama serve ...`)
- **SQLite 복습 쿼리**: `date('now')` 사용 필수 (`datetime('now')`는 UTC → 당일 누락 가능)
- **Expo 포트**: 8081 금지(VSCode Remote 선점), `--port 8085` 사용
