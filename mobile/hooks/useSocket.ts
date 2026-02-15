import { useEffect, useCallback } from "react";
import { socketService } from "../services/socket.service";
import { useAuth } from "./useAuth";
import { authService } from "../services/auth.service";

export interface SocketEvent {
  name: string;
  handler: (data: any) => void;
}

export const useSocket = (events: SocketEvent[] = []) => {
  const { isAuthenticated, user } = useAuth();

  const connectSocket = useCallback(async () => {
    try {
      const token = await authService.getToken();
      socketService.connect(token || undefined);
    } catch (error) {
      console.error("Failed to connect socket with token:", error);
      socketService.connect(); // Fallback to guest
    }
  }, []);

  useEffect(() => {
    // Conectar/Reconectar cuando cambia el estado de autenticación o el usuario
    connectSocket();

    return () => {
      // No desconectamos globalmente aquí para evitar cortes en transiciones rápidas
      // pero podríamos si quisiéramos un cierre total al desmontar la App
    };
  }, [isAuthenticated, user?.id, connectSocket]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Registrar todos los eventos pasados por parámetro
    events.forEach((event) => {
      socketService.on(event.name, event.handler);
    });

    return () => {
      // Limpiar listeners al desmontar el componente o cambiar eventos
      events.forEach((event) => {
        socketService.off(event.name, event.handler);
      });
    };
  }, [events]);

  return socketService;
};
