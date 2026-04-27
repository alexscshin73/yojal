# FEATURES — 기능 로드맵 + 완료 기준

> 상태: 개발 게이트 ✅ 승인 완료 (2026-04-23)

---

## 개발 게이트 — MVP 완료 기준

### D-01. Ollama 설치 + 모델 로드
**상태**: ✅ 완료 (2026-04-23)

- Ollama 설치, llama3.3:latest (42GB Q4) 로드 완료
- RTX 5090 x2 GPU 100% 활용 확인
- 터미널에서 스페인어 질문 → 스페인어 응답 확인

**운영 방법**:
```bash
# Ollama는 반드시 scshin 유저로 직접 실행 (systemd 사용 금지 — GPU 미감지됨)
nohup ollama serve > /tmp/ollama.log 2>&1 &

# 확인
curl http://localhost:11434/api/tags
```

**핵심 옵션** (모든 API 호출에 필수):
```json
{ "num_ctx": 4096, "num_gpu": 99, "num_predict": 600 }
```
- `num_ctx: 4096` — 기본 128K는 VRAM 초과(54GB 필요)하여 강제 제한
- `num_gpu: 99` — GPU 레이어 최대 사용

---

### D-02. FastAPI 백엔드
**상태**: ✅ 완료 (2026-04-23, 스트리밍 추가 2026-04-24)

**엔드포인트**:
| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/health` | GET | 헬스체크 |
| `/curriculum` | GET | 20단계 커리큘럼 목록 |
| `/chat/start/stream` | POST | AI 첫 메시지 (SSE 스트리밍) |
| `/chat/stream` | POST | 대화 계속 (SSE 스트리밍) |
| `/chat/start` | POST | AI 첫 메시지 (non-streaming fallback) |
| `/chat` | POST | 대화 계속 (non-streaming fallback) |

**파일 구조**:
```
backend/
├── main.py        — FastAPI 앱, 라우터, Ollama 호출
├── prompts.py     — 6가지 학습 타입 시스템 프롬프트
├── curriculum.py  — 20단계 커리큘럼 + get_level_prompt()
└── .env           — OLLAMA_MODEL, OLLAMA_BASE_URL, NUM_CTX
```

**실행**:
```bash
cd ~/projects/picopico/backend
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/picopico_backend.log 2>&1 &
```

---

### D-03. Expo 앱 기본 구조
**상태**: ✅ 완료 (2026-04-23)

- Stack Navigator (홈, 채팅) + Bottom Tab Navigator (홈/기록/설정)
- Teal 브랜드 컬러 (#00897B) 적용
- 실 기기(iPhone) Expo Go 확인 완료

**실행**:
```bash
# VSCode 터미널에서 실행 (포트 8081은 VSCode Remote 선점 → 8085 사용)
cd ~/projects/picopico/mobile
npx expo start --port 8085
```

**설정 파일**:
- `mobile/src/config.ts` — `API_BASE_URL = "http://192.168.100.169:8000"`

---

### D-04. 채팅 화면 + AI 대화
**상태**: ✅ 완료 (2026-04-23, 스트리밍 추가 2026-04-24)

**구현된 기능**:
- SSE 스트리밍: 토큰 단위로 텍스트 실시간 출력
- AI 교정 파싱: `⚠️ 내 답 / 정답 / 설명` 블록을 별도 카드로 렌더링
- 교정 카드: 오렌지 배경, 내 답(빨간)/정답(초록) 색상 구분, 우측 정렬
- 힌트 패널: 학습 타입별 힌트 3개, 하단 슬라이드 모달
- 폰트 크기 토글: Aa 버튼으로 13 / 15 / 17px 순환
- 마스코트: 🦜 앵무새 + AI 말풍선 (teal 배경)

**파일**: `mobile/src/screens/ChatScreen.tsx`

**API 연동** (`mobile/src/services/api.ts`):
- `streamStart(learningType, level, day, onToken)` — 초기 메시지 스트리밍
- `streamChat(message, learningType, history, level, day, onToken)` — 대화 스트리밍

---

### D-05. Cloudflare Tunnel 연결
**상태**: ⏳ 대기 중 ← **다음 작업**

**완료 기준**:
- 집 밖 모바일 데이터 환경에서 앱 실행
- `/chat/start/stream` SSE 스트리밍이 터널 통해서도 정상 작동
- `API_BASE_URL`을 터널 도메인으로 변경

**참고**: bunny-app에 기존 Cloudflare Tunnel 설정 존재 — 재활용 예정

---

### D-06. 푸시 알림
**상태**: ⏳ 대기 중

**완료 기준**:
- 루틴 시간에 실제 폰으로 알림 수신
- 알림 문구에 학습 타입 표시 (예: "🌅 인사말 시간이에요!")
- 알림 탭하면 해당 학습 타입으로 ChatScreen 진입

**구현 계획**:
- 백엔드: APScheduler로 시간 기반 트리거
- 앱: Expo Push Notifications (`expo-notifications`)
- 딥링크: `navigation.navigate("Chat", { learningType })`

---

## 개발 순서

```
D-01 ✅ → D-02 ✅ → D-03 ✅ → D-04 ✅ → D-05 ⏳ → D-06 ⏳
Ollama    백엔드    앱뼈대    핵심기능    외부접속    알림
```

---

## Phase 2 — 루틴 (MVP 이후)

- 루틴 설정 화면 (S-07) — 사용자가 시간/요일 직접 설정
- 학습 이력 저장 (배운 단어, 오답 DB)
- 홈 화면 스트릭 연동 (실제 데이터)
- 학습 타입별 AI 프롬프트 고도화

## Phase 3 — 완성도

- 단어장 / 오답노트 (S-08)
- TTS (AI 목소리)
- STT (사용자 음성 입력)
- 앱스토어 출시
