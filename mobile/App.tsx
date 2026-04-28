import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Text, Platform, View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import HomeScreen from "./src/screens/HomeScreen";
import RecordsScreen from "./src/screens/RecordsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ChatScreen from "./src/screens/ChatScreen";
import RoutineScreen from "./src/screens/RoutineScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { colors } from "./src/theme";
import { API_BASE_URL } from "./src/config";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef<any>();

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  const { status } = existing === "granted"
    ? { status: existing }
    : await Notifications.requestPermissionsAsync();

  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return token;
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
      }}
    >
      <Tab.Screen
        name="홈"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 26, color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="기록"
        component={RecordsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 26, color }}>📚</Text> }}
      />
      <Tab.Screen
        name="설정"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 26, color }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, token, isLoading } = useAuth();

  // 토큰 검증 중 스플래시
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <Text style={{ fontSize: 48 }}>🦜</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user && token ? (
        // 인증된 사용자 → 메인 앱
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Routine" component={RoutineScreen} />
        </>
      ) : (
        // 미인증 → 로그인/회원가입
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    registerForPushNotifications()
      .then((token) => {
        if (!token) { console.log("[Push] 토큰 없음"); return; }
        fetch(`${API_BASE_URL}/register-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }).catch((e) => console.log("[Push] 백엔드 등록 실패:", e));
      })
      .catch((e) => console.log("[Push] 토큰 발급 실패:", e));

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const learningType = response.notification.request.content.data?.learningType;
      if (learningType && navigationRef.isReady()) {
        navigationRef.navigate("Chat", { learningType });
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
