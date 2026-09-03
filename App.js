import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import HomeScreen from "./src/screens/HomeScreen";
import ManageScreen from "./src/screens/ManageScreen";
import StudyScreen from "./src/screens/StudyScreen";
import InventoryScreen from "./src/screens/InventoryScreen";

import { migrateIfNeeded, clearProgress } from "./src/utils/storage";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function FlashcardsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Study" component={StudyScreen} />
      <Stack.Screen name="Manage" component={ManageScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0F1923",
          borderTopColor: "rgba(255,255,255,0.08)",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
        },
        tabBarActiveTintColor: "#27AE60",
        tabBarInactiveTintColor: "rgba(255,255,255,0.4)",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Flashcards: "layers-outline",
            Inventering: "checkmark-circle-outline",
          };
          return (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Flashcards" component={FlashcardsStack} />
      <Tab.Screen name="Inventering" component={InventoryScreen} />
    </Tab.Navigator>
  );
}

const App = () => {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    migrateIfNeeded();
    clearProgress();
  }, []);

  if (showIntro) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
