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
import {
  ThemeProvider,
  useAppTheme,
  getPaperTheme,
} from "../context/ThemeContext";
import { ToastProvider } from "../context/ToastContext";
import { AppToast } from "../components/AppToast";
import { StatusBar } from "expo-status-bar";
import {
  registerForPushNotificationsAsync,
  registerPushTokenOnServer,
  setupNotificationHandler,
} from "../services/notifications.service";

// Configurar handler de notificaciones en foreground (muestra alert + sonido)
setupNotificationHandler();

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

    // Ignorar logs inofensivos para no ensuciar el Backend
    const ignoredPhrases = [
      "RootLayoutNav Rendering",
      "Unauthorized request, clearing session",
      "Connected to Socket.io server",
      "Disconnected from Socket.io server",
      "Expo Go does not support push notifications",
      "Development builds are required",
    ];
    if (ignoredPhrases.some((phrase) => message.includes(phrase))) {
      return;
    }

    if (type === "LOG" || type === "WARN") {
      // Opcional: Si quieres ignorar TODOS los logs y warnings genéricos,
      // también puedes poner: return;
      // Por ahora solo filtramos las frases ignoradas arriba.
    }

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
  const { theme, isDark } = useAppTheme();
  const paperTheme = getPaperTheme(theme);
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

  // Registrar push token cuando el usuario se autentica
  useEffect(() => {
    if (!isAuthenticated) return;
    // Fire-and-forget: no bloquea el flujo si falla
    void (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await registerPushTokenOnServer(token);
      }
    })();
  }, [isAuthenticated]);

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
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ThemeWrapper />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function ThemeWrapper() {
  const { theme, isDark } = useAppTheme();
  const paperTheme = getPaperTheme(theme);

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <RootLayoutNav />
      {/* Toast overlay global — encima de todo */}
      <AppToast />
    </PaperProvider>
  );
}
