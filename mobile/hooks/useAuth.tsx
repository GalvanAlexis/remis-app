import React, { createContext, useState, useContext, useEffect } from "react";
import { Alert } from "react-native";
import {
  authService,
  UserProfile,
  LoginDto,
  RegisterDto,
} from "../services/auth.service";

interface AuthContextData {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await authService.getToken();
      if (token) {
        const profile = await authService.getProfile();
        setUser(profile);
      }
    } catch (error) {
      // Silencioso: si falla el checkeo es porque el token expiro o no hay sesion local.
      await authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginDto) => {
    try {
      await authService.login(data);
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error: any) {
      console.error("Login failed:", error);
      Alert.alert(
        "Error de Inicio de Sesión",
        error.response?.data?.message ||
          "Credenciales inválidas o error de servidor",
      );
      throw error;
    }
  };

  const register = async (data: RegisterDto) => {
    try {
      await authService.register(data);
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error: any) {
      console.error("Registration failed:", error);
      Alert.alert(
        "Error de Registro",
        error.response?.data?.message || "Ocurrió un error inesperado (500)",
      );
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error) {
      console.error("Refresh profile failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
