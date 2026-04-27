# CURRICULUM DESIGN — 스페인어 커리큘럼 설계 의사결정

> 작성일: 2026-04-27  
> 상태: 확정 ✅  
> 관련 문서: PRODUCT_DESIGN.md, PHASE2.md, content/basic_Spanish_one_step_markdown_study.md

---

## 0. 서비스 정의

> **"기억과 말하기를 동시에 훈련하는 스페인어 학습 OS"**

---

## 1. 레벨 구조 확정

### 결정: CEFR 6레벨, 총 46모듈 (비균등 분배)

균등 10모듈 × 6레벨 = 60모듈 **❌ 채택 안 함**  
이유: A1은 기초가 단순해 10모듈이 과다, B1~B2가 실제 학습 밀도가 가장 높음

| 레벨 | 모듈 수 | 누적 | 학습 목표 | 콘텐츠 소스 |
|------|---------|------|-----------|------------|
| A1 | 5 | 5 | 생존 인사, ser/estar, 기초 문장 | 교재 (준비과정 + CAPÍTULO 1~3) |
| A2 | 8 | 13 | 일상 대화, 현재형 동사 패턴 확립 | 교재 (CAPÍTULO 4~9) |
| B1 | 10 | 23 | 과거/미래, 상황 대화 가능 | 교재 (CAPÍTULO 10~17) |
| B2 | 10 | 33 | 접속법 심화, 뉘앙스 표현 | Tatoeba + SUBTLEX-ESP |
| C1 | 8 | 41 | 복합 구조, 고급 표현 | Tatoeba + SUBTLEX-ESP |
| C2 | 5 | 46 | 원어민 화법, 관용구 | Tatoeba + SUBTLEX-ESP |
| **합계** | **46** | | | |

### 근거

- **교재 1권** ("가장 쉬운 스페인어 첫걸음의 모든 것", 박기범, 동양북스)
  - 준비과정 + CAPÍTULO 17개 = A1~B1 전체 커버
  - 챕터별 학습 밀도를 CEFR에 직접 매핑
- **B1이 10모듈로 가장 많은 이유**: 이 구간에서 과거형/미래형/접속법 입문까지 나오는 실제 가장 오래 걸리는 구간
- **C2가 5모듈로 가장 적은 이유**: 원어민 수준이므로 PicoPico 핵심 타겟(입문~중급) 범위 밖

---

## 2. Learning Item 구조

### 하나의 학습 단위 정의

```
Learning Item
├── id          (고유 식별자)
├── level       (A1 / A2 / B1 / B2 / C1 / C2)
├── module_id   (레벨 내 모듈 번호, 1~N)
├── type        (word / grammar / sentence / expression / template)
├── content     (스페인어 원문)
├── meaning     (한국어 뜻)
├── example_1   (예문 1)
├── example_2   (예문 2)
├── audio_url   (TTS 음성, 추후)
└── tags        (["인사", "동사", "ser"] 등)
```

### Item 타입 5가지

| 타입 | 설명 | 예시 |
|------|------|------|
| word | 단어 | comer, rápido |
| grammar | 문법 포인트 | estar vs ser |
| sentence | 예문 | Estoy en casa. |
| expression | 관용 표현 | ¡Ni de broma! |
| template | 회화 템플릿 | "나는 ~하고 싶다" → Quiero ~ |

### 핵심 설계 원칙

> **단어 중심 ❌ → 문장/상황 중심 ⭕**

---

## 3. 모듈당 콘텐츠 구성

| 항목 | 수량 | 비고 |
|------|------|------|
| 핵심 어휘 | 100개 | 사용빈도 상위 기준 |
| 예문 | 200개 | 단어당 최소 2개 |
| 회화 템플릿 | 10개 | 실전 패턴 |

**총 규모**: 46모듈 × 100어휘 = **4,600개 어휘**, 예문 **9,200개 이상**

---

## 4. 데이터 파이프라인

### A1~B1 (모듈 1~23): 교재 기반 수작업

```
교재 CAPÍTULO 구조
        ↓
레벨별 단어/예문 직접 입력
        ↓
Learning Item DB 적재
```

### B2~C2 (모듈 24~46): 오픈 데이터 자동화

```
SUBTLEX-ESP (빈도 순위)
    +
Tatoeba (예문 DB, 한국어 번역 포함)
        ↓
CEFR 레벨별 빈도 상위 단어 필터
        ↓
단어당 예문 2개:
  Tatoeba에 있으면 → 재활용 (Creative Commons)
  없으면           → llama3.3 로컬 생성
        ↓
Learning Item DB 적재
```

### 개발 단계별 콘텐츠 목표

