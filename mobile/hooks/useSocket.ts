import { useEffect, useCallback, useState } from "react";
import { socketService } from "../services/socket.service";
import { useAuth } from "./useAuth";
import { authService } from "../services/auth.service";

export interface SocketEvent {
  name: string;
  handler: (data: any) => void;
}

export const useSocket = (events: SocketEvent[] = []) => {
  const { isAuthenticated, user } = useAuth();
  // Estado que se actualiza cuando el socket conecta/desconecta
  const [isConnected, setIsConnected] = useState(socketService.isConnected());

  // Conectar el socket con token cuando cambia el estado de auth
  const connectSocket = useCallback(async () => {
    try {
      const token = await authService.getToken();
      socketService.connect(token || undefined);
    } catch (error) {
      console.error("Failed to connect socket with token:", error);
      socketService.connect(); // Fallback a invitado
    }
  }, []);

  useEffect(() => {
    connectSocket();
  }, [isAuthenticated, user?.id, connectSocket]);

  // Suscribirse a los eventos de conexión/desconexión para actualizar el estado local
  useEffect(() => {
    const unsubConnect = socketService.onConnect(() => setIsConnected(true));
    const unsubDisconnect = socketService.onDisconnect(() =>
      setIsConnected(false),
    );

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, []);

  // Registrar/desregistrar los eventos de negocio cuando el socket conecta o los eventos cambian
  useEffect(() => {
    if (!isConnected) return; // Esperar a que el socket esté conectado

    // Registrar todos los eventos
    events.forEach((event) => {
      socketService.on(event.name, event.handler);
    });

    return () => {
      // Limpiar listeners al desmontar o cuando cambien los eventos/conexión
      events.forEach((event) => {
        socketService.off(event.name, event.handler);
      });
    };
  }, [events, isConnected]); // ← isConnected como dependencia: se re-ejecuta cuando el socket conecta

  return { socketService, isConnected };
};
