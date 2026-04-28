import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getProgressStats, getProgressErrors, ProgressStats, ErrorType } from "../services/api";
import { API_BASE_URL } from "../config";

const TYPE_LABELS: Record<string, string> = {
  word: "단어", grammar: "문법", sentence: "문장",
  expression: "표현", template: "템플릿",
};

const STAGE_CONFIG = [
  { key: "study",     label: "학습 중",  color: "#90CAF9" },
  { key: "retrieval", label: "기억 훈련", color: "#A5D6A7" },
  { key: "spacing",   label: "간격 복습", color: "#FFE082" },
  { key: "mastered",  label: "마스터",   color: colors.primary },
] as const;

interface TodayData {
  review_items: any[];
}

export default function RecordsScreen({ navigation }: any) {
  const { token } = useAuth();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [errors, setErrors] = useState<ErrorType[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      loadAll();
    }, [token])
  );

  async function loadAll() {
    if (!token) return;
    setLoading(true);
    try {
      const [s, e, todayRes] = await Promise.all([
        getProgressStats(token),
        getProgressErrors(token),
        fetch(`${API_BASE_URL}/learning/today`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStats(s);
      setErrors(e);
      if (todayRes.ok) {
        const today: TodayData = await todayRes.json();
        setReviewCount(today.review_items?.length ?? 0);
      }
    } catch {}
    setLoading(false);
  }

  const total = stats?.total_studied ?? 0;

  function stageBar(count: number) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return Math.max(pct, count > 0 ? 4 : 0); // 최소 4%로 존재감 유지
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>학습 기록</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* 스트릭 + 총계 */}
          <View style={styles.card}>
            <View style={styles.streakRow}>
              <View style={styles.streakBox}>
                <Text style={styles.streakNum}>{stats?.streak_days ?? 0}</Text>
                <Text style={styles.streakLabel}>🔥 연속 학습일</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.streakBox}>
                <Text style={styles.streakNum}>{total}</Text>
                <Text style={styles.streakLabel}>📚 총 학습 아이템</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.streakBox}>
                <Text style={styles.streakNum}>{stats?.today_reviewed ?? 0}</Text>
                <Text style={styles.streakLabel}>✅ 오늘 학습</Text>
              </View>
            </View>
          </View>

          {/* 복습 CTA */}
          {reviewCount > 0 ? (
            <TouchableOpacity
              style={styles.reviewCta}
              onPress={() => navigation.navigate("Chat", { learningType: "review" })}
            >
              <View>
                <Text style={styles.reviewCtaTitle}>🔄 복습 대기 {reviewCount}개</Text>
                <Text style={styles.reviewCtaSub}>지금 복습하면 기억이 굳어요</Text>
              </View>
              <Text style={styles.reviewCtaArrow}>→</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.reviewDone}>
              <Text style={styles.reviewDoneText}>✅ 오늘 복습 완료!</Text>
            </View>
          )}

          {/* 단계별 현황 */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>단계별 현황</Text>
            {total === 0 ? (
              <Text style={styles.emptyText}>아직 학습한 아이템이 없어요</Text>
            ) : (
              STAGE_CONFIG.map(({ key, label, color }) => {
                const count = stats?.by_stage?.[key] ?? 0;
                const pct = stageBar(count);
                return (
                  <View key={key} style={styles.stageRow}>
                    <Text style={styles.stageLabel}>{label}</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.stageCount}>{count}개</Text>
                  </View>
                );
              })
            )}
          </View>

          {/* 자주 틀리는 유형 */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>자주 틀리는 유형</Text>
            {errors.length === 0 ? (
              <Text style={styles.emptyText}>오답 데이터가 아직 없어요</Text>
            ) : (
              errors.map((e, i) => (
                <View key={e.type} style={styles.errorRow}>
                  <Text style={styles.errorRank}>{i + 1}위</Text>
                  <Text style={styles.errorType}>{TYPE_LABELS[e.type] ?? e.type}</Text>
                  <Text style={styles.errorCount}>{e.count}번</Text>
                </View>
              ))
            )}
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary },
  scroll: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.background, borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  streakRow: { flexDirection: "row", alignItems: "center" },
  streakBox: { flex: 1, alignItems: "center", gap: 4 },
  streakNum: { fontSize: 26, fontWeight: "bold", color: colors.primary },
  streakLabel: { fontSize: 11, color: colors.textSecondary, textAlign: "center" },
  divider: { width: 1, height: 40, backgroundColor: colors.border },
  reviewCta: {
    backgroundColor: colors.primary, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  reviewCtaTitle: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  reviewCtaSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 3 },
  reviewCtaArrow: { fontSize: 22, color: "#fff", fontWeight: "bold" },
  reviewDone: {
    backgroundColor: "#E8F5E9", borderRadius: 16, padding: 16, alignItems: "center",
  },
  reviewDoneText: { fontSize: 15, color: "#2E7D32", fontWeight: "600" },
  sectionTitle: { fontSize: 14, fontWeight: "bold", color: colors.textPrimary, marginBottom: 14 },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: "center", paddingVertical: 8 },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  stageLabel: { width: 64, fontSize: 12, color: colors.textSecondary },
  barBg: { flex: 1, height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: "hidden" },
  barFill: { height: 10, borderRadius: 5 },
  stageCount: { width: 36, fontSize: 12, color: colors.textSecondary, textAlign: "right" },
  errorRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  errorRank: { fontSize: 13, fontWeight: "bold", color: colors.textSecondary, width: 24 },
  errorType: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  errorCount: { fontSize: 13, color: "#E53935", fontWeight: "600" },
});
