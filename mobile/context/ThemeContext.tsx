import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import {
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme,
  configureFonts,
} from "react-native-paper";
import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../hooks/useAuth";
import { usersService } from "../services/users.service";

export type ThemeType = "EXECUTIVE" | "NOIR" | "HERITAGE";

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  onSurface: string;
  accent: string;
  divider: string;
  placeholder: string;
  error: string;
  onPrimary: string;
  onSecondary: string;
  onError: string;
}

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const Themes: Record<ThemeType, ThemeColors> = {
  EXECUTIVE: {
    primary: "#1A237E", // Deep Navy
    secondary: "#C5A059", // Gold
    background: "#F8F9FA", // Near white
    surface: "#FFFFFF",
    text: "#121212",
    onSurface: "#121212",
    accent: "#C5A059",
    divider: "#E0E0E0",
    placeholder: "#757575",
    error: "#DC2626", // Refinado para pasar AA WCAG contra el fondo blanco original
    onPrimary: "#FFFFFF",
    onSecondary: "#000000",
    onError: "#FFFFFF",
  },
  NOIR: {
    primary: "#00E5FF", // Cyan hiper vibrante para pantallas OLED
    secondary: "#2A2A2A", // Acento gris frío
    background: "#000000", // True Black absoluto (Pixeles apagados OLED)
    surface: "#121212", // MD3 Nivel 1
    text: "#FFFFFF",
    onSurface: "#E0E0E0",
    accent: "#00E5FF",
    divider: "#1E1E1E",
    placeholder: "#666666",
    error: "#FF5252",
    onPrimary: "#121212",
    onSecondary: "#FFFFFF",
    onError: "#121212",
  },
  HERITAGE: {
    primary: "#4E0B0B", // Deep Burgundy
    secondary: "#212121", // Black
    background: "#F5F5DC", // Cream/Beige
    surface: "#FFFBF0",
    text: "#212121",
    onSurface: "#212121",
    accent: "#4E0B0B",
    divider: "#D7CCC8",
    placeholder: "#8D6E63",
    error: "#B00020",
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    onError: "#FFFFFF",
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeType>("EXECUTIVE");
  const { user, isAuthenticated } = useAuth();

  // Load theme from storage on mount
  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const storedTheme = await SecureStore.getItemAsync("theme_preference");
        if (storedTheme) {
          setThemeState(storedTheme as ThemeType);
        }
      } catch (e) {
        console.error("Failed to load theme from storage", e);
      }
    };
    loadStoredTheme();
  }, []);

  // Sync theme when user logs in or profile changes
  useEffect(() => {
    if (user?.profile?.themePreference) {
      const serverTheme = user.profile.themePreference as ThemeType;
      if (serverTheme !== theme) {
        setThemeState(serverTheme);
        SecureStore.setItemAsync("theme_preference", serverTheme);
      }
    }
  }, [user]);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await SecureStore.setItemAsync("theme_preference", newTheme);

    // Sync with backend if authenticated
    if (isAuthenticated) {
      try {
        await usersService.updateProfile({ themePreference: newTheme });
      } catch (e) {
        console.error("Failed to sync theme with backend", e);
      }
    }
  };

  const currentColors = Themes[theme];
  const isDark = theme === "NOIR";

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, colors: currentColors, isDark }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
};

// Helper for Paper Theme
export const getPaperTheme = (type: ThemeType) => {
  const customColors = Themes[type];
  const base = type === "NOIR" ? MD3DarkTheme : MD3LightTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: customColors.primary,
      secondary: customColors.secondary,
      background: customColors.background,
      surface: customColors.surface,
      onSurface: customColors.onSurface,
      error: customColors.error,
      onError: customColors.onError,
      onPrimary: customColors.onPrimary,
      onSecondary: customColors.onSecondary,
      outline: customColors.divider,
      placeholder: customColors.placeholder,
    },
    // Larger fonts for 45+ accessibility
    fonts: configureFonts({
      config: {
        displayMedium: { fontSize: 45 },
        headlineSmall: { fontSize: 24, fontWeight: "bold" },
        titleMedium: { fontSize: 18, fontWeight: "600" },
        bodyMedium: { fontSize: 16 },
        bodySmall: { fontSize: 14 },
      },
    }),
  };
};
