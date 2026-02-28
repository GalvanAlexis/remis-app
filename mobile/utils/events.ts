/**
 * events.ts — Event emitter mínimo para comunicar api.ts (sin React) con el contexto global.
 *
 * Por qué: api.ts no puede acceder a React Context ni al router de Expo.
 * Solución: emite eventos que el ToastContext escucha para mostrar mensajes y redirigir.
 */

type Listener = (...args: any[]) => void;

class EventEmitter {
  private listeners: Record<string, Listener[]> = {};

  on(event: string, listener: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
    return () => this.off(event, listener); // retorna unsubscribe
  }

  off(event: string, listener: Listener) {
    this.listeners[event] = (this.listeners[event] || []).filter(
      (l) => l !== listener,
    );
  }

  emit(event: string, ...args: any[]) {
    (this.listeners[event] || []).forEach((l) => l(...args));
  }
}

export const appEvents = new EventEmitter();

// Eventos disponibles
export const APP_EVENTS = {
  /** Dispara cuando el refresh token falla o la sesión expira */
  SESSION_EXPIRED: "session_expired",
  /** Error de red o servidor */
  NETWORK_ERROR: "network_error",
} as const;
