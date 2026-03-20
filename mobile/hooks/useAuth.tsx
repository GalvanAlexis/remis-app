import React, { createContext, useState, useContext, useEffect } from "react";
import {
  authService,
  UserProfile,
  LoginDto,
  RegisterDto,
} from "../services/auth.service";
import { useToast } from "../context/ToastContext";
import {
  registerForPushNotificationsAsync,
  registerPushTokenOnServer,
} from "../services/notifications.service";

interface AuthContextData {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getToken: () => Promise<string | null>;
  forceUpdatePushToken: () => Promise<void>;
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
      // Si falla el checkeo, la sesión es inválida — limpiar silenciosamente
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
      throw error; // El screen de login maneja el toast
    }
  };

  const register = async (data: RegisterDto) => {
    try {
      await authService.register(data);
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error: any) {
      console.error("Registration failed:", error);
      throw error; // El screen de register maneja el toast
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

  const isAuthenticated = !!user;

  const forceUpdatePushToken = async () => {
    if (!isAuthenticated) return;
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await registerPushTokenOnServer(token);
      }
    } catch (error) {
      console.error("[Auth] Error forzando actualización de token:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        getToken: authService.getToken,
        forceUpdatePushToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
