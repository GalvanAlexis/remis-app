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
  HelperText,
} from "react-native-paper";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../hooks/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";
import { ThemeSelector } from "../../components/ThemeSelector";

// ─── Reglas de validación ───────────────────────────────────────────────────
const VALIDATIONS = {
  username: {
    regex: /^[a-zA-Z0-9_]{3,30}$/,
    msg: "Usuario: 3-30 caracteres alfanuméricos o guión bajo",
  },
  password: {
    regex: /^.{8,}$/,
    msg: "La contraseña debe tener al menos 8 caracteres",
  },
  nombre: {
    regex: /^.{2,50}$/,
    msg: "El nombre debe tener al menos 2 caracteres",
  },
  apellido: {
    regex: /^.{2,50}$/,
    msg: "El apellido debe tener al menos 2 caracteres",
  },
  dni: { regex: /^\d{7,8}$/, msg: "El DNI debe tener 7 u 8 dígitos numéricos" },
  licenciaUrl: {
    regex: /^[A-Z0-9]{5,15}$/i,
    msg: "Licencia: 5-15 caracteres alfanuméricos (ej: A123456)",
  },
  cedulaUrl: {
    regex: /^[A-Z0-9]{5,15}$/i,
    msg: "Cédula: 5-15 caracteres alfanuméricos",
  },
  habilitacionUrl: {
    regex: /^[A-Z0-9\-]{3,20}$/i,
    msg: "Habilitación: 3-20 caracteres alfanuméricos",
  },
  maxPassengers: {
    regex: /^([1-9]|1[0-9]|20)$/,
    msg: "Ingresá un número entre 1 y 20",
  },
  vehicleModel: {
    regex: /^.{3,60}$/,
    msg: "El modelo debe tener al menos 3 caracteres",
  },
  vehiclePlate: {
    regex: /^[A-Z]{2,3}\d{3}[A-Z]{0,2}$/i,
    msg: "Patente inválida. Formatos: ABC123 (viejo) o AB123CD (Mercosur)",
  },
  vehicleColor: {
    regex: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]{3,20}$/,
    msg: "El color debe contener solo letras (3-20 caracteres)",
  },
};

type FormField = keyof typeof VALIDATIONS;

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
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  // Keep themePreference in sync with selected theme
  useEffect(() => {
    setFormData((prev) => ({ ...prev, themePreference: theme }));
  }, [theme]);

  const validateField = (field: FormField, value: string): string => {
    const rule = VALIDATIONS[field];
    if (!value || !value.trim()) return `Este campo es obligatorio`;
    if (!rule.regex.test(value)) return rule.msg;
    return "";
  };

  const handleChange = (field: FormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: FormField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(
        field,
        formData[field as keyof typeof formData] as string,
      ),
    }));
  };

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
    // Validar todos los campos antes de enviar
    const fieldsToValidate: FormField[] = [
      "username",
      "password",
      "nombre",
      "apellido",
      "dni",
      "licenciaUrl",
      "cedulaUrl",
      "habilitacionUrl",
      "maxPassengers",
      "vehicleModel",
      "vehiclePlate",
      "vehicleColor",
    ];

    const newErrors: Partial<Record<FormField, string>> = {};
    const newTouched: Partial<Record<FormField, boolean>> = {};
    let hasErrors = false;

    fieldsToValidate.forEach((field) => {
      newTouched[field] = true;
      const error = validateField(
        field,
        formData[field as keyof typeof formData] as string,
      );
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    setTouched(newTouched);
    setErrors(newErrors);

    if (hasErrors) {
      Alert.alert(
        "Datos inválidos",
        "Por favor corregí los campos marcados en rojo.",
      );
      return;
    }

    setLoading(true);
    try {
      await register({
        ...formData,
        role: "CHOFER",
        vehiclePlate: formData.vehiclePlate.toUpperCase(),
      });
    } catch (error: any) {
      Alert.alert(
        "Error al registrar",
        error.response?.data?.message ||
          "Error al registrar. Verifica los datos.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper para renderizar campo con error
  const renderInput = (
    field: FormField,
    label: string,
    options: {
      keyboardType?: any;
      secureTextEntry?: boolean;
      autoCapitalize?: any;
      placeholder?: string;
      style?: any;
    } = {},
  ) => (
    <View style={options.style}>
      <TextInput
        label={label}
        value={formData[field as keyof typeof formData] as string}
        onChangeText={(text) => handleChange(field, text)}
        onBlur={() => handleBlur(field)}
        mode="outlined"
        style={[styles.input, { backgroundColor: colors.surface }]}
        textColor={colors.text}
        outlineColor={
          touched[field] && errors[field] ? colors.error : colors.divider
        }
        activeOutlineColor={
          touched[field] && errors[field] ? colors.error : colors.primary
        }
        error={!!(touched[field] && errors[field])}
        {...options}
      />
      {touched[field] && errors[field] ? (
        <HelperText type="error" visible style={styles.helperText}>
          {errors[field]}
        </HelperText>
      ) : null}
    </View>
  );

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

          {renderInput("username", "Nombre de usuario", {
            autoCapitalize: "none",
          })}
          {renderInput("password", "Contraseña", { secureTextEntry: true })}

          <View style={styles.row}>
            {renderInput("nombre", "Nombre", {
              style: { flex: 1, marginRight: 8 },
            })}
            {renderInput("apellido", "Apellido", { style: { flex: 1 } })}
          </View>

          {renderInput("dni", "DNI", {
            keyboardType: "numeric",
            placeholder: "Ej: 35123456",
          })}

          <Divider style={styles.divider} />
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: colors.primary }]}
          >
            Documentación y Vehículo
          </Text>

          {renderInput("licenciaUrl", "Nº Licencia de Conducir", {
            placeholder: "Ej: A123456",
            autoCapitalize: "characters",
          })}
          {renderInput("cedulaUrl", "Cédula Verde/Azul", {
            placeholder: "Nº de Cédula",
            autoCapitalize: "characters",
          })}
          {renderInput("habilitacionUrl", "Habilitaciones de Transporte", {
            placeholder: "Nº Habilitación Municipal",
            autoCapitalize: "characters",
          })}
          {renderInput("maxPassengers", "Pasajeros Máximos (1-20)", {
            keyboardType: "numeric",
          })}
          {renderInput("vehicleModel", "Modelo del Vehículo", {
            placeholder: "Ej: Fiat Cronos, Toyota Corolla...",
          })}

          <View style={styles.row}>
            {renderInput("vehiclePlate", "Patente", {
              style: { flex: 1, marginRight: 8 },
              autoCapitalize: "characters",
              placeholder: "Ej: AF123BC",
            })}
            {renderInput("vehicleColor", "Color", {
              style: { flex: 1 },
              placeholder: "Blanco",
            })}
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
    marginBottom: 0,
  },
  helperText: {
    marginTop: -4,
    marginBottom: 6,
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
