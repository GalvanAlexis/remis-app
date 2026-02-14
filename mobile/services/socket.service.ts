import { io, Socket } from "socket.io-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:3000";

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(API_URL, {
        transports: ["websocket"],
      });

      this.socket.on("connect", () => {
        console.log("Connected to Socket.io server");
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from Socket.io server");
      });
    }
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
      if (this.socket) {
        this.socket.emit(event, data, (response: any) => {
          resolve(response);
        });
      } else {
        resolve(null);
      }
    });
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export const socketService = new SocketService();
