import api from "./api";
import * as SecureStore from "expo-secure-store";

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  role: "CLIENTE" | "CHOFER";
  nombre: string;
  apellido: string;
  dni: string;
  direccion?: string;
  profilePictureUrl?: string;
  // Chofer specific
  licenciaUrl?: string;
  cedulaUrl?: string;
  habilitacionUrl?: string;
  maxPassengers?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  themePreference?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  profile: {
    nombre: string;
    apellido: string;
    dni: string;
    direccion?: string;
    profilePictureUrl?: string;
    themePreference?: string;
  } | null;
  driverDocument?: {
    licenciaUrl?: string;
    cedulaUrl?: string;
    habilitacionUrl?: string;
    maxPassengers?: number;
    vehicleModel?: string;
    vehiclePlate?: string;
    vehicleColor?: string;
  };
}

export const authService = {
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await api.post("/auth/login", data);
    await SecureStore.setItemAsync("token", response.data.access_token);
    await SecureStore.setItemAsync(
      "refresh_token",
      response.data.refresh_token,
    );
    await SecureStore.setItemAsync("user_id", response.data.user.id);
    return response.data;
  },

  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await api.post("/auth/register", data);
    await SecureStore.setItemAsync("token", response.data.access_token);
    await SecureStore.setItemAsync(
      "refresh_token",
      response.data.refresh_token,
    );
    await SecureStore.setItemAsync("user_id", response.data.user.id);
    return response.data;
  },

  async getProfile(): Promise<UserProfile> {
    const response = await api.get("/users/profile");
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      // Invalida el refresh token en el servidor
      await api.post("/auth/logout");
    } catch {
      // Si falla (token ya expirado), continuamos igual — se borra el storage local
    } finally {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("refresh_token");
      await SecureStore.deleteItemAsync("user_id");
    }
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync("token");
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync("refresh_token");
  },

  async getUserId(): Promise<string | null> {
    return await SecureStore.getItemAsync("user_id");
  },

  async saveNewTokens(
    accessToken: string,
    refreshToken: string,
    userId: string,
  ): Promise<void> {
    await SecureStore.setItemAsync("token", accessToken);
    await SecureStore.setItemAsync("refresh_token", refreshToken);
    await SecureStore.setItemAsync("user_id", userId);
  },
};
