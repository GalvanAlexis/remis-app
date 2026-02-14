import "react-native-get-random-values";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { PaperProvider } from "react-native-paper";
import { useEffect, useCallback } from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Global error handler
if (__DEV__) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:3000";

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  const sendToBackend = (type: string, args: any[]) => {
    const message = args
      .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
      .join(" ");

    fetch(`${apiUrl}/debug/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        message,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  };

  console.log = (...args) => {
    sendToBackend("LOG", args);
    originalLog(...args);
  };
  console.warn = (...args) => {
    sendToBackend("WARN", args);
    originalWarn(...args);
  };
  console.error = (...args) => {
    sendToBackend("ERROR", args);
    originalError(...args);
  };

  const originalHandler = (global as any).ErrorUtils.getGlobalHandler();
  (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: any) => {
    sendToBackend("FATAL", [error?.message || error, error?.stack]);
    originalHandler(error, isFatal);
  });
}

function RootLayoutNav() {
  console.log("🟢 RootLayoutNav Rendering...");
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    ...MaterialCommunityIcons.font,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (isAuthLoading || !fontsLoaded) return;

    const path = segments.join("/");
    const inAuthGroup = path.startsWith("(auth)");
    const isWelcome = path === "(auth)/welcome";
    const isHome = path === "(tabs)" || path === "(tabs)/index";

    // Re-route unauthenticated users to Welcome screen
    if (!isAuthenticated && !inAuthGroup && !isHome) {
      router.replace("/(auth)/welcome");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isAuthLoading, segments, fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
