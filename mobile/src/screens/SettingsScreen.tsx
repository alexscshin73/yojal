import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  function handleLogout() {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠어요?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>설정</Text>
      </View>

      {/* 프로필 */}
      <View style={styles.profileCard}>
        <Text style={styles.profileIcon}>🦜</Text>
        <View>
          <Text style={styles.profileName}>{user?.nickname ?? ""}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? ""}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>학습 설정</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>스페인어 레벨</Text>
          <Text style={styles.rowValue}>초급 &gt;</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("Routine")}
        >
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>앱 정보</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>버전</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
      </View>

      <View style={[styles.section, { marginTop: 32 }]}>
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.background,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  profileIcon: { fontSize: 40 },
  profileName: { fontSize: 17, fontWeight: "bold", color: colors.textPrimary },
  profileEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
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
  logoutRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  logoutText: { fontSize: 16, color: "#E53935", fontWeight: "500" },
});
