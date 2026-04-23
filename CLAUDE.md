# Yojal — 프로젝트 헌법 (Harness Guide)

> 새 세션을 시작하면 이 파일과 PROGRESS.md를 반드시 먼저 읽는다.

## 프로젝트 정체성

**Yojal** (요할) — 한국어 "조잘조잘/재잘재잘"에서 온 이름
**슬로건**: Habla más, aprende mejor. (더 많이 말하고, 더 잘 배워라)
**마스코트**: 빨간 앵무새
**대상**: 한국어 모국어 화자, 스페인어·영어 학습자
**플랫폼**: 웹앱 (Next.js + Vercel)

## 기술 스택

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- AI: Anthropic Claude API (claude-sonnet-4-6)
- 배포: Vercel
- 저장소: https://github.com/alexscshin73/yojal.git

## 개발 방법론: Harness Engineering

### 핵심 원칙 (변경 금지)

1. **한 세션 = 한 기능** — 한 번에 하나만 완성하고 다음으로 넘어간다
2. **완료 기준을 먼저 정한다** — 시작 전에 "이게 되면 완성"을 명확히 한다
3. **기록 없이 끝내지 않는다** — 마칠 때 반드시 PROGRESS.md 업데이트 + GitHub 커밋

### 세션 루틴 (매번 따른다)

```
[세션 시작]
1. CLAUDE.md 읽기 (이 파일)
2. PROGRESS.md 읽기 (현재 상태 파악)
3. FEATURES.md에서 다음 작업 확인
4. 작업 시작 전 완료 기준 선언

[세션 진행]
5. 한 기능만 집중해서 완성
6. 브라우저에서 직접 눈으로 확인
7. 콘솔 에러 없음 확인

[세션 종료]
8. PROGRESS.md 업데이트
9. GitHub 커밋 + 푸시
```

### 완료 기준 (Definition of Done)

기능 하나가 "완성"되려면 다음을 모두 충족해야 한다:
- [ ] 브라우저에서 직접 눈으로 동작 확인
- [ ] 콘솔에 빨간 에러 없음
- [ ] PROGRESS.md에 완료 기록
- [ ] GitHub 커밋

### 규칙 (현장에서 검증된 것만)

- 도구는 꼭 필요한 것만 추가한다 (욕심 금지)
- 실패한 지점부터 보완한다 (처음부터 완벽 설계 금지)
- 같은 실수가 반복되면 규칙을 추가한다 (개인 탓 금지)
- 컨텍스트가 길어지면 새 세션을 시작한다

## 브랜드 컬러

- 주색: Teal (#00897B)
- 강조: Red (#E53935), Yellow (#FDD835), Blue (#1E88E5), Green (#43A047)
- 배경: White (#FFFFFF), Light (#F5F5F5)
