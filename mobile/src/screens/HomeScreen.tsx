import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import { LearningType } from "../types";

const todaySchedule: { time: string; type: string; learningType: LearningType; status: string }[] = [
  { time: "06:00", type: "인사말", learningType: "greeting", status: "done" },
  { time: "08:30", type: "상황 단어", learningType: "situational", status: "done" },
  { time: "13:00", type: "새 학습", learningType: "new_learning", status: "active" },
  { time: "15:00", type: "복습", learningType: "review", status: "pending" },
  { time: "21:00", type: "일기 쓰기", learningType: "diary", status: "pending" },
];

const statusIcon = (status: string) => {
  if (status === "done") return "✅";
  if (status === "active") return "▶️";
  return "⏸";
};

export default function HomeScreen({ navigation }: any) {
  const activeItem = todaySchedule.find((s) => s.status === "active");

  function goToChat(learningType: LearningType) {
    navigation.navigate("Chat", { learningType });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>안녕하세요 👋</Text>
          <Text style={styles.mascot}>🦜 요할</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.streak}>🔥 12일 연속 학습</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>오늘 배운 단어</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>이번 주 학습일</Text>
            </View>
          </View>
        </View>

        <View style={styles.scheduleSection}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.sectionTitle}>오늘 스케줄</Text>
            <Text style={styles.dateText}>2026.04.23</Text>
          </View>
          {todaySchedule.map((item) => (
            <TouchableOpacity
              key={item.time}
              style={[styles.scheduleItem, item.status === "active" && styles.activeItem]}
              onPress={() => goToChat(item.learningType)}
              disabled={item.status === "pending"}
            >
              <Text style={styles.scheduleIcon}>{statusIcon(item.status)}</Text>
              <Text style={styles.scheduleTime}>{item.time}</Text>
              <Text
                style={[
                  styles.scheduleType,
                  item.status === "active" && styles.activeText,
                ]}
              >
                {item.type}
              </Text>
              {item.status === "active" && (
                <Text style={styles.activeLabel}>진행중</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => goToChat(activeItem?.learningType ?? "greeting")}
        >
          <Text style={styles.startButtonText}>🦜 지금 학습 이어하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary },
  mascot: { fontSize: 16, color: colors.primary, fontWeight: "600" },
  statsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  streak: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 24 },
  statItem: { alignItems: "flex-start" },
  statNumber: { fontSize: 28, fontWeight: "bold", color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  scheduleSection: { paddingHorizontal: 16, marginBottom: 16 },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary },
  dateText: { fontSize: 13, color: colors.textSecondary },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    gap: 10,
  },
  activeItem: { backgroundColor: "#E0F2F1" },
  scheduleIcon: { fontSize: 18, width: 24 },
  scheduleTime: { fontSize: 14, color: colors.textSecondary, width: 52, flexShrink: 0 },
  scheduleType: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  activeText: { color: colors.primary, fontWeight: "600" },
  activeLabel: { fontSize: 12, color: colors.primary, fontWeight: "500" },
  startButton: {
    margin: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  startButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
