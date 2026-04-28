import { API_BASE_URL } from "../config";
import { ChatMessage, LearningType } from "../types";

// ── 인증 헤더 ─────────────────────────────────────────────────────
// token은 호출 측에서 AuthContext에서 꺼내 전달한다

function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ── SSE 스트리밍 파서 (XHR 기반 — React Native에서 response.body.getReader() 미지원) ──

function xhrSSE(
  url: string,
  body: object,
  onToken: (token: string) => void,
  authToken?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    if (authToken) xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);

    let cursor = 0;

    xhr.onprogress = () => {
      const chunk = xhr.responseText.slice(cursor);
      cursor = xhr.responseText.length;

      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") return;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.token) onToken(parsed.token);
        } catch {}
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`서버 오류: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("네트워크 오류"));
    xhr.send(JSON.stringify(body));
  });
}

// ── 스트리밍 API ──────────────────────────────────────────────────

export function streamStart(
  learningType: LearningType,
  level: number,
  day: number,
  onToken: (token: string) => void,
  authToken?: string
): Promise<void> {
  return xhrSSE(
    `${API_BASE_URL}/chat/start/stream`,
    { learning_type: learningType, level, day },
    onToken,
    authToken
  );
}

export function streamChat(
  message: string,
  learningType: LearningType,
  history: ChatMessage[],
  level: number,
  day: number,
  onToken: (token: string) => void,
  authToken?: string
): Promise<void> {
  return xhrSSE(
    `${API_BASE_URL}/chat/stream`,
    { message, learning_type: learningType, history, level, day },
    onToken,
    authToken
  );
}

// ── Learning Items ────────────────────────────────────────────────

export async function getItems(
  token: string,
  params?: { level?: string; module_id?: string; type?: string }
): Promise<any[]> {
  const qs = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE_URL}/items${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  return res.json();
}

// ── 루틴 CRUD ────────────────────────────────────────────────────

export interface Routine {
  id: number;
  user_id: string;
  learning_type: string;
  hour: number;
  minute: number;
  days_of_week: number[];
  is_active: boolean;
}

export async function getRoutines(token: string): Promise<Routine[]> {
  const res = await fetch(`${API_BASE_URL}/routines`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  return res.json();
}

export async function createRoutine(
  token: string,
  data: { learning_type: string; hour: number; minute: number; days_of_week: number[] }
): Promise<Routine> {
  const res = await fetch(`${API_BASE_URL}/routines`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ ...data, is_active: true }),
  });
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  return res.json();
}

export async function deleteRoutine(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/routines/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) throw new Error(`서버 오류: ${res.status}`);
}

// ── 학습 통계 ────────────────────────────────────────────────────

export interface ProgressStats {
  total_studied: number;
  by_stage: { study: number; retrieval: number; spacing: number; mastered: number };
  today_reviewed: number;
  streak_days: number;
}

export async function getProgressStats(token: string): Promise<ProgressStats> {
  const res = await fetch(`${API_BASE_URL}/progress/stats`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  return res.json();
}

export interface ErrorType {
  type: string;
  count: number;
}

export async function getProgressErrors(token: string): Promise<ErrorType[]> {
  const res = await fetch(`${API_BASE_URL}/progress/errors`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  return res.json();
}

// ── 비스트리밍 fallback (필요시) ─────────────────────────────────

export async function startChat(
  learningType: LearningType,
  level = 1,
  day = 1,
  authToken?: string
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/chat/start`, {
    method: "POST",
    headers: authToken
      ? authHeaders(authToken)
      : { "Content-Type": "application/json" },
    body: JSON.stringify({ learning_type: learningType, level, day }),
  });
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  return (await res.json()).reply;
}

export async function sendMessage(
  message: string,
  learningType: LearningType,
  history: ChatMessage[],
  level = 1,
  day = 1,
  authToken?: string
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: authToken
      ? authHeaders(authToken)
      : { "Content-Type": "application/json" },
    body: JSON.stringify({ message, learning_type: learningType, history, level, day }),
  });
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  return (await res.json()).reply;
}
