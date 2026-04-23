import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { colors } from "../theme";

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>설정</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>학습 설정</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>스페인어 레벨</Text>
          <Text style={styles.rowValue}>초급 &gt;</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>루틴 설정</Text>
          <Text style={styles.rowArrow}>&gt;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>알림 설정</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>알림</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>방해금지 시간</Text>
          <Text style={styles.rowValue}>밤 11시~7시 &gt;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>앱 정보</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>버전</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>문의하기</Text>
          <Text style={styles.rowArrow}>&gt;</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary },
  section: { marginTop: 24, backgroundColor: colors.background },
  sectionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: { fontSize: 16, color: colors.textPrimary },
  rowValue: { fontSize: 15, color: colors.textSecondary },
  rowArrow: { fontSize: 16, color: colors.textSecondary },
});
