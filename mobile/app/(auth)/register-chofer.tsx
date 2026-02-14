import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Text, TextInput, Button, Surface, Divider } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterChoferScreen() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
    dni: "",
    phone: "",
    direccion: "",
    licenciaUrl: "",
    cedulaUrl: "",
    habilitacionUrl: "",
    maxPassengers: "4",
    vehicleModel: "",
    vehiclePlate: "",
    vehicleColor: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    // Validate fields
    if (
      !formData.email ||
      !formData.password ||
      !formData.nombre ||
      !formData.apellido ||
      !formData.dni ||
      !formData.phone ||
      !formData.direccion ||
      !formData.licenciaUrl ||
      !formData.cedulaUrl ||
      !formData.habilitacionUrl
    ) {
      Alert.alert(
        "Error",
        "Por favor complete todos los campos de documentación",
      );
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual image picker and upload logic as per 05-frontend-specifications.md
      // Currently using TextInput placeholders for licenciaUrl, cedulaUrl, and habilitacionUrl.
      await register({
        ...formData,
        role: "CHOFER",
      });
      // Navigation is handled by root layout
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Error al registrar. Verifica los datos.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.surface} elevation={4}>
          <Text variant="headlineSmall" style={styles.title}>
            Registro - Chofer
          </Text>

          <Divider style={styles.divider} />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Datos Personales
          </Text>

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label="Contraseña"
            value={formData.password}
            onChangeText={(text) =>
              setFormData({ ...formData, password: text })
            }
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          <View style={styles.row}>
            <TextInput
              label="Nombre"
              value={formData.nombre}
              onChangeText={(text) =>
                setFormData({ ...formData, nombre: text })
              }
              mode="outlined"
              style={[styles.input, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              label="Apellido"
              value={formData.apellido}
              onChangeText={(text) =>
                setFormData({ ...formData, apellido: text })
              }
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
            />
          </View>

          <TextInput
            label="DNI"
            value={formData.dni}
            onChangeText={(text) => setFormData({ ...formData, dni: text })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Teléfono"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <TextInput
            label="Dirección"
            value={formData.direccion}
            onChangeText={(text) =>
              setFormData({ ...formData, direccion: text })
            }
            mode="outlined"
            style={styles.input}
          />

          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Documentación y Vehículo
          </Text>

          <TextInput
            label="Nº Licencia de Conducir"
            value={formData.licenciaUrl}
            onChangeText={(text) =>
              setFormData({ ...formData, licenciaUrl: text })
            }
            mode="outlined"
            style={styles.input}
            placeholder="Ej: A123456"
          />

          <TextInput
            label="Cédula Verde/Azul"
            value={formData.cedulaUrl}
            onChangeText={(text) =>
              setFormData({ ...formData, cedulaUrl: text })
            }
            mode="outlined"
            style={styles.input}
            placeholder="Nº de Cédula"
          />

          <TextInput
            label="Habilitaciones de Transporte"
            value={formData.habilitacionUrl}
            onChangeText={(text) =>
              setFormData({ ...formData, habilitacionUrl: text })
            }
            mode="outlined"
            style={styles.input}
            placeholder="Nº Habilitación Municipal"
          />

          <TextInput
            label="Pasajeros Máximos (Moto, Auto, Combi, Bus)"
            value={formData.maxPassengers}
            onChangeText={(text) =>
              setFormData({ ...formData, maxPassengers: text })
            }
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder="Ej: 1 (Moto), 4 (Auto), 15 (Combi)..."
          />

          <TextInput
            label="Modelo del Vehículo"
            value={formData.vehicleModel}
            onChangeText={(text) =>
              setFormData({ ...formData, vehicleModel: text })
            }
            mode="outlined"
            style={styles.input}
            placeholder="Ej: Fiat Cronos, Toyota Corolla..."
          />

          <View style={styles.row}>
            <TextInput
              label="Patente"
              value={formData.vehiclePlate}
              onChangeText={(text) =>
                setFormData({ ...formData, vehiclePlate: text })
              }
              mode="outlined"
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              autoCapitalize="characters"
              placeholder="Ej: AF123BC"
            />
            <TextInput
              label="Color"
              value={formData.vehicleColor}
              onChangeText={(text) =>
                setFormData({ ...formData, vehicleColor: text })
              }
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
              placeholder="Blanco"
            />
          </View>

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Registrarme
          </Button>

          <Button
            mode="text"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Volver
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  surface: {
    padding: 25,
    borderRadius: 15,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#03dac6",
    marginBottom: 5,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: "600",
    color: "#666",
  },
  row: {
    flexDirection: "row",
    marginBottom: 0,
  },
  note: {
    textAlign: "center",
    color: "#666",
    marginBottom: 15,
  },
  divider: {
    marginBottom: 15,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 15,
    paddingVertical: 5,
  },
  backButton: {
    marginTop: 10,
  },
});
