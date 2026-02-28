import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useToast, Toast, ToastType } from "../context/ToastContext";

// ─── Config visual por tipo ───────────────────────────────────────────────────

const TOAST_CONFIG: Record<
  ToastType,
  { bg: string; border: string; icon: string; iconColor: string }
> = {
  error: {
    bg: "#1A0A0A",
    border: "#EF4444",
    icon: "alert-circle",
    iconColor: "#EF4444",
  },
  warning: {
    bg: "#1A1200",
    border: "#F59E0B",
    icon: "clock-alert",
    iconColor: "#F59E0B",
  },
  info: {
    bg: "#0A1020",
    border: "#3B82F6",
    icon: "information",
    iconColor: "#3B82F6",
  },
  success: {
    bg: "#0A1A0A",
    border: "#22C55E",
    icon: "check-circle",
    iconColor: "#22C55E",
  },
};

// ─── Componente de un toast individual ───────────────────────────────────────

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { dismissToast } = useToast();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const config = TOAST_CONFIG[toast.type];

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    // Slide out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => dismissToast(toast.id));
  };

  return (
    <Animated.View
      style={[
        s.toast,
        {
          backgroundColor: config.bg,
          borderLeftColor: config.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Ícono */}
      <MaterialCommunityIcons
        name={config.icon as any}
        size={24}
        color={config.iconColor}
        style={s.icon}
      />

      {/* Texto */}
      <View style={s.textArea}>
        <Text style={[s.title, { color: "#F8FAFC" }]}>{toast.title}</Text>
        {toast.message ? <Text style={s.message}>{toast.message}</Text> : null}
        {toast.action ? (
          <TouchableOpacity onPress={toast.action.onPress} style={s.action}>
            <Text style={[s.actionLabel, { color: config.border }]}>
              {toast.action.label}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Botón cerrar */}
      <TouchableOpacity
        onPress={handleDismiss}
        hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
      >
        <MaterialCommunityIcons name="close" size={18} color="#64748B" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Overlay de toasts (va en el _layout como overlay global) ────────────────

export const AppToast: React.FC = () => {
  const { toasts } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      style={[
        s.container,
        { top: insets.top + 8, width: Dimensions.get("window").width - 32 },
      ]}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  icon: { marginRight: 10 },
  textArea: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  message: { fontSize: 12, color: "#94A3B8", marginTop: 2, lineHeight: 16 },
  action: { marginTop: 6 },
  actionLabel: { fontSize: 13, fontWeight: "600" },
});
