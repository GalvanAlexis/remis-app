import React from "react";
import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Button, Surface, Card } from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function RegisterChoiceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Únete a la Red
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Selecciona cómo quieres usar la app
            </Text>
          </View>

          <Card
            style={styles.card}
            onPress={() => router.push("/(auth)/register-cliente")}
          >
            <Card.Content style={styles.cardContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(37, 99, 235, 0.1)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-group"
                  size={40}
                  color="#2563EB"
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Text variant="titleLarge" style={styles.cardTitle}>
                  Soy Cliente
                </Text>
                <Text variant="bodyMedium" style={styles.cardDescription}>
                  Busca viajes, mira ofertas y muévete por la ciudad.
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#64748B"
              />
            </Card.Content>
          </Card>

          <Card
            style={styles.card}
            onPress={() => router.push("/(auth)/register-chofer")}
          >
            <Card.Content style={styles.cardContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(16, 185, 129, 0.1)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="car-traction-control"
                  size={40}
                  color="#10B981"
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Text variant="titleLarge" style={styles.cardTitle}>
                  Soy Chofer
                </Text>
                <Text variant="bodyMedium" style={styles.cardDescription}>
                  Gana dinero ofreciendo tus servicios de transporte.
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#64748B"
              />
            </Card.Content>
          </Card>

          <Button
            mode="text"
            onPress={() => router.back()}
            style={styles.backButton}
            labelStyle={styles.backButtonLabel}
          >
            Volver atrás
          </Button>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 25,
    justifyContent: "center",
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  iconContainer: {
    padding: 15,
    borderRadius: 20,
    marginRight: 20,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cardDescription: {
    color: "#94A3B8",
    marginTop: 4,
    lineHeight: 20,
  },
  backButton: {
    marginTop: 20,
  },
  backButtonLabel: {
    color: "#64748B",
    fontWeight: "bold",
  },
});
