import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  Divider,
  IconButton,
} from "react-native-paper";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../hooks/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";
import { ThemeSelector } from "../../components/ThemeSelector";

export default function RegisterChoferScreen() {
  const { theme, colors, isDark } = useAppTheme();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    nombre: "",
    apellido: "",
    dni: "",
    profilePictureUrl: "",
    licenciaUrl: "",
    cedulaUrl: "",
    habilitacionUrl: "",
    maxPassengers: "4",
    vehicleModel: "",
    vehiclePlate: "",
    vehicleColor: "",
    themePreference: theme,
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  // Keep themePreference in sync with selected theme
  useEffect(() => {
    setFormData((prev) => ({ ...prev, themePreference: theme }));
  }, [theme]);

  const handlePickImage = async (useCamera: boolean) => {
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Error", "Se requiere permiso de cámara para esta acción");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Error", "Se requiere permiso de galería para esta acción");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData({ ...formData, profilePictureUrl: result.assets[0].uri });
    }
  };

  const handleRegister = async () => {
    // Validate all fields
    const {
      username,
      password,
      nombre,
      apellido,
      dni,
      profilePictureUrl,
      licenciaUrl,
      cedulaUrl,
      habilitacionUrl,
      vehicleModel,
      vehiclePlate,
      vehicleColor,
    } = formData;

    if (
      !username ||
      !password ||
      !nombre ||
      !apellido ||
      !dni ||
      !profilePictureUrl ||
      !licenciaUrl ||
      !cedulaUrl ||
      !habilitacionUrl ||
      !vehicleModel ||
      !vehiclePlate ||
      !vehicleColor
    ) {
      Alert.alert(
        "Error",
        "Todos los campos son obligatorios, incluyendo la foto de perfil y la documentación.",
      );
      return;
    }

    setLoading(true);
    try {
      await register({
        ...formData,
        role: "CHOFER",
      });
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
            Registro - Chofer
          </Text>

          <ThemeSelector />

          <Divider style={styles.divider} />

          <Surface style={styles.profilePicContainer} elevation={0}>
            {formData.profilePictureUrl ? (
              <Image
                source={{ uri: formData.profilePictureUrl }}
                style={[styles.profilePic, { borderColor: colors.primary }]}
              />
            ) : (
              <View
                style={[
                  styles.profilePicPlaceholder,
                  {
                    backgroundColor: isDark ? "#333" : "#f0f0f0",
                    borderColor: colors.divider,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="camera"
                  size={50}
                  color={colors.placeholder}
                />
              </View>
            )}
            <View style={styles.imageButtons}>
              <IconButton
                icon="camera"
                mode="contained"
                containerColor={colors.primary}
                iconColor="white"
                onPress={() => handlePickImage(true)}
              />
              <IconButton
                icon="image"
                mode="contained"
                containerColor={colors.primary}
                iconColor="white"
                onPress={() => handlePickImage(false)}
              />
            </View>
            <Text
              style={[styles.photoLabel, { color: colors.text, opacity: 0.6 }]}
            >
              Foto de Perfil (Obligatoria)
            </Text>
          </Surface>

          <Divider style={styles.divider} />

          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: colors.primary }]}
          >
            Datos Personales
          </Text>

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
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.divider}
            activeOutlineColor={colors.primary}
          />

          <View style={styles.row}>
            <TextInput
              label="Nombre"
              value={formData.nombre}
              onChangeText={(text) =>
                setFormData({ ...formData, nombre: text })
              }
              mode="outlined"
              style={[
                styles.input,
                { flex: 1, marginRight: 8, backgroundColor: colors.surface },
              ]}
              textColor={colors.text}
              outlineColor={colors.divider}
              activeOutlineColor={colors.primary}
            />
            <TextInput
              label="Apellido"
              value={formData.apellido}
              onChangeText={(text) =>
                setFormData({ ...formData, apellido: text })
              }
              mode="outlined"
              style={[
                styles.input,
                { flex: 1, backgroundColor: colors.surface },
              ]}
              textColor={colors.text}
              outlineColor={colors.divider}
              activeOutlineColor={colors.primary}
            />
          </View>

          <TextInput
            label="DNI"
            value={formData.dni}
            onChangeText={(text) => setFormData({ ...formData, dni: text })}
            mode="outlined"
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.divider}
            activeOutlineColor={colors.primary}
          />

          <Divider style={styles.divider} />
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: colors.primary }]}
          >
            Documentación y Vehículo
          </Text>

          <TextInput
            label="Nº Licencia de Conducir"
            value={formData.licenciaUrl}
            onChangeText={(text) =>
              setFormData({ ...formData, licenciaUrl: text })
            }
            mode="outlined"
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.divider}
            activeOutlineColor={colors.primary}
            placeholder="Ej: A123456"
          />

          <TextInput
            label="Cédula Verde/Azul"
            value={formData.cedulaUrl}
            onChangeText={(text) =>
              setFormData({ ...formData, cedulaUrl: text })
            }
            mode="outlined"
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.divider}
            activeOutlineColor={colors.primary}
            placeholder="Nº de Cédula"
          />

          <TextInput
            label="Habilitaciones de Transporte"
            value={formData.habilitacionUrl}
            onChangeText={(text) =>
              setFormData({ ...formData, habilitacionUrl: text })
            }
            mode="outlined"
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.divider}
            activeOutlineColor={colors.primary}
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
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.divider}
            activeOutlineColor={colors.primary}
          />

          <TextInput
            label="Modelo del Vehículo"
            value={formData.vehicleModel}
            onChangeText={(text) =>
              setFormData({ ...formData, vehicleModel: text })
            }
            mode="outlined"
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.divider}
            activeOutlineColor={colors.primary}
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
              style={[
                styles.input,
                { flex: 1, marginRight: 8, backgroundColor: colors.surface },
              ]}
              textColor={colors.text}
              outlineColor={colors.divider}
              activeOutlineColor={colors.primary}
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
              style={[
                styles.input,
                { flex: 1, backgroundColor: colors.surface },
              ]}
              textColor={colors.text}
              outlineColor={colors.divider}
              activeOutlineColor={colors.primary}
              placeholder="Blanco"
            />
          </View>

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor={colors.primary}
            textColor="white"
          >
            Registrarme como Chofer
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
    padding: 15,
    paddingTop: 40,
    paddingBottom: 40,
  },
  surface: {
    padding: 20,
    borderRadius: 20,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 20,
  },
  profilePicContainer: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  profilePicPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  imageButtons: {
    flexDirection: "row",
    marginTop: -20,
    justifyContent: "center",
  },
  photoLabel: {
    marginTop: 10,
    color: "#aaa",
    fontSize: 12,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: "bold",
    opacity: 0.8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 0,
  },
  divider: {
    marginVertical: 15,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 25,
    paddingVertical: 8,
    borderRadius: 12,
  },
  backButton: {
    marginTop: 10,
  },
});
