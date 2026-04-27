import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme";

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nickname || !email || !password) { setError("모든 항목을 입력해주세요"); return; }
    if (password !== password2) { setError("비밀번호가 일치하지 않습니다"); return; }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다"); return; }
    setError("");
    setLoading(true);
    try {
      await register(email.trim(), password, nickname.trim());
    } catch (e: any) {
      setError(e.message ?? "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.mascot}>🦜</Text>
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>스페인어 학습을 시작해봐요</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="닉네임"
              placeholderTextColor={colors.textSecondary}
              value={nickname}
              onChangeText={setNickname}
            />
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호 (6자 이상)"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호 확인"
              placeholderTextColor={colors.textSecondary}
              value={password2}
              onChangeText={setPassword2}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>시작하기</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.linkText}>이미 계정이 있으신가요? <Text style={styles.linkBold}>로그인</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  mascot: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "bold", color: colors.primary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  form: { gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  error: { color: "#E53935", fontSize: 13, textAlign: "center" },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link: { alignItems: "center", marginTop: 8 },
  linkText: { fontSize: 14, color: colors.textSecondary },
  linkBold: { color: colors.primary, fontWeight: "600" },
});
