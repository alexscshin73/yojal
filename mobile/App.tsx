import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Text, Platform } from "react-native";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import HomeScreen from "./src/screens/HomeScreen";
import RecordsScreen from "./src/screens/RecordsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ChatScreen from "./src/screens/ChatScreen";
import { colors } from "./src/theme";
import { API_BASE_URL } from "./src/config";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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

export default function App() {
  useEffect(() => {
    // 푸시 토큰 등록
    registerForPushNotifications()
      .then((token) => {
        if (!token) { console.log("[Push] 토큰 없음 (시뮬레이터거나 권한 거부)"); return; }
        console.log("[Push] 토큰:", token);
        fetch(`${API_BASE_URL}/register-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
          .then(() => console.log("[Push] 토큰 등록 성공"))
          .catch((e) => console.log("[Push] 백엔드 등록 실패:", e));
      })
      .catch((e) => console.log("[Push] 토큰 발급 실패:", e));

    // 알림 탭 → 해당 학습 타입 ChatScreen으로 이동
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const learningType = response.notification.request.content.data?.learningType;
      if (learningType && navigationRef.isReady()) {
        navigationRef.navigate("Chat", { learningType });
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
