import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
import api from "./api";

/**
 * Pide permisos de notificación y obtiene el Expo Push Token.
 * Devuelve el token si el usuario lo otorgó, null si rechazó o no hay dispositivo físico.
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  // Verificar/solicitar permisos
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Notifications] Permiso denegado por el usuario");
    return null;
  }

  // Obtener Expo Push Token
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.log(
        "[Notifications] No se encontró projectId. Las notificaciones push no funcionarán sin configuración EAS.",
      );
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;
    console.log("[Notifications] Token obtenido:", token.slice(0, 40) + "...");
    return token;
  } catch (err) {
    // Solo loguear como warning si no es un error de configuración esperable
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("projectId")) {
      console.warn("[Notifications] Error al obtener push token:", msg);
    }
    return null;
  }
}

/**
 * Envía el pushToken al backend para persistirlo.
 * Solo lo hace si el usuario está autenticado (JWT disponible en api.ts).
 */
export async function registerPushTokenOnServer(
  pushToken: string,
): Promise<void> {
  try {
    await api.post("/notifications/register-token", { pushToken });
    console.log("[Notifications] Token registrado en el servidor");
  } catch (err) {
    // Fallo silencioso — las push son opcionales, no deben bloquear el flujo
    console.warn("[Notifications] No se pudo registrar el token:", err);
  }
}

/**
 * Configura el handler de notificaciones en foreground.
 * Expo por defecto no muestra nada cuando la app está abierta — esto lo activa.
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
