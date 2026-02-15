import React, { useState, useEffect } from "react";
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
import { useAppTheme } from "../../context/ThemeContext";
import { ThemeSelector } from "../../components/ThemeSelector";
export default function RegisterClienteScreen() {
  const { theme, colors, isDark } = useAppTheme();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    nombre: "",
    apellido: "",
    dni: "",
    direccion: "",
    themePreference: theme,
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  // Keep themePreference in sync with selected theme
  useEffect(() => {
    setFormData((prev) => ({ ...prev, themePreference: theme }));
  }, [theme]);

  const handleRegister = async () => {
    // Validate fields
    if (
      !formData.username ||
      !formData.password ||
      !formData.nombre ||
      !formData.apellido ||
      !formData.dni ||
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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface
          style={[styles.surface, { backgroundColor: colors.surface }]}
          elevation={2}
        >
          <Text
            variant="headlineSmall"
            style={[styles.title, { color: colors.primary }]}
          >
            Registro - Cliente
          </Text>

          <Surface
            style={[
              styles.infoBox,
              {
                backgroundColor: isDark ? "#333" : "#f0f0ff",
                borderLeftColor: colors.primary,
              },
            ]}
            elevation={1}
          >
            <Text
              variant="titleMedium"
              style={[styles.benefitTitle, { color: colors.primary }]}
            >
              ¿Por qué registrarte?
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.benefitText, { color: colors.text }]}
            >
              En ciertos horarios o circunstancias, el chofer puede preferir un
              cliente{" "}
              <Text style={{ fontWeight: "bold", color: colors.primary }}>
                REGISTRADO
              </Text>{" "}
              para disminuir la posibilidad de inconvenientes.
              {"\n\n"}
              Al mismo tiempo, el Cliente Registrado obtiene los datos{" "}
              <Text style={{ fontWeight: "bold", color: colors.primary }}>
                COMPLETOS
              </Text>{" "}
              del chofer. No es obligatorio registrarse para utilizar esta APP.
            </Text>
          </Surface>

          <ThemeSelector />

          <Divider style={styles.divider} />

          <TextInput
            label="Nombre de usuario"
            value={formData.username}
            onChangeText={(text) =>
              setFormData({ ...formData, username: text })
            }
            mode="outlined"
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
            label="Dirección"
            value={formData.direccion}
            onChangeText={(text) =>
              setFormData({ ...formData, direccion: text })
            }
            mode="outlined"
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.divider}
            activeOutlineColor={colors.primary}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor={colors.primary}
            textColor="white"
          >
            Registrarme
          </Button>

          <Button
            mode="text"
            onPress={() => router.back()}
            style={styles.backButton}
            textColor={colors.text}
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
  },
  infoBox: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  benefitTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  benefitText: {
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
