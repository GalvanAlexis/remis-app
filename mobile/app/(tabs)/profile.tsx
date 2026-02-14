import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, Card, Button, Divider, Chip } from "react-native-paper";
import { useAuth } from "../../hooks/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>No hay usuario</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialCommunityIcons
              name={user.role === "CHOFER" ? "car" : "account"}
              size={64}
              color={user.role === "CHOFER" ? "#03dac6" : "#6200ee"}
            />
            <Text variant="headlineSmall" style={styles.name}>
              {user.profile?.nombre} {user.profile?.apellido}
            </Text>
            <Chip mode="outlined" style={styles.roleChip}>
              {user.role}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="email" size={20} color="#666" />
            <Text variant="bodyMedium" style={styles.infoText}>
              {user.email}
            </Text>
          </View>

          {user.profile?.dni && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="card-account-details"
                size={20}
                color="#666"
              />
              <Text variant="bodyMedium" style={styles.infoText}>
                DNI: {user.profile.dni}
              </Text>
            </View>
          )}

          {user.profile?.phone && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={20} color="#666" />
              <Text variant="bodyMedium" style={styles.infoText}>
                {user.profile.phone}
              </Text>
            </View>
          )}

          {user.profile?.direccion && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color="#666"
              />
              <Text variant="bodyMedium" style={styles.infoText}>
                {user.profile.direccion}
              </Text>
            </View>
          )}

          {user.role === "CHOFER" && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Documentos de Chofer
              </Text>
              <Text variant="bodySmall" style={styles.documentsNote}>
                📄 Podrás subir tus documentos (licencia, cédula, habilitación)
                en futuras actualizaciones.
              </Text>
            </>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="contained-tonal"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#cf6679"
        textColor="white"
      >
        Cerrar Sesión
      </Button>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          ID de Usuario: {user.id}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  card: {
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  name: {
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  roleChip: {
    marginTop: 5,
  },
  divider: {
    marginVertical: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 10,
    color: "#555",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 10,
  },
  documentsNote: {
    color: "#666",
    fontStyle: "italic",
  },
  logoutButton: {
    marginBottom: 20,
    paddingVertical: 5,
  },
  footer: {
    alignItems: "center",
    marginTop: 10,
  },
  footerText: {
    color: "#999",
  },
});
