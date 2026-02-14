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

export default function RegisterClienteScreen() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
    dni: "",
    phone: "",
    direccion: "",
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
      !formData.direccion
    ) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    setLoading(true);
    try {
      await register({
        ...formData,
        role: "CLIENTE",
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
            Registro - Cliente
          </Text>

          <Surface style={styles.infoBox} elevation={1}>
            <Text variant="titleMedium" style={styles.benefitTitle}>
              ¿Por qué registrarte?
            </Text>
            <Text variant="bodySmall" style={styles.benefitText}>
              En ciertos horarios o circunstancias, el chofer puede preferir un
              cliente <Text style={{ fontWeight: "bold" }}>REGISTRADO</Text>{" "}
              para disminuir la posibilidad de inconvenientes.
              {"\n\n"}
              Al mismo tiempo, el Cliente Registrado obtiene los datos{" "}
              <Text style={{ fontWeight: "bold" }}>COMPLETOS</Text> del chofer.
              No es obligatorio registrarse para utilizar esta APP.
            </Text>
          </Surface>

          <Divider style={styles.divider} />

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
    marginBottom: 5,
    fontWeight: "bold",
    color: "#6200ee",
  },
  infoBox: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f0f0ff",
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#6200ee",
  },
  benefitTitle: {
    color: "#6200ee",
    fontWeight: "bold",
    marginBottom: 5,
  },
  benefitText: {
    color: "#444",
    lineHeight: 18,
  },
  divider: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 0,
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
