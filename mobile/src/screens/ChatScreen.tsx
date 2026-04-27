import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import { colors } from "../theme";
import { ChatMessage, LearningType, LEARNING_TYPE_COLORS, LEARNING_TYPE_LABELS } from "../types";
import { streamStart, streamChat } from "../services/api";

// ─── 폰트 크기 단계 ───────────────────────────────────────────────
const FONT_SIZES = [13, 15, 17] as const;
type FontSize = (typeof FONT_SIZES)[number];

// ─── 힌트 데이터 ──────────────────────────────────────────────────
const HINTS: Record<LearningType, string[]> = {
  greeting: ["Buenos días → 좋은 아침", "Estoy bien → 나는 잘 지내요", "¿Y tú? → 당신은요?"],
  situational: ["conducir → 운전하다", "el semáforo → 신호등", "aparcar → 주차하다"],
  new_learning: ["ser → ~이다 (영구적)", "estar → ~이다 (일시적)", "tener → 가지다"],
  review: ["¿Recuerdas? → 기억해?", "Intenta de nuevo → 다시 해봐", "¡Muy bien! → 아주 잘했어!"],
  mistake_review: ["No te preocupes → 걱정 마", "Poco a poco → 조금씩", "¡Tú puedes! → 넌 할 수 있어!"],
  diary: ["Hoy → 오늘", "Me siento → 나는 ~하게 느낀다", "Fue → 이었다/했다"],
};

// ─── 메시지 파싱 ──────────────────────────────────────────────────
// ⚠️ 교정 블록을 분리: { correction, continuation }
interface ParsedAI {
  correction: { myAnswer: string; correct: string; explanation: string } | null;
  continuation: string;
}

function parseAIMessage(content: string): ParsedAI {
  const warningIdx = content.indexOf("⚠️");
  if (warningIdx === -1) return { correction: null, continuation: content.trim() };

  const correctionBlock = content.slice(warningIdx);
  const lines = correctionBlock.split("\n").map((l) => l.trim()).filter(Boolean);

  let myAnswer = "";
  let correct = "";
  let explanation = "";
  const continuationLines: string[] = [];
  let inCorrection = true;

  for (const line of lines) {
    if (line.startsWith("⚠️") || line.startsWith("내 답:") || line.includes("내 답:")) {
      myAnswer = line.replace(/^⚠️\s*/, "").replace(/^내 답:\s*/, "").trim();
    } else if (line.startsWith("정답:")) {
      correct = line.replace(/^정답:\s*/, "").replace(/✓/, "").trim();
    } else if (line.startsWith("설명:")) {
      explanation = line.replace(/^설명:\s*/, "").trim();
      inCorrection = false;
    } else if (!inCorrection) {
      continuationLines.push(line);
    }
  }

  const before = content.slice(0, warningIdx).trim();
  const continuation = [before, ...continuationLines].filter(Boolean).join("\n").trim();

  return {
    correction: myAnswer || correct ? { myAnswer, correct, explanation } : null,
    continuation,
  };
}

// ─── 교정 카드 (사용자 쪽에 붙음) ────────────────────────────────
function CorrectionCard({ data, fontSize }: { data: ParsedAI["correction"]; fontSize: FontSize }) {
  if (!data) return null;
  return (
    <View style={corrStyles.card}>
      <View style={corrStyles.row}>
        <Text style={[corrStyles.label, corrStyles.myLabel]}>내 답</Text>
        <Text style={[corrStyles.value, { fontSize }]}>{data.myAnswer}</Text>
      </View>
      <View style={corrStyles.divider} />
      <View style={corrStyles.row}>
        <Text style={[corrStyles.label, corrStyles.correctLabel]}>정답</Text>
        <Text style={[corrStyles.value, corrStyles.correctValue, { fontSize }]}>
          {data.correct} ✓
        </Text>
      </View>
      {!!data.explanation && (
        <Text style={[corrStyles.explanation, { fontSize: fontSize - 1 }]}>
          💡 {data.explanation}
        </Text>
      )}
    </View>
  );
}

