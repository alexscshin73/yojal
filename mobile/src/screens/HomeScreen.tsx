import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

interface TodayLearning {
  current_module_id: string | null;
  current_level: string | null;
  daily_new_target: number;
  already_new_today: number;
  new_items: any[];
  review_items: any[];
  module_total: number;
  module_introduced: number;
  est_module_completion_days: number;
  all_done: boolean;
}

interface PaceSettings {
  daily_new_per_level: Record<string, number>;
  estimated_days: Record<string, number>;
}

const LEVEL_LABELS: Record<string, string> = {
  A1: "입문", A2: "초급", B1: "중하급", B2: "중급", C1: "상급", C2: "최상급",
};

const MODULE_NAMES: Record<string, string> = {
  "A1-M1": "발음·기초명사", "A1-M2": "인사·ser동사",
  "A1-M3": "숫자·날짜", "A1-M4": "가족·직업", "A1-M5": "일상표현",
};

export default function HomeScreen({ navigation }: any) {
  const { user, token } = useAuth();
  const [today, setToday] = useState<TodayLearning | null>(null);
  const [pace, setPace] = useState<PaceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      loadData();
    }, [token])
  );

  async function loadData() {
    if (!token) return;
    setLoading(true);
    try {
      const [todayRes, paceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/learning/today`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/settings/pace`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (todayRes.ok) setToday(await todayRes.json());
      if (paceRes.ok) setPace(await paceRes.json());
    } catch {}
    setLoading(false);
  }

  function goToChat(learningType: string) {
    navigation.navigate("Chat", { learningType });
  }

  const newDone = today?.already_new_today ?? 0;
  const newTarget = today?.daily_new_target ?? 0;
  const reviewCount = today?.review_items?.length ?? 0;
  const progressPct = today
    ? Math.round((today.module_introduced / Math.max(today.module_total, 1)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>안녕하세요, {user?.nickname ?? ""}님 👋</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}</Text>
          </View>
          <Text style={styles.mascot}>🦜</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* 오늘 학습 카드 */}
            <View style={styles.todayCard}>
              {today?.all_done ? (
                <Text style={styles.allDone}>🎉 모든 커리큘럼 완료!</Text>
              ) : (
                <>
                  <View style={styles.moduleRow}>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>
                        {today?.current_level} {LEVEL_LABELS[today?.current_level ?? ""] ?? ""}
                      </Text>
                    </View>
                    <Text style={styles.moduleName}>
                      {MODULE_NAMES[today?.current_module_id ?? ""] ?? today?.current_module_id}
                    </Text>
                  </View>

                  {/* 모듈 진행 바 */}
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {today?.module_introduced}/{today?.module_total}개 학습 완료 · 모듈 완료까지 {today?.est_module_completion_days}일
                  </Text>

                  {/* 오늘 통계 */}
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNum}>{newDone}/{newTarget}</Text>
                      <Text style={styles.statLabel}>오늘 신규</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                      <Text style={[styles.statNum, reviewCount > 0 && styles.reviewAlert]}>
                        {reviewCount}
                      </Text>
                      <Text style={styles.statLabel}>복습 대기</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                      <Text style={styles.statNum}>{pace?.estimated_days?.total ?? "-"}</Text>
                      <Text style={styles.statLabel}>목표 완료일</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* 학습 시작 버튼 */}
            {!today?.all_done && (
              <View style={styles.actionArea}>
                {newDone < newTarget && (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => goToChat("new_learning")}
                  >
                    <Text style={styles.primaryBtnText}>
                      📚 신규 학습 시작 ({newTarget - newDone}개 남음)
                    </Text>
                  </TouchableOpacity>
                )}
                {newDone >= newTarget && (
                  <View style={styles.newDoneBox}>
                    <Text style={styles.newDoneText}>✅ 오늘 신규 학습 완료!</Text>
                  </View>
                )}
                {reviewCount > 0 && (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => goToChat("review")}
                  >
                    <Text style={styles.reviewBtnText}>🔄 복습하기 ({reviewCount}개)</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 빠른 학습 */}
            <View style={styles.quickSection}>
              <Text style={styles.sectionTitle}>빠른 학습</Text>
              <View style={styles.quickGrid}>
                {[
                  { type: "greeting", emoji: "🌅", label: "인사말" },
                  { type: "situational", emoji: "🗣", label: "상황 단어" },
                  { type: "diary", emoji: "📔", label: "일기 쓰기" },
                  { type: "mistake_review", emoji: "❌", label: "오답 복습" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.type}
                    style={styles.quickItem}
                    onPress={() => goToChat(item.type)}
                  >
                    <Text style={styles.quickEmoji}>{item.emoji}</Text>
                    <Text style={styles.quickLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    backgroundColor: colors.background,
  },
  greeting: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary },
  date: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  mascot: { fontSize: 36 },
  todayCard: {
    margin: 16, padding: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  allDone: { fontSize: 18, fontWeight: "bold", color: colors.primary, textAlign: "center", padding: 16 },
  moduleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  levelBadge: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  levelBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  moduleName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  progressBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 6 },
  progressBarFill: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statBox: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },
  statNum: { fontSize: 22, fontWeight: "bold", color: colors.primary },
  reviewAlert: { color: "#E53935" },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  actionArea: { paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  newDoneBox: {
    backgroundColor: "#E8F5E9", borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  newDoneText: { fontSize: 15, color: "#2E7D32", fontWeight: "600" },
  reviewBtn: {
    backgroundColor: "#FFF8E1", borderRadius: 12, paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: "#FFE082",
  },
  reviewBtnText: { fontSize: 15, color: "#F57F17", fontWeight: "600" },
  quickSection: { paddingHorizontal: 16, marginTop: 8, marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: colors.textPrimary, marginBottom: 12 },
  quickGrid: { flexDirection: "row", gap: 10 },
  quickItem: {
    flex: 1, backgroundColor: colors.background, borderRadius: 12,
    paddingVertical: 14, alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  quickEmoji: { fontSize: 24 },
  quickLabel: { fontSize: 12, color: colors.textSecondary },
});
