import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getRoutines, createRoutine, deleteRoutine, Routine } from "../services/api";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

// 루틴 알림 타입: "어떤 활동을 할 시간인지" (콘텐츠는 시스템이 자동 결정)
const LEARNING_TYPES: { key: string; label: string; emoji: string; desc: string }[] = [
  { key: "new_learning", label: "커리큘럼 학습", emoji: "📚", desc: "오늘 모듈 신규 아이템" },
  { key: "review",       label: "복습",         emoji: "🔄", desc: "SRS 기한 도래 아이템" },
  { key: "greeting",     label: "인사·회화",    emoji: "💬", desc: "자유 회화 연습" },
  { key: "diary",        label: "일기 쓰기",    emoji: "📔", desc: "스페인어 일기" },
];

function formatDays(days: number[]): string {
  if (days.length === 7) return "매일";
  if (days.length === 5 && !days.includes(6) && !days.includes(7)) return "평일";
  if (days.length === 2 && days.includes(6) && days.includes(7)) return "주말";
  return days.map((d) => DAYS[d - 1]).join("");
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function RoutineScreen({ navigation }: any) {
  const { token } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // 추가 모달 상태
  const [selHour, setSelHour] = useState(9);
  const [selMinute, setSelMinute] = useState(0);
  const [selDays, setSelDays] = useState<number[]>([]);
  const [selType, setSelType] = useState("new_learning");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadRoutines(); }, []);

  async function loadRoutines() {
    if (!token) return;
    try {
      setLoading(true);
      setRoutines(await getRoutines(token));
    } catch (e) {
      Alert.alert("오류", "루틴을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!token || selDays.length === 0) {
      Alert.alert("오류", "요일을 하나 이상 선택해주세요");
      return;
    }
    setSaving(true);
    try {
      await createRoutine(token, {
        learning_type: selType,
        hour: selHour,
        minute: selMinute,
        days_of_week: [...selDays].sort(),
      });
      setModalVisible(false);
      resetModal();
      await loadRoutines();
    } catch {
      Alert.alert("오류", "루틴 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!token) return;
    Alert.alert("루틴 삭제", "이 루틴을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRoutine(token, id);
            setRoutines((prev) => prev.filter((r) => r.id !== id));
          } catch {
            Alert.alert("오류", "삭제에 실패했습니다");
          }
        },
      },
    ]);
  }

  function resetModal() {
    setSelHour(9);
    setSelMinute(0);
    setSelDays([]);
    setSelType("new_learning");
  }

  function toggleDay(d: number) {
    setSelDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  const typeInfo = (key: string) => LEARNING_TYPES.find((t) => t.key === key) ?? LEARNING_TYPES[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>루틴 설정</Text>
        <TouchableOpacity onPress={() => { resetModal(); setModalVisible(true); }} style={styles.addBtn}>
          <Text style={styles.addText}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : routines.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>등록된 루틴이 없어요</Text>
          <Text style={styles.emptySubText}>+ 추가 버튼으로 루틴을 만들어보세요</Text>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const t = typeInfo(item.learning_type);
            return (
              <View style={styles.routineItem}>
                <Text style={styles.routineEmoji}>{t.emoji}</Text>
                <View style={styles.routineInfo}>
                  <Text style={styles.routineTime}>{formatTime(item.hour, item.minute)}</Text>
                  <Text style={styles.routineMeta}>
                    {formatDays(item.days_of_week)} · {t.label}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>🗑</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* ── 추가 모달 ───────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>루틴 추가</Text>

            {/* 시간 선택 — 가로 스테퍼 */}
            <Text style={styles.sectionLabel}>시간</Text>
            <View style={styles.timeDisplay}>
              <Text style={styles.timePreview}>
                {String(selHour).padStart(2, "0")}:{String(selMinute).padStart(2, "0")}
              </Text>
            </View>
            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>시</Text>
              <TouchableOpacity onPress={() => setSelHour((h) => (h + 23) % 24)} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepValueBox}>
                <Text style={styles.stepValue}>{String(selHour).padStart(2, "0")}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelHour((h) => (h + 1) % 24)} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>분</Text>
              <TouchableOpacity onPress={() => setSelMinute((m) => (m + 45) % 60)} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepValueBox}>
                <Text style={styles.stepValue}>{String(selMinute).padStart(2, "0")}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelMinute((m) => (m + 15) % 60)} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* 요일 선택 */}
            <Text style={styles.sectionLabel}>요일</Text>
            <View style={styles.dayRow}>
              {DAYS.map((d, i) => {
                const num = i + 1;
                const selected = selDays.includes(num);
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => toggleDay(num)}
                    style={[styles.dayChip, selected && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayChipText, selected && styles.dayChipTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 학습 타입 */}
            <Text style={styles.sectionLabel}>학습 타입</Text>
            <View style={styles.typeGrid}>
              {LEARNING_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setSelType(t.key)}
                  style={[styles.typeChip, selType === t.key && styles.typeChipActive]}
                >
                  <Text style={styles.typeEmoji}>{t.emoji}</Text>
                  <Text style={[styles.typeLabel, selType === t.key && styles.typeLabelActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 버튼 */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setModalVisible(false); resetModal(); }}
              >
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveText}>저장</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 14, color: colors.primary },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "bold", color: colors.textPrimary },
  addBtn: { padding: 4 },
  addText: { fontSize: 15, color: colors.primary, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 17, fontWeight: "600", color: colors.textPrimary },
  emptySubText: { fontSize: 14, color: colors.textSecondary },
  routineItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  routineEmoji: { fontSize: 28 },
  routineInfo: { flex: 1 },
  routineTime: { fontSize: 22, fontWeight: "bold", color: colors.textPrimary },
  routineMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteText: { fontSize: 20 },
  separator: { height: 8 },
  // 모달
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginBottom: 20, textAlign: "center" },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 10, marginTop: 16 },
  timeDisplay: { alignItems: "center", marginBottom: 8 },
  timePreview: { fontSize: 40, fontWeight: "bold", color: colors.primary },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8, paddingHorizontal: 8 },
  stepperLabel: { fontSize: 14, color: colors.textSecondary, width: 16 },
  stepBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  stepBtnText: { fontSize: 20, color: colors.primary, fontWeight: "bold" },
  stepValueBox: { flex: 1, alignItems: "center" },
  stepValue: { fontSize: 24, fontWeight: "bold", color: colors.textPrimary },
  dayRow: { flexDirection: "row", gap: 8 },
  dayChip: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
  dayChipTextActive: { color: "#fff" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: "#E0F2F1" },
  typeEmoji: { fontSize: 13 },
  typeLabel: { fontSize: 12, color: colors.textSecondary, flexShrink: 0 },
  typeLabelActive: { color: colors.primary, fontWeight: "600" },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, alignItems: "center",
  },
  cancelText: { fontSize: 16, color: colors.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center" },
  saveText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
});
