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
import { startChat, sendMessage } from "../services/api";

const HINTS: Record<LearningType, string[]> = {
  greeting: ["Buenos días → 좋은 아침", "Estoy bien → 나는 잘 지내요", "¿Y tú? → 당신은요?"],
  situational: ["conducir → 운전하다", "el semáforo → 신호등", "aparcar → 주차하다"],
  new_learning: ["ser → ~이다 (영구적)", "estar → ~이다 (일시적)", "tener → 가지다"],
  review: ["¿Recuerdas? → 기억해?", "Intenta de nuevo → 다시 해봐", "¡Muy bien! → 아주 잘했어!"],
  mistake_review: ["No te preocupes → 걱정 마", "Poco a poco → 조금씩", "¡Tú puedes! → 넌 할 수 있어!"],
  diary: ["Hoy → 오늘", "Me siento → 나는 ~하게 느낀다", "Fue → 이었다/했다"],
};

interface BubbleProps {
  message: ChatMessage;
  typeColor: string;
}

function Bubble({ message, typeColor }: BubbleProps) {
  const isAI = message.role === "assistant";
  return (
    <View style={[styles.bubbleRow, isAI ? styles.aiBubbleRow : styles.userBubbleRow]}>
      {isAI && <Text style={styles.mascot}>🦜</Text>}
      <View
        style={[
          styles.bubble,
          isAI
            ? [styles.aiBubble, { borderLeftColor: typeColor }]
            : styles.userBubble,
        ]}
      >
        <Text style={[styles.bubbleText, isAI ? styles.aiText : styles.userText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

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
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadInitialMessage();
  }, []);

  async function loadInitialMessage() {
    setLoading(true);
    try {
      const reply = await startChat(learningType, level, day);
      setMessages([{ role: "assistant", content: reply }]);
    } catch (e) {
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
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const reply = await sendMessage(text, learningType, messages, level, day);
      setMessages([...updatedHistory, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...updatedHistory, { role: "assistant", content: "응답을 가져오지 못했어요. 다시 시도해주세요." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
          <Text style={styles.typeBadgeText}>{typeLabel}{levelLabel}</Text>
        </View>
        <TouchableOpacity onPress={() => setHintVisible(true)} style={styles.hintButton}>
          <Text style={styles.hintText}>? 힌트</Text>
        </TouchableOpacity>
      </View>

      {/* 메시지 목록 */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <Bubble message={item} typeColor={typeColor} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingRow}>
              <Text style={styles.mascot}>🦜</Text>
              <ActivityIndicator color={colors.primary} style={{ marginLeft: 8 }} />
            </View>
          ) : null
        }
      />

      {/* 입력창 */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="스페인어로 답장해보세요..."
            placeholderTextColor={colors.textSecondary}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: typeColor }]}
            onPress={handleSend}
            disabled={loading}
          >
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 힌트 패널 */}
      <Modal visible={hintVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setHintVisible(false)} />
        <View style={styles.hintPanel}>
          <View style={styles.hintHeader}>
            <Text style={styles.hintTitle}>💡 힌트</Text>
            <TouchableOpacity onPress={() => setHintVisible(false)}>
              <Text style={styles.hintClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.hintDivider} />
          <ScrollView>
            {HINTS[learningType].map((hint, i) => (
              <Text key={i} style={styles.hintItem}>• {hint}</Text>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { paddingRight: 12 },
  backText: { fontSize: 15, color: colors.primary },
  typeBadge: {
    flex: 1,
    alignSelf: "center",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    alignItems: "center",
  },
  typeBadgeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  hintButton: { paddingLeft: 12 },
  hintText: { fontSize: 15, color: colors.primary },

  messageList: { padding: 16, paddingBottom: 8 },
  bubbleRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  aiBubbleRow: { justifyContent: "flex-start" },
  userBubbleRow: { justifyContent: "flex-end" },
  mascot: { fontSize: 32, marginRight: 8, marginBottom: 2 },
  bubble: { maxWidth: "92%", borderRadius: 12, padding: 12 },
  aiBubble: {
    backgroundColor: "#F1F8F6",
  },
  userBubble: {
    backgroundColor: colors.surface,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  aiText: { color: colors.textPrimary },
  userText: { color: colors.textPrimary },

  loadingRow: { flexDirection: "row", alignItems: "center", padding: 8 },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: { color: "#fff", fontSize: 18 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  hintPanel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "40%",
  },
  hintHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hintTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary },
  hintClose: { fontSize: 20, color: colors.textSecondary },
  hintDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  hintItem: { fontSize: 15, color: colors.textPrimary, marginBottom: 10, lineHeight: 22 },
});
