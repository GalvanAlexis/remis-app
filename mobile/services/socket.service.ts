import { io, Socket } from "socket.io-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

class SocketService {
  private socket: Socket | null = null;

  connect(token?: string) {
    // Si ya existe un socket, lo desconectamos para asegurar que el nuevo use el token actualizado
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(API_URL, {
      auth: {
        token: token,
      },
    });

    this.socket.on("connect", () => {
      console.log(
        "Connected to Socket.io server",
        token ? "(Authenticated)" : "(Guest)",
      );
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from Socket.io server:", reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  request(event: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      if (this.socket && this.socket.connected) {
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
