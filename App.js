import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import HomeScreen from "./src/screens/HomeScreen";
import ManageScreen from "./src/screens/ManageScreen";
import StudyScreen from "./src/screens/StudyScreen";
import InventoryScreen from "./src/screens/InventoryScreen";
import QuizScreen from "./src/screens/QuizScreen";
import LeaderboardScreen from "./src/screens/LeaderboardScreen";
import { migrateIfNeeded } from "./src/utils/storage";
import { colors, ui } from "./src/theme";
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.ink,
    border: colors.border,
  },
};
function FlashcardsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
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
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          elevation: 0,
        },

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={
              {
                Flashcards: focused ? "wine" : "wine-outline",
                Quiz: focused ? "flash" : "flash-outline",
                Topplista: focused ? "trophy" : "trophy-outline",
                Inventering: focused ? "clipboard" : "clipboard-outline",
              }[route.name]
            }
            size={22}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Flashcards"
        component={FlashcardsStack}
        options={{ title: "Drycker" }}
      />
      <Tab.Screen name="Quiz" component={QuizScreen} />
      <Tab.Screen name="Topplista" component={LeaderboardScreen} />
      <Tab.Screen name="Inventering" component={InventoryScreen} />
    </Tab.Navigator>
  );
}
export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  async function initialize() {
    setError(false);
    try {
      await migrateIfNeeded();
      setReady(true);
    } catch {
      setError(true);
    }
  }
  useEffect(() => {
    initialize();
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {ready ? (
        <NavigationContainer theme={theme}>
          <MainTabs />
        </NavigationContainer>
      ) : (
        <View
          style={[
            ui.screen,
            { justifyContent: "center", alignItems: "center", gap: 20 },
          ]}
        >
          {error ? (
            <>
              <Text style={ui.body}>
                Kunde inte öppna dina sparade uppgifter.
              </Text>
              <Pressable style={ui.button} onPress={initialize}>
                <Text style={ui.buttonText}>Försök igen</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={colors.primary} />
          )}
        </View>
      )}
    </SafeAreaProvider>
  );
}
