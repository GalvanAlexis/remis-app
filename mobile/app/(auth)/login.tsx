import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { Text, TextInput, Button, Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { StatusBar } from "expo-status-bar";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
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
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text variant="displaySmall" style={styles.appTitle}>
                REMIS APP
              </Text>
              <Text variant="titleMedium" style={styles.welcomeText}>
                Bienvenido de nuevo
              </Text>
            </View>

            <Surface style={styles.surface} elevation={0}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="flat"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                textColor="#FFFFFF"
                placeholderTextColor="#64748B"
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
                buttonColor="#2563EB"
              >
                Ingresar
              </Button>

              <Button
                mode="text"
                onPress={() => router.push("/(auth)/register-choice")}
                style={styles.registerButton}
                labelStyle={styles.registerLabel}
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
    backgroundColor: "#0F172A",
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
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
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
    color: "#2563EB",
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 10,
  },
});
