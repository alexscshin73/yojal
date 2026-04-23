import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";

export default function RecordsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>학습 기록</Text>
      </View>
      <View style={styles.placeholder}>
        <Text style={styles.emoji}>📚</Text>
        <Text style={styles.text}>D-04 이후 구현 예정</Text>
        <Text style={styles.sub}>단어장 / 오답노트 / 통계</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: "bold", color: colors.textPrimary },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  emoji: { fontSize: 48 },
  text: { fontSize: 16, color: colors.textSecondary },
  sub: { fontSize: 13, color: colors.border },
});
