import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { appEvents, APP_EVENTS } from "../utils/events";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: agrega el access_token a cada request ──────────────
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: auto-refresh en 401 ───────────────────────────────
//
// Flujo cuando access_token expira:
//   1. Request devuelve 401
//   2. Leemos refresh_token + userId del SecureStore
//   3. POST /auth/refresh → backend valida y devuelve nuevos tokens
//   4. Guardamos los nuevos tokens
//   5. Reintentamos la request original con el nuevo access_token
//   6. Si /auth/refresh también falla → borramos storage (fuerza logout)
//
// El flag _retry previene loops: si la request reintentada también da 401,
// no volvemos a intentar refresh indefinidamente.

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig;

    // Solo intentamos refresh en 401 y si no lo hemos intentado ya
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refresh_token");
        const userId = await SecureStore.getItemAsync("user_id");

        if (!refreshToken || !userId) {
          // Sin refresh token → forzar logout silencioso
          await clearSession();
          return Promise.reject(error);
        }

        // Llamamos directamente con axios (no api) para evitar interceptor circular
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          { userId, refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        const { access_token, refresh_token } = refreshResponse.data;

        // Guardamos los nuevos tokens
        await SecureStore.setItemAsync("token", access_token);
        await SecureStore.setItemAsync("refresh_token", refresh_token);

        // Reintentamos la request original con el nuevo access_token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch {
        // Refresh falló (token expirado o inválido) → logout forzado
        await clearSession();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

async function clearSession(notify = true) {
  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("refresh_token");
  await SecureStore.deleteItemAsync("user_id");
  if (notify) {
    appEvents.emit(APP_EVENTS.SESSION_EXPIRED);
  }
}

export default api;
