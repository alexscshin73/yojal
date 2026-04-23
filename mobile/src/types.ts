export type LearningType =
  | "greeting"
  | "situational"
  | "new_learning"
  | "review"
  | "mistake_review"
  | "diary";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const LEARNING_TYPE_LABELS: Record<LearningType, string> = {
  greeting: "인사말",
  situational: "상황 단어",
  new_learning: "새 학습",
  review: "복습",
  mistake_review: "오답 복습",
  diary: "일기 쓰기",
};

export const LEARNING_TYPE_COLORS: Record<LearningType, string> = {
  greeting: "#FB8C00",
  situational: "#1E88E5",
  new_learning: "#8E24AA",
  review: "#43A047",
  mistake_review: "#E53935",
  diary: "#00897B",
};
