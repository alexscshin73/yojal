import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";

import HomeScreen from "./src/screens/HomeScreen";
import RecordsScreen from "./src/screens/RecordsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ChatScreen from "./src/screens/ChatScreen";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
