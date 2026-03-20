import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  disabled?: boolean;
}

/**
 * Componente de calificación por estrellas diseñado para accesibilidad (+45).
 * - Área de toque mínima de 48x48px por estrella.
 * - Colores sincronizados con el sistema de temas.
 */
export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  onRatingChange,
  size = 32,
  disabled = false,
}) => {
  const { colors } = useAppTheme();

  const handlePress = (index: number) => {
    if (!disabled && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(maxRating)].map((_, i) => {
        const isFilled = i < rating;
        return (
          <Pressable
            key={i}
            onPress={() => handlePress(i)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.starTouchable,
              pressed && !disabled && styles.pressed,
            ]}
            android_ripple={{ color: colors.divider, borderless: true, radius: 24 }}
            accessibilityLabel={`Calificar con ${i + 1} estrellas`}
            accessibilityRole="button"
          >
            <FontAwesome
              name={isFilled ? "star" : "star-o"}
              size={size}
              color={isFilled ? colors.secondary : colors.placeholder}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  starTouchable: {
    padding: 8, // Asegura que el área total sea >= 48x48 si el icono es >= 32
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 1.1 }],
  },
});
