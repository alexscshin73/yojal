# PicoPico — 제품 설계 문서

> 작성일: 2026-04-27
> MVP 이후 Phase 2+ 구현을 위한 전체 설계

---

## 서비스 한 줄 정의

> **"기억과 말하기를 동시에 훈련하는 스페인어 학습 OS"**

---

## 1. 사용자 수준 & 학습 Item 구조

### 1-1. 레벨 정의 (CEFR 기반 실용 단순화)

| 레벨 | 기준 |
|------|------|
| 초급 (A1~A2) | 기본 문장, 생존 회화 |
| 중급 (B1~B2) | 상황 대화 가능 |
| 고급 (C1~C2) | 자연스러운 표현, 뉘앙스 |

### 1-2. Learning Item 구조

```
Learning Item
├── id
├── level
├── type        (단어 / 문법 / 예문 / 표현 / 회화)
├── content
├── meaning
├── example
├── audio
└── tags
```

### 1-3. Item 타입 5가지

| 타입 | 예시 |
|------|------|
| 단어 | comer, rápido |
| 문법 | estar vs ser |
| 예문 | Estoy en casa. |
| 관용 표현 | ¡Ni de broma! |
| 회화 템플릿 | "나는 ~하고 싶다" → Quiero ~ |

### 1-4. 핵심 설계 원칙

> **단어 중심 ❌ → 문장/상황 중심 ⭕**

### 1-5. 진척도 DB 스키마

```sql
user_progress
├── user_id
├── item_id
├── stage           (study / retrieval / spacing / mastered)
├── last_reviewed_at
├── next_review_at  ← Spacing 엔진의 핵심
└── success_rate
```

---

## 2. 학습 방법론 운영 구조

### 2-1. 학습 플로우 (엔진화)

```
Study → Retrieval → Spacing → Elaboration → Application
```

### 2-2. 각 단계 시스템 동작

**① Study**
- 카드 + 음성 + 예문 제공

**② Retrieval**
- "뜻 뭐였지?", "문장 만들어봐"
- 입력 필수 (객관식 ❌)

**③ Spacing — 자동 스케줄링**
```
성공 → interval 증가
실패 → interval 감소
```

**④ Elaboration**
- 직접 설명 입력
- 예: "estar는 위치/상태, ser는 성질"

**⑤ Application**
- 실제 상황 생성
- 예: "카페에서 주문하기"

### 2-3. 학습 로그 스키마

```sql
study_log
├── user_id
├── item_id
├── action    (study / retrieval / speak)
├── result    (correct / wrong)
└── time_spent
```

**활용 분석:**
- 어떤 유형에서 실패하는지
- 기억 유지 기간 측정

---

## 3. 습관화 + 역량 평가

### 3-1. 핵심 KPI

| 지표 | 의미 |
|------|------|
| Retention Rate | 기억 유지율 |
| Recall Speed | 떠올리는 속도 |
| Speaking Frequency | 말하기 횟수 |
| Error Pattern | 틀리는 패턴 분석 |

### 3-2. 사용자가 느껴야 하는 것

- "어? 기억이 오래 간다"
- "말이 조금씩 나온다"

### 3-3. 회화 문제 해결

**기존 앱의 문제**: Input만 있고 Output 없음

**해결 구조:**

① AI 회화 (기본)
- 상황 기반 대화
- 음성 입력

② 인간 매칭 (유료 핵심)
```
Learner (유료) ↔ Native Speaker (수익)
```

### 3-4. 수익 모델

| 플랜 | 내용 |
|------|------|
| 구독 | 학습 + AI 회화 |
| 프리미엄 | Native 매칭 |
| 마켓플레이스 | 원어민 튜터 참여 |

---

## 4. 콘텐츠(교재) 구조

### 4-1. 핵심: 상황 기반

- 카페 주문
- 길 묻기
- 병원
- 회사 회의

### 4-2. Lesson 단위 구조

```
Lesson
├── 상황
├── 핵심 문장 5개
├── 변형 패턴
├── 대화 예시
└── 연습 문제
```

### 4-3. 차별점

> **"암기 교재" ❌ → "사용 교재" ⭕**

---

## 5. 서비스 전체 구조

### 5-1. Core 4 엔진

| 엔진 | 역할 |
|------|------|
| Learning Engine | Item + Spacing |
| Memory Engine | Retrieval 기반 |
| Speaking Engine | AI + Native |
| Analytics Engine | 실력 분석 |

### 5-2. 사용자 전체 흐름

```
학습 → 인출 → 반복 → 말하기 → 피드백 → 성장 체감
```

---

## 6. 핵심 차별 포인트

| | 기존 앱 | PicoPico |
|---|---------|---------|
| 학습 방식 | 읽기 중심 | 인출 중심 |
| 반복 구조 | 반복 노출 | 자동 간격 반복 (SRS) |
| 학습 형태 | 수동 학습 | 말하기 강제 |
| 알림 | 없거나 단순 | AI가 먼저 말을 건다 |

---

## 7. 구현 우선순위 (Phase 2)

1. **SQLite DB** — Learning Item + user_progress + study_log 스키마
2. **SRS 엔진** — SM-2 알고리즘 기반 next_review_at 계산
3. **개인화 알림** — 고정 시간 → 학습 이력 기반 동적 스케줄
4. **음성 입력 (STT)** — Speaking Engine 첫 단계
5. **Analytics** — Error Pattern, Retention Rate 대시보드
6. **Native 매칭** — 수익화 핵심
