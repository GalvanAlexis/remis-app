import React from "react";
import { View, StyleSheet, ScrollView, Alert, Image } from "react-native";
import { Text, Card, Button, Divider, Chip, Avatar } from "react-native-paper";
import { useAuth } from "../../hooks/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";
import { ThemeSelector } from "../../components/ThemeSelector";

export default function ProfileScreen() {
  const { colors, isDark } = useAppTheme();
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
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: colors.text }}>No hay usuario</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Card
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.divider,
            borderWidth: 1,
          },
        ]}
      >
        <Card.Content>
          <View style={styles.header}>
            {user.profile?.profilePictureUrl ? (
              <Image
                source={{ uri: user.profile.profilePictureUrl }}
                style={styles.profilePic}
              />
            ) : (
              <Avatar.Icon
                size={80}
                icon={user.role === "CHOFER" ? "car" : "account"}
                style={{
                  backgroundColor: colors.primary,
                }}
              />
            )}
            <Text
              variant="headlineSmall"
              style={[styles.name, { color: colors.text }]}
            >
              {user.profile?.nombre} {user.profile?.apellido}
            </Text>
            <Chip
              mode="outlined"
              style={styles.roleChip}
              textStyle={{
                color: colors.primary,
              }}
            >
              {user.role}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="account-details"
              size={20}
              color={colors.primary}
            />
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Usuario:
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.infoText, { color: colors.text }]}
            >
              {user.username}
            </Text>
          </View>

          {user.profile?.dni && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="card-account-details"
                size={20}
                color={colors.primary}
              />
              <Text variant="bodyMedium" style={styles.infoLabel}>
                DNI:
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.infoText, { color: colors.text }]}
              >
                {user.profile.dni}
              </Text>
            </View>
          )}

          {user.profile?.direccion && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={colors.primary}
              />
              <Text variant="bodyMedium" style={styles.infoLabel}>
                Dirección:
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.infoText, { color: colors.text }]}
              >
                {user.profile.direccion}
              </Text>
            </View>
          )}

          {user.role === "CHOFER" && user.driverDocument && (
            <>
              <Divider style={styles.divider} />
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: colors.primary }]}
              >
                Datos del Vehículo
              </Text>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="car-info"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  variant="bodyMedium"
                  style={[styles.infoText, { color: colors.text }]}
                >
                  {user.driverDocument.vehicleModel} (
                  {user.driverDocument.vehiclePlate})
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="palette"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  variant="bodyMedium"
                  style={[styles.infoText, { color: colors.text }]}
                >
                  Color: {user.driverDocument.vehicleColor}
                </Text>
              </View>
            </>
          )}
          <Divider
            style={[styles.divider, { backgroundColor: colors.divider }]}
          />
          <Text
            variant="titleMedium"
            style={[
              styles.sectionTitle,
              { color: colors.primary, marginBottom: 15 },
            ]}
          >
            Preferencias de Estilo
          </Text>
          <ThemeSelector />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#cf6679"
        textColor="white"
      >
        Cerrar Sesión
      </Button>

      <View style={styles.footer}>
        <Text
          variant="bodySmall"
          style={[styles.footerText, { color: colors.text, opacity: 0.4 }]}
        >
          ID: {user.id}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  card: {
    marginBottom: 20,
    borderRadius: 15,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  name: {
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
    color: "#fff",
  },
  roleChip: {
    marginTop: 5,
    borderColor: "#333",
    backgroundColor: "#2a2a2a",
  },
  divider: {
    marginVertical: 15,
    backgroundColor: "#333",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    marginLeft: 10,
    color: "#aaa",
    width: 80,
  },
  infoText: {
    flex: 1,
    color: "#fff",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    color: "#03dac6",
  },
  logoutButton: {
    marginBottom: 20,
    paddingVertical: 5,
    borderRadius: 10,
  },
  footer: {
    alignItems: "center",
    marginTop: 10,
  },
  footerText: {
    color: "#444",
  },
});