| Phase | 대상 | 모듈 수 | 어휘 수 |
|-------|------|---------|---------|
| Phase 2 | A1 모듈 1~2 | 2 | 200개 |
| Phase 3 | A1~A2 전체 | 13 | 1,300개 |
| Phase 4 | B1 전체 + 파이프라인 구축 | 10 | 1,000개 |
| Phase 5+ | B2~C2 | 23 | 2,300개 |

---

## 5. 학습 방법론 (인지심리학 기반)

### 학습 플로우

```
Study → Retrieval → Spacing → Elaboration → Application
```

### 각 단계 정의

| 단계 | 방식 | 구현 |
|------|------|------|
| Study | 카드 + 예문 2개 노출 | 학습 화면 |
| Retrieval | "뜻이 뭐였지?" 직접 입력 필수 (객관식 ❌) | 인출 퀴즈 |
| Spacing | SM-2 알고리즘으로 next_review_at 자동 계산 | SRS 엔진 |
| Elaboration | "이 단어로 문장 만들어봐" | AI 채팅 연결 |
| Application | 상황 기반 실전 대화 | ChatScreen |

### SM-2 알고리즘 요약

```
성공(quality ≥ 3) → interval 증가, ease_factor 유지/증가
실패(quality < 3) → interval = 1 리셋, ease_factor 감소
```

---

## 6. 모듈 완료 기준 (Definition of Mastery)

### 모듈 통과 조건

```
해당 모듈 100개 단어 중:
  - 80개 이상 → stage = 'mastered'
  - 최근 10회 retrieval 정확도 ≥ 80%
  - 마지막 복습 후 7일 이상 기억 유지
```

### 레벨 통과 조건

```
해당 레벨 전체 모듈 중:
  - 80% 이상 모듈 통과 (예: B1은 10모듈 중 8개)
  → 다음 레벨 잠금 해제
```

---

## 7. 측정/평가 지표

| 지표 | 측정 방법 | 목표값 |
|------|-----------|--------|
| Retention Rate | 1주 후 재시험 정답률 | ≥ 75% |
| Recall Speed | 단어 → 뜻 응답 시간 | ≤ 3초 |
| Error Pattern | 틀린 단어 유형 분류 | 약점 카테고리 파악 |
| Speaking Rate | 말하기(STT) 입력 빈도 | 주 3회 이상 |
| Module Completion | 모듈 내 mastered 비율 | ≥ 80% |
| Level Completion | 레벨 내 모듈 통과 비율 | ≥ 80% |

---

## 8. 교재 CAPÍTULO → 모듈 매핑 (A1~B1)

| 모듈 | 레벨 | 교재 소스 | 핵심 내용 |
|------|------|-----------|-----------|
| A1-M1 | A1 | 준비과정 | 발음, 강세, 알파벳 |
| A1-M2 | A1 | CAPÍTULO 1 | 인사, 인칭대명사, ser |
| A1-M3 | A1 | CAPÍTULO 2 | 안부, ¿Qué tal?, 작별 |
| A1-M4 | A1 | CAPÍTULO 3 + 문법1~3 | estar, hay, 명사/관사 |
| A1-M5 | A1 | 문법 4~6 | 불규칙동사 기초, 지시사, 부정어 |
| A2-M1 | A2 | CAPÍTULO 4 | 국적, 직업, 규칙동사 |
| A2-M2 | A2 | CAPÍTULO 5 | 음식, 주문 표현 |
| A2-M3 | A2 | CAPÍTULO 6 | 인터넷/컴퓨터 |
| A2-M4 | A2 | CAPÍTULO 7 | 교통, 이동 표현 |
| A2-M5 | A2 | CAPÍTULO 8 | 쇼핑 표현 |
| A2-M6 | A2 | CAPÍTULO 9 | 외출, 오락 |
| A2-M7 | A2 | 문법 7~8 | saber/conocer, 재귀대명사 |
| A2-M8 | A2 | 문법 9~10 | 목적대명사 (직접/간접) |
| B1-M1 | B1 | CAPÍTULO 10 | 약속, 모임 |
| B1-M2 | B1 | CAPÍTULO 11 | 여행 표현 |
| B1-M3 | B1 | CAPÍTULO 12 | 관계, 감정 표현 |
| B1-M4 | B1 | CAPÍTULO 13 | 가족 표현 |
| B1-M5 | B1 | CAPÍTULO 14 | 직장, 업무 |
| B1-M6 | B1 | CAPÍTULO 15 | 건강, 병원 |
| B1-M7 | B1 | CAPÍTULO 16~17 | 문화, 현재분사 |
| B1-M8 | B1 | 문법 11~12 | 현재완료, 미래시제 |
| B1-M9 | B1 | 문법 13~15 | 관계사, 진행형, 명령형 |
| B1-M10 | B1 | 문법 16~17 | 과거시제, 접속법 입문 |
| B2~C2 | B2~C2 | Tatoeba + SUBTLEX-ESP | 자동화 파이프라인 (Phase 4+) |
