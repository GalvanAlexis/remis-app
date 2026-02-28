import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { appEvents, APP_EVENTS } from "../utils/events";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type ToastType = "error" | "warning" | "info" | "success";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextData {
  showToast: (toast: Omit<Toast, "id">) => void;
  showError: (title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

let idCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();
  const { logout } = useAuth();
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = String(++idCounter);
      const newToast: Toast = { id, duration: 4000, ...toast };
      setToasts((prev) => [...prev.slice(-2), newToast]); // máximo 3 toasts
      setTimeout(() => dismissToast(id), newToast.duration);
    },
    [dismissToast],
  );

  const showError = useCallback(
    (title: string, message?: string) =>
      showToast({ type: "error", title, message }),
    [showToast],
  );

  const showSuccess = useCallback(
    (title: string, message?: string) =>
      showToast({ type: "success", title, message }),
    [showToast],
  );

  const showInfo = useCallback(
    (title: string, message?: string) =>
      showToast({ type: "info", title, message }),
    [showToast],
  );

  const showWarning = useCallback(
    (title: string, message?: string) =>
      showToast({ type: "warning", title, message }),
    [showToast],
  );

  // ── Escucha eventos globales de api.ts ────────────────────────────────────

  useEffect(() => {
    const unsubExpired = appEvents.on(APP_EVENTS.SESSION_EXPIRED, async () => {
      showToast({
        type: "warning",
        title: "Sesión expirada",
        message: "Tu sesión venció. Iniciá sesión de nuevo.",
        duration: 5000,
      });
      try {
        await logoutRef.current();
      } catch {}
      // Redirige al welcome después de que el toast sea visible
      setTimeout(() => router.replace("/(auth)/welcome"), 800);
    });

    const unsubNetwork = appEvents.on(APP_EVENTS.NETWORK_ERROR, () => {
      showToast({
        type: "error",
        title: "Sin conexión",
        message: "Verificá tu conexión a internet.",
        duration: 5000,
      });
    });

    return () => {
      unsubExpired();
      unsubNetwork();
    };
  }, [showToast, router]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showError,
        showSuccess,
        showInfo,
        showWarning,
        dismissToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