const corrStyles = StyleSheet.create({
  card: {
    alignSelf: "flex-end",
    maxWidth: "92%",
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FB8C00",
    padding: 12,
    marginBottom: 4,
    marginTop: 4,
  },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  label: {
    fontSize: 11,
    fontWeight: "bold",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginRight: 8,
    marginTop: 2,
    overflow: "hidden",
  },
  myLabel: { backgroundColor: "#FFCCBC", color: "#BF360C" },
  correctLabel: { backgroundColor: "#C8E6C9", color: "#1B5E20" },
  value: { flex: 1, color: colors.textPrimary, lineHeight: 20 },
  correctValue: { color: "#2E7D32", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#FFE0B2", marginVertical: 6 },
  explanation: { color: "#795548", marginTop: 6, lineHeight: 18 },
});

// ─── 일반 말풍선 ──────────────────────────────────────────────────
function Bubble({
  message,
  typeColor,
  fontSize,
}: {
  message: ChatMessage;
  typeColor: string;
  fontSize: FontSize;
}) {
  const isAI = message.role === "assistant";

  if (isAI) {
    const parsed = parseAIMessage(message.content);
    return (
      <View style={{ marginBottom: 12 }}>
        {/* 교정 카드 — 사용자 쪽(우측)에 붙음 */}
        {parsed.correction && (
          <CorrectionCard data={parsed.correction} fontSize={fontSize} />
        )}
        {/* 구분선 */}
        {parsed.correction && !!parsed.continuation && (
          <View style={bubbleStyles.separator} />
        )}
        {/* AI 다음 대화 */}
        {!!parsed.continuation && (
          <View style={bubbleStyles.aiBubbleRow}>
            <Text style={bubbleStyles.mascot}>🦜</Text>
            <View style={[bubbleStyles.bubble, bubbleStyles.aiBubble]}>
              <Text style={[bubbleStyles.aiText, { fontSize, lineHeight: fontSize * 1.6 }]}>
                {parsed.continuation}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[bubbleStyles.userBubbleRow, { marginBottom: 4 }]}>
      <View style={[bubbleStyles.bubble, bubbleStyles.userBubble]}>
        <Text style={[bubbleStyles.userText, { fontSize, lineHeight: fontSize * 1.6 }]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  aiBubbleRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 4 },
  userBubbleRow: { flexDirection: "row", justifyContent: "flex-end" },
  mascot: { fontSize: 28, marginRight: 8, marginBottom: 2 },
  bubble: { maxWidth: "85%", borderRadius: 12, padding: 12 },
  aiBubble: { backgroundColor: "#F1F8F6" },
  userBubble: { backgroundColor: "#E8EAF6" },
  aiText: { color: colors.textPrimary },
  userText: { color: "#283593" },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
    marginHorizontal: 8,
  },
});

// ─── 메인 화면 ────────────────────────────────────────────────────
export default function ChatScreen({ route, navigation }: any) {
  const learningType: LearningType = route?.params?.learningType ?? "greeting";
  const level: number = route?.params?.level ?? 1;
  const day: number = route?.params?.day ?? 1;
  const typeColor = LEARNING_TYPE_COLORS[learningType];
  const typeLabel = LEARNING_TYPE_LABELS[learningType];
  const levelLabel = learningType === "new_learning" ? ` Lv.${level}` : "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [fontSizeIdx, setFontSizeIdx] = useState(1); // 기본: 15px
  const fontSize = FONT_SIZES[fontSizeIdx];
  const listRef = useRef<FlatList>(null);

  useEffect(() => { loadInitialMessage(); }, []);

  async function loadInitialMessage() {
    setLoading(true);
    const placeholder: ChatMessage = { role: "assistant", content: "" };
    setMessages([placeholder]);
    let accumulated = "";
    try {
      await streamStart(learningType, level, day, (token) => {
        accumulated += token;
        setMessages([{ role: "assistant", content: accumulated }]);
      });
    } catch {
      setMessages([{ role: "assistant", content: "서버 연결에 실패했어요. 잠시 후 다시 시도해주세요." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    const historySnapshot = [...messages];
    const updatedHistory: ChatMessage[] = [...historySnapshot, userMsg];
    setMessages([...updatedHistory, { role: "assistant", content: "" }]);
    setLoading(true);
    let accumulated = "";
    try {
      await streamChat(text, learningType, historySnapshot, level, day, (token) => {
        accumulated += token;
        setMessages([...updatedHistory, { role: "assistant", content: accumulated }]);
      });
    } catch {
      setMessages([...updatedHistory, { role: "assistant", content: "응답을 가져오지 못했어요. 다시 시도해주세요." }]);
    } finally {
      setLoading(false);
    }
  }

  function cycleFontSize() {
    setFontSizeIdx((prev) => (prev + 1) % FONT_SIZES.length);
  }

  return (
    <SafeAreaView style={mainStyles.container}>
      {/* 헤더 */}
      <View style={mainStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={mainStyles.headerBtn}>
          <Text style={mainStyles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <View style={[mainStyles.typeBadge, { backgroundColor: typeColor }]}>
          <Text style={mainStyles.typeBadgeText}>{typeLabel}{levelLabel}</Text>
        </View>
        <View style={mainStyles.headerRight}>
          <TouchableOpacity onPress={cycleFontSize} style={mainStyles.headerBtn}>
            <Text style={mainStyles.fontSizeBtn}>Aa {fontSize}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setHintVisible(true)} style={mainStyles.headerBtn}>
            <Text style={mainStyles.hintText}>? 힌트</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 메시지 목록 */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <Bubble message={item} typeColor={typeColor} fontSize={fontSize} />
        )}
        contentContainerStyle={mainStyles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          loading && messages.at(-1)?.content === "" ? (
            <View style={{ flexDirection: "row", alignItems: "center", padding: 8 }}>
              <Text style={{ fontSize: 28, marginRight: 8 }}>🦜</Text>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
      />

      {/* 입력창 */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={mainStyles.inputBar}>
          <TextInput
            style={[mainStyles.input, { fontSize }]}
            value={input}
            onChangeText={setInput}
            placeholder="스페인어로 답장해보세요..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
          <TouchableOpacity
            style={[mainStyles.sendButton, { backgroundColor: typeColor }]}
            onPress={handleSend}
            disabled={loading}
          >
            <Text style={mainStyles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 힌트 패널 */}
      <Modal visible={hintVisible} transparent animationType="slide">
        <TouchableOpacity style={mainStyles.modalOverlay} onPress={() => setHintVisible(false)} />
        <View style={mainStyles.hintPanel}>
          <View style={mainStyles.hintHeader}>
            <Text style={mainStyles.hintTitle}>💡 힌트</Text>
            <TouchableOpacity onPress={() => setHintVisible(false)}>
              <Text style={mainStyles.hintClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={mainStyles.hintDivider} />
          <ScrollView>
            {HINTS[learningType].map((hint, i) => (
              <Text key={i} style={[mainStyles.hintItem, { fontSize }]}>• {hint}</Text>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const mainStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { paddingHorizontal: 6 },
  backText: { fontSize: 14, color: colors.primary },
  typeBadge: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: "center",
    marginHorizontal: 6,
  },
  typeBadgeText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  fontSizeBtn: { fontSize: 12, color: colors.textSecondary, marginRight: 4 },
  hintText: { fontSize: 14, color: colors.primary },
  messageList: { padding: 14, paddingBottom: 8 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: { color: "#fff", fontSize: 17 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  hintPanel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "40%",
  },
  hintHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hintTitle: { fontSize: 17, fontWeight: "bold", color: colors.textPrimary },
  hintClose: { fontSize: 20, color: colors.textSecondary },
  hintDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  hintItem: { color: colors.textPrimary, marginBottom: 10, lineHeight: 22 },
});
