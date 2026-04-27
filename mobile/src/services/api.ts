import { API_BASE_URL } from "../config";
import { ChatMessage, LearningType } from "../types";

// ── SSE 스트리밍 파서 (XHR 기반 — React Native에서 response.body.getReader() 미지원) ──

function xhrSSE(
  url: string,
  body: object,
  onToken: (token: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");

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
  onToken: (token: string) => void
): Promise<void> {
  return xhrSSE(
    `${API_BASE_URL}/chat/start/stream`,
    { learning_type: learningType, level, day },
    onToken
  );
}

export function streamChat(
  message: string,
  learningType: LearningType,
  history: ChatMessage[],
  level: number,
  day: number,
  onToken: (token: string) => void
): Promise<void> {
  return xhrSSE(
    `${API_BASE_URL}/chat/stream`,
    { message, learning_type: learningType, history, level, day },
    onToken
  );
}

// ── 비스트리밍 fallback (필요시) ─────────────────────────────────

export async function startChat(
  learningType: LearningType,
  level = 1,
  day = 1
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/chat/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  day = 1
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, learning_type: learningType, history, level, day }),
  });
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  return (await res.json()).reply;
}
