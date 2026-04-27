# PROGRESS — 인수인계 노트

> 새 세션 시작 시 이 파일을 읽어 현재 상태를 파악한다.
> 세션 종료 시 반드시 업데이트한다.

---

## 현재 상태 (2026-04-27)

**현재 게이트**: 개발 게이트 ✅ 승인 완료 — 개발 진행 중  
**완료된 마일스톤**: D-01 ~ D-05 (외부 접속 완성)  
**다음 할 일**: D-06 푸시 알림 → MVP 완성

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
| UI | 홈 우측상단 앵무새 아이콘/텍스트 크기 독립 제어 | 2026-04-24 |
| Fix | SSE 스트리밍: response.body.getReader() → XMLHttpRequest.onprogress 교체 (React Native 호환) | 2026-04-27 |
| D-05 | Cloudflare Tunnel — picopico.carroamix.com → localhost:8000, 모바일 데이터 실기기 확인 | 2026-04-27 |

---

## 진행 중 / 대기 중

- [x] **D-05**: Cloudflare Tunnel — picopico.carroamix.com ✅
- [ ] **D-06**: 푸시 알림 (APScheduler + Expo Push) ← **다음 작업**

---

## 세션 기록

| 날짜 | 작업 내용 | 결과 |
|------|-----------|------|
| 2026-04-23 | 프로젝트 초기 설정, 방법론 정의, PLANNING.md 작성 | 완료 |
| 2026-04-23 | D-01~D-04 연속 완료 — Ollama, FastAPI, Expo, ChatScreen | 완료 |
| 2026-04-24 | SSE 스트리밍 구현 (백엔드 + 앱), 브랜드 PicoPico로 변경, UI 디테일 수정 | 완료 |
| 2026-04-27 | SSE XHR 수정, D-05 Cloudflare Tunnel (picopico.carroamix.com), 폴더명 yojal→picopico 정리 | 완료 |

---

## 알려진 문제 / 주의사항

- **Ollama는 scshin 유저로 직접 실행해야 GPU 감지됨** (systemd 서비스 아님)
  - 실행: `nohup ollama serve > /tmp/ollama.log 2>&1 &`
  - 확인: `curl http://localhost:11434/api/tags`
- **백엔드는 수동 실행**: `cd ~/projects/picopico/backend && nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/picopico_backend.log 2>&1 &`
- **Expo 개발 서버**: VSCode 터미널에서 `cd ~/projects/picopico/mobile && npx expo start --port 8085`
- Expo 기본 포트 8081은 VSCode Remote가 선점 → 8085 사용
- API_BASE_URL은 `mobile/src/config.ts`에서 관리 (현재: `https://picopico.carroamix.com`)
- **Cloudflare Tunnel**: `nohup cloudflared tunnel run --token eyJh...` → `/tmp/picopico_tunnel.log`
- qwen2.5:7b-instruct 이미 설치됨 (llama3.3 70B 대비 응답속도 개선 목적, 미적용)
