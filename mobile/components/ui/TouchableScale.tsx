import React, { useRef, useMemo } from "react";
import {
  Animated,
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";

interface TouchableScaleProps extends TouchableWithoutFeedbackProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hapticFeedbackStyle?: Haptics.ImpactFeedbackStyle;
  disableHaptic?: boolean;
}

/**
 * TouchableScale
 * Un componente envoltura de Alto Desempeño que brinda retroalimentación física y visual ("Feel & Touch").
 * Sustituye funcionalmente a TouchableOpacity al combinar una mutación geométrica (Scale) de resorte (Spring)
 * y una señal enviada al Taptic Engine del teléfono para confirmar la pulsación del usuario.
 */
export const TouchableScale: React.FC<TouchableScaleProps> = ({
  children,
  style,
  onPress,
  onPressIn,
  onPressOut,
  scaleTo = 0.96, // Escala de rehundimiento por defecto
  hapticFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
  disableHaptic = false,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Usa useMemo para no re-crear arrays de estilos en cada render
  const animatedStyle = useMemo(
    () => ({
      transform: [{ scale }],
      opacity,
    }),
    [scale, opacity]
  );

  const handlePressIn = (e: any) => {
    // Activa la vibración sutil del celular de fondo.
    if (!disableHaptic && Platform.OS !== "web") {
      Haptics.impactAsync(hapticFeedbackStyle).catch(() => {});
    }

    Animated.parallel([
      Animated.spring(scale, {
        toValue: scaleTo,
        useNativeDriver: true, // Libera al JS Thread
        friction: 5,
        tension: 100,
      }),
      Animated.timing(opacity, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 100,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPressOut) onPressOut(e);
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      {...rest}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </TouchableWithoutFeedback>
  );
};
