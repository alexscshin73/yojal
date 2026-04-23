# PROGRESS — 인수인계 노트

> 새 세션 시작 시 이 파일을 읽어 현재 상태를 파악한다.
> 세션 종료 시 반드시 업데이트한다.

---

## 현재 상태 (2026-04-23)

**현재 게이트**: 개발 게이트 ✅ 승인 완료 — 개발 진행 중
**현재 작업**: D-04 채팅 화면 + AI 대화
**다음 할 일**: D-04 완료 → D-05 Cloudflare Tunnel

---

## 게이트 현황

- [x] **기획 게이트**: PLANNING.md 완성 + 승인 ✅
  - [x] 서비스 정의
  - [x] 핵심 컨셉
  - [x] AI 전략
  - [x] 기술 스택
  - [x] 아키텍처
  - [x] 화면 목록 (SCREENS.md)
  - [x] MVP 범위
- [x] **설계 게이트**: 화면별 상세 UI 설계 + 승인 ✅ (DESIGN.md)
- [x] **개발 게이트**: 기능별 완료 기준 명시 + 승인 ✅ (FEATURES.md)

---

## 완료된 작업

- [x] GitHub 저장소 연결
- [x] Harness Engineering 방법론 문서화 (CLAUDE.md, PROGRESS.md, FEATURES.md)
- [x] PLANNING.md 생성 (기획 결정사항 저장)
- [x] CLAUDE.md 강화 (단계 게이트 규칙 추가)
- [x] bunny-app 분석 (재활용 가능한 기술 파악)
- [x] AI 전략 결정 (Ollama 로컬 LLM)
- [x] 아키텍처 결정 (FastAPI + Expo + Cloudflare)
- [x] MVP 범위 결정

---

## 진행 중인 작업

- [x] D-01: Ollama 설치 + 모델 로드 ✅
- [x] D-02: FastAPI 백엔드 기본 구조 ✅
- [x] D-03: Expo 앱 기본 구조 ✅
- [ ] D-04: 채팅 화면 + AI 대화 ← **지금 여기**
- [ ] D-03: Expo 앱 기본 구조
- [ ] D-04: 채팅 화면 + AI 대화
- [ ] D-05: Cloudflare Tunnel 연결
- [ ] D-06: 푸시 알림

---

## 세션 기록

| 날짜 | 작업 내용 | 결과 |
|------|-----------|------|
| 2026-04-23 | 프로젝트 초기 설정, 방법론 정의 | 완료 |
| 2026-04-23 | bunny-app 분석, AI/아키텍처 전략 결정 | 완료 |
| 2026-04-23 | Harness Engineering 방법론 제대로 적용 | 완료 |
| 2026-04-23 | PLANNING.md 생성, CLAUDE.md 강화 | 완료 |
| 2026-04-23 | D-01: Ollama 설치 + llama3.3 로드, GPU 100% 활용 확인 | 완료 |
| 2026-04-23 | D-02: FastAPI 백엔드 /health + /chat + /chat/start + 6가지 프롬프트 | 완료 |

---

## 알려진 문제 / 주의사항

- Next.js 코드가 있지만 실제로는 모바일 앱(Expo)으로 개발 예정 → 나중에 정리 필요
- Ollama 아직 설치 안 됨 (개발 게이트 통과 후 설치)
