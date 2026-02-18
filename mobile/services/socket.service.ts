import { io, Socket } from "socket.io-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

class SocketService {
  private socket: Socket | null = null;
  private _isConnected: boolean = false;
  private connectCallbacks: Set<() => void> = new Set();
  private disconnectCallbacks: Set<() => void> = new Set();

  connect(token?: string) {
    // Si ya existe un socket conectado con el mismo token, no reconectar
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      this._isConnected = true;
      console.log(
        "Connected to Socket.io server",
        token ? "(Authenticated)" : "(Guest)",
      );
      // Notificar a todos los suscriptores que el socket conectó
      this.connectCallbacks.forEach((cb) => cb());
    });

    this.socket.on("disconnect", (reason) => {
      this._isConnected = false;
      console.log("Disconnected from Socket.io server:", reason);
      this.disconnectCallbacks.forEach((cb) => cb());
    });

    this.socket.on("connect_error", (err) => {
      this._isConnected = false;
      console.error("Socket Connection Error:", err.message);
    });

    // Si el socket ya estaba conectado antes de registrar el listener (raro pero posible)
    if (this.socket.connected) {
      this._isConnected = true;
      this.connectCallbacks.forEach((cb) => cb());
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._isConnected = false;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this._isConnected;
  }

  /** Suscribirse al evento de conexión. Devuelve una función para desuscribirse. */
  onConnect(callback: () => void): () => void {
    this.connectCallbacks.add(callback);
    // Si ya está conectado, ejecutar inmediatamente
    if (this._isConnected) {
      callback();
    }
    return () => this.connectCallbacks.delete(callback);
  }

  /** Suscribirse al evento de desconexión. Devuelve una función para desuscribirse. */
  onDisconnect(callback: () => void): () => void {
    this.disconnectCallbacks.add(callback);
    return () => this.disconnectCallbacks.delete(callback);
  }

  emit(event: string, data: any) {
    if (this.socket && this._isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket not connected, cannot emit "${event}"`);
    }
  }

  request(event: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      if (this.socket && this._isConnected) {
        this.socket.emit(event, data, (response: any) => {
          resolve(response);
        });
      } else {
        console.warn(`Socket not connected, cannot emit ${event}`);
        resolve(null);
      }
    });
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }
}

export const socketService = new SocketService();
