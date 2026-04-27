# HANDOVER — 2026-04-24 (금) → 2026-04-28 (월)

> 이 파일을 월요일 세션 시작 전에 읽는다.
> 읽는 순서: HANDOVER.md → CLAUDE.md → PLANNING.md → PROGRESS.md → FEATURES.md

---

## 지금 어디까지 됐나

MVP의 핵심 기능(채팅 + AI 교정 + 스트리밍)이 완성된 상태다.
실제 iPhone에서 Expo Go로 접속해 스페인어 AI 대화가 작동한다.
남은 것은 외부 접속(D-05)과 푸시 알림(D-06) 두 가지뿐이다.

---

## 지금 당장 시작하려면

### 1. Ollama 켜기 (GPU LLM 서버)
```bash
# scshin 유저 터미널에서 — systemd 서비스 말고 직접 실행
nohup ollama serve > /tmp/ollama.log 2>&1 &

# 확인
curl http://localhost:11434/api/tags
```

### 2. 백엔드 켜기 (FastAPI)
```bash
cd ~/projects/picopico/backend
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/picopico_backend.log 2>&1 &

# 확인
curl http://192.168.100.169:8000/health
```

### 3. 앱 개발 서버 켜기 (Expo)
```bash
# VSCode 터미널에서 실행 — 포트 8081은 VSCode Remote가 선점하므로 8085 사용
cd ~/projects/picopico/mobile
npx expo start --port 8085
```

→ QR 코드가 터미널에 뜨면 iPhone Expo Go로 스캔

---

## 이번 주(4/24) 완료된 작업

| 작업 | 내용 |
|------|------|
| SSE 스트리밍 | 백엔드에 `/chat/stream`, `/chat/start/stream` 추가. 앱에서 token-by-token 실시간 출력 |
| 브랜드 변경 | "조잘재잠" → **"PicoPico"** (홈 화면 우측 상단) |
| 아이콘/텍스트 분리 | 앵무새 🦜 아이콘(20px)과 "PicoPico" 텍스트(14px) 크기 독립 제어 |
| 백엔드 재시작 | 스트리밍 엔드포인트 포함한 버전으로 교체 완료 |

---

## 다음 할 일: D-05 Cloudflare Tunnel

**목표**: 집 밖(모바일 데이터)에서도 앱이 백엔드에 연결되도록

**진행 순서**:
1. bunny-app의 Cloudflare Tunnel 설정 확인
   ```bash
   cat ~/projects/bunny-app/cloudflare-tunnel.yml  # 또는 유사 파일
   cloudflared tunnel list
   ```
2. picopico용 터널 생성 또는 기존 터널에 라우트 추가
3. `mobile/src/config.ts`의 `API_BASE_URL`을 터널 도메인으로 변경
   ```typescript
   export const API_BASE_URL = "https://picopico.your-domain.com";
   ```
4. SSE 스트리밍이 터널 통해서도 동작하는지 확인
   - `Cache-Control: no-cache`, `X-Accel-Buffering: no` 헤더 이미 설정됨

**완료 기준**: 집 밖 모바일 데이터 환경에서 채팅 스트리밍 정상 작동

---

## 그 다음: D-06 푸시 알림

**목표**: 루틴 시간에 알림 → 탭하면 해당 학습 타입 채팅으로 진입

**구현할 것**:
- 백엔드: APScheduler (`pip install apscheduler`) 설치, 시간 기반 Expo Push API 호출
- 앱: `expo-notifications` 패키지 추가, 권한 요청, 딥링크 처리

---

## 현재 서버 구성

| 서비스 | 주소 | 비고 |
|--------|------|------|
| Ollama (LLM) | http://localhost:11434 | scshin 유저로 직접 실행 |
| FastAPI 백엔드 | http://192.168.100.169:8000 | 포트 8000 |
| Expo Metro | http://192.168.100.169:8085 | 개발 시에만 |

**GPU**: RTX 5090 x2 (CUDA0: 31.3 GiB, CUDA1: 30.8 GiB)  
**모델**: llama3.3:latest (42GB, num_ctx=4096 필수)

---

## 파일 구조 핵심

```
picopico/
├── HANDOVER.md          ← 지금 읽는 파일
├── CLAUDE.md            ← Harness Engineering 규칙
├── PLANNING.md          ← 기획 결정사항 (브랜드, 아키텍처, 커리큘럼)
├── PROGRESS.md          ← 진행 상태 + 세션 기록
├── FEATURES.md          ← 기능별 완료 기준 + 실행 방법
│
├── backend/
│   ├── main.py          ← FastAPI 앱 (스트리밍 포함)
│   ├── prompts.py       ← 6가지 학습 타입 시스템 프롬프트
│   ├── curriculum.py    ← 20단계 커리큘럼
│   └── .env             ← OLLAMA_MODEL, NUM_CTX 등
│
└── mobile/
    └── src/
        ├── config.ts            ← API_BASE_URL 설정
        ├── types.ts             ← 공통 타입
        ├── theme.ts             ← 색상 (Teal #00897B)
        ├── services/api.ts      ← streamStart, streamChat 등
        └── screens/
            ├── HomeScreen.tsx   ← 홈 (스케줄, 통계)
            └── ChatScreen.tsx   ← 채팅 (핵심 화면)
```

---

## 주의사항 (실수하기 쉬운 것들)

1. **Ollama를 systemd로 실행하면 GPU 미감지** → `nohup ollama serve ...`로 직접 실행
2. **Expo 포트 8081 사용 금지** → VSCode Remote가 선점, 8085 사용
3. **Ollama API 호출 시 num_ctx 옵션 필수** → 없으면 128K 컨텍스트로 VRAM 터짐
4. **백엔드 재시작 안 하면 구버전** → 코드 수정 후 반드시 uvicorn 재시작
5. **llama3.3이 중국어 섞음** → 시스템 프롬프트에 "중국어 절대 금지" 이미 포함됨
