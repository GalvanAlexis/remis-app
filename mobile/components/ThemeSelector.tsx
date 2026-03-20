import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, IconButton } from "react-native-paper";
import { useAppTheme, ThemeType } from "../context/ThemeContext";

interface ThemeOption {
  id: ThemeType;
  label: string;
  primary: string;
  background: string;
  text: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "EXECUTIVE",
    label: "Ejecutivo",
    primary: "#1A237E",
    background: "#F8F9FA",
    text: "#121212",
  },
  {
    id: "NOIR",
    label: "Noir",
    primary: "#03DAC6",
    background: "#121212",
    text: "#FFFFFF",
  },
  {
    id: "HERITAGE",
    label: "Legado",
    primary: "#4E0B0B",
    background: "#F5F5DC",
    text: "#212121",
  },
];

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Elija su estilo preferido:
      </Text>
      <View style={styles.row}>
        {THEME_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => setTheme(opt.id)}
            style={[
              styles.option,
              theme === opt.id && { borderColor: opt.primary, borderWidth: 3 },
            ]}
          >
            <Surface
              style={[
                styles.preview,
                {
                  backgroundColor: opt.background,
                  borderColor: opt.id === "EXECUTIVE" ? "#eee" : opt.background,
                },
              ]}
              elevation={2}
            >
              <View
                style={[styles.accentBar, { backgroundColor: opt.primary }]}
              />
              <View style={styles.textLines}>
                <View
                  style={[
                    styles.line,
                    { backgroundColor: opt.text, width: "70%" },
                  ]}
                />
                <View
                  style={[
                    styles.line,
                    { backgroundColor: opt.text, width: "40%", opacity: 0.6 },
                  ]}
                />
              </View>
              {theme === opt.id && (
                <View style={styles.checkContainer}>
                  <IconButton
                    icon="check-circle"
                    iconColor={opt.primary}
                    size={20}
                    style={{ margin: 0 }}
                  />
                </View>
              )}
            </Surface>
            <Text
              style={[
                styles.label,
                theme === opt.id && { color: opt.primary, fontWeight: "bold" },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  title: {
    marginBottom: 10,
    textAlign: "center",
    opacity: 0.8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  option: {
    alignItems: "center",
    borderRadius: 12,
    padding: 4,
  },
  preview: {
    width: 80,
    height: 100,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    padding: 8,
  },
  accentBar: {
    height: 12,
    width: "100%",
    borderRadius: 2,
    marginBottom: 10,
  },
  textLines: {
    gap: 6,
  },
  line: {
    height: 4,
    borderRadius: 2,
  },
  label: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  checkContainer: {
    position: "absolute",
    bottom: 2,
    right: 2,
  },
});
