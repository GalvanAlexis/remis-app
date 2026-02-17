import React from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Text, Button, Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Colores fijos del tema EXECUTIVE para el welcome
const EXECUTIVE_COLORS = {
  primary: "#1A237E", // Deep Navy
  secondary: "#C5A059", // Gold
  background: "#F8F9FA",
  surface: "#FFFFFF",
  text: "#121212",
  divider: "#E0E0E0",
};

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons
              name="car-connected"
              size={60}
              color={EXECUTIVE_COLORS.primary}
            />
          </View>
          <Text
            variant="displaySmall"
            style={[styles.title, { color: EXECUTIVE_COLORS.text }]}
          >
            REMIS APP
          </Text>
          <Text
            variant="titleMedium"
            style={[
              styles.tagline,
              { color: EXECUTIVE_COLORS.text, opacity: 0.6 },
            ]}
          >
            Tu transporte libre y directo
          </Text>
        </View>

        <View style={styles.content}>
          <Surface
            style={[
              styles.glassCard,
              {
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderColor: EXECUTIVE_COLORS.divider,
              },
            ]}
            elevation={2}
          >
            <Text
              variant="headlineSmall"
              style={[styles.welcomeText, { color: EXECUTIVE_COLORS.text }]}
            >
              ¿A dónde vamos hoy?
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.description,
                { color: EXECUTIVE_COLORS.text, opacity: 0.8 },
              ]}
            >
              Pide un transporte de forma rápida y segura, incluso sin
              registrarte.
            </Text>

            <Button
              mode="contained"
              onPress={() => router.push("/(tabs)")}
              style={[
                styles.mainButton,
                { backgroundColor: EXECUTIVE_COLORS.secondary },
              ]}
              contentStyle={styles.buttonContent}
              labelStyle={[styles.buttonLabel, { color: "#fff" }]}
            >
              RESERVAR AHORA
            </Button>

            <Button
              mode="contained"
              onPress={() => router.push("/(auth)/register-choice")}
              style={[
                styles.mainButton,
                { backgroundColor: EXECUTIVE_COLORS.primary },
              ]}
              contentStyle={styles.buttonContent}
              labelStyle={[styles.buttonLabel, { color: "#fff" }]}
            >
              CREAR CUENTA
            </Button>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.loginLink}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </View>

        <View style={styles.bottomFeatures}>
          <View style={styles.feature}>
            <MaterialCommunityIcons
              name="shield-check"
              size={24}
              color="#CBD5E1"
            />
            <Text style={styles.featureText}>Seguro</Text>
          </View>
          <View style={styles.feature}>
            <MaterialCommunityIcons name="flash" size={24} color="#CBD5E1" />
            <Text style={styles.featureText}>Rápido</Text>
          </View>
          <View style={styles.feature}>
            <MaterialCommunityIcons
              name="currency-usd"
              size={24}
              color="#CBD5E1"
            />
            <Text style={styles.featureText}>Directo</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: height * 0.08,
  },
  logoContainer: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    padding: 20,
    borderRadius: 30,
    marginBottom: 20,
  },
  title: {
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  tagline: {
    color: "#94A3B8", // Slate 400
    marginTop: 5,
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: 25,
    marginBottom: 40,
  },
  glassCard: {
    backgroundColor: "rgba(30, 41, 59, 0.7)", // Slate 800 with transparency
    borderRadius: 32,
    padding: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  welcomeText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    color: "#CBD5E1", // Slate 300
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  mainButton: {
    borderRadius: 16,
    marginBottom: 15,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  footerText: {
    color: "#94A3B8",
    marginRight: 8,
  },
  loginLink: {
    color: "#2563EB",
    fontWeight: "bold",
  },
  bottomFeatures: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 40,
  },
  feature: {
    alignItems: "center",
  },
  featureText: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "500",
  },
});
