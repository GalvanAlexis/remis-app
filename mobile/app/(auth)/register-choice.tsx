import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button, Surface, Card } from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";

export default function RegisterChoiceScreen() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text
              variant="headlineMedium"
              style={[styles.title, { color: colors.text }]}
            >
              Únete a la Red
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.subtitle, { color: colors.text, opacity: 0.6 }]}
            >
              Selecciona cómo quieres usar la app
            </Text>
          </View>

          <Card
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
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
                  color={colors.primary}
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Text
                  variant="titleLarge"
                  style={[styles.cardTitle, { color: colors.text }]}
                >
                  Soy Cliente
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.cardDescription,
                    { color: colors.text, opacity: 0.7 },
                  ]}
                >
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
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
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
                  color={colors.secondary}
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Text
                  variant="titleLarge"
                  style={[styles.cardTitle, { color: colors.text }]}
                >
                  Soy Chofer
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.cardDescription,
                    { color: colors.text, opacity: 0.7 },
                  ]}
                >
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
            textColor={colors.text}
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
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
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
  },
  cardDescription: {
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
