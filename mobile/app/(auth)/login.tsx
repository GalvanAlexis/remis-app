import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Button, Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useAppTheme } from "../../context/ThemeContext";

export default function LoginScreen() {
  const { colors, isDark } = useAppTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    setLoading(true);
    try {
      await login({ username, password });
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Credenciales inválidas",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text
                variant="displaySmall"
                style={[styles.appTitle, { color: colors.text }]}
              >
                REMIS APP
              </Text>
              <Text
                variant="titleMedium"
                style={[
                  styles.welcomeText,
                  { color: colors.text, opacity: 0.6 },
                ]}
              >
                Bienvenido de nuevo
              </Text>
            </View>

            <Surface
              style={[
                styles.surface,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.divider,
                },
              ]}
              elevation={2}
            >
              <TextInput
                label="Nombre de usuario"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={[styles.input, { backgroundColor: colors.surface }]}
                textColor={colors.text}
                outlineColor={colors.divider}
                activeOutlineColor={colors.primary}
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              />

              <TextInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                mode="flat"
                secureTextEntry
                style={styles.input}
                textColor="#FFFFFF"
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor={colors.primary}
                textColor="white"
              >
                Ingresar
              </Button>

              <Button
                mode="text"
                onPress={() => router.push("/(auth)/register-choice")}
                style={styles.registerButton}
                labelStyle={[styles.registerLabel, { color: colors.primary }]}
              >
                ¿No tienes cuenta? Regístrate
              </Button>
            </Surface>

            <Button
              mode="text"
              onPress={() => router.replace("/(auth)/welcome")}
              style={styles.backButton}
              labelStyle={{ color: "#64748B" }}
            >
              Volver al inicio
            </Button>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 25,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  appTitle: {
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  welcomeText: {
    color: "#94A3B8",
    marginTop: 5,
  },
  surface: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  input: {
    marginBottom: 15,
    backgroundColor: "transparent",
  },
  button: {
    marginTop: 10,
    borderRadius: 12,
  },
  buttonContent: {
    height: 50,
  },
  registerButton: {
    marginTop: 15,
  },
  registerLabel: {
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 10,
  },
});
