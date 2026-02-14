import api from "./api";
import * as SecureStore from "expo-secure-store";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  role: "CLIENTE" | "CHOFER";
  nombre: string;
  apellido: string;
  dni: string;
  phone: string;
  direccion: string;
  licenciaUrl?: string;
  cedulaUrl?: string;
  habilitacionUrl?: string;
  maxPassengers?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  profile: {
    nombre: string;
    apellido: string;
    dni: string;
    phone: string;
    direccion: string;
  } | null;
  driverDocument: any;
}

export const authService = {
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await api.post("/auth/login", data);
    await SecureStore.setItemAsync("token", response.data.access_token);
    return response.data;
  },

  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await api.post("/auth/register", data);
    await SecureStore.setItemAsync("token", response.data.access_token);
    return response.data;
  },

  async getProfile(): Promise<UserProfile> {
    const response = await api.get("/users/profile");
    return response.data;
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync("token");
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync("token");
  },
};
