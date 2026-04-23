import { API_BASE_URL } from "../config";
import { ChatMessage, LearningType } from "../types";

export async function startChat(
  learningType: LearningType,
  level = 1,
  day = 1
): Promise<string> {
  const res = await fetch(
    `${API_BASE_URL}/chat/start?learning_type=${learningType}&level=${level}&day=${day}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  const data = await res.json();
  return data.reply;
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
    body: JSON.stringify({
      message,
      learning_type: learningType,
      history,
      level,
      day,
    }),
  });
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  const data = await res.json();
  return data.reply;
}
