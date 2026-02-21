import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from "react-native";
import {
  Text,
  Surface,
  Chip,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useAppTheme } from "../../context/ThemeContext";
import { ridesService, RideHistoryItem } from "../../services/rides.service";

type FilterStatus = "TODOS" | "COMPLETED" | "CANCELLED";

const FILTER_LABELS: Record<FilterStatus, string> = {
  TODOS: "Todos",
  COMPLETED: "Completados",
  CANCELLED: "Cancelados",
};

function StarRating({ score }: { score: number }) {
  return (
    <Text style={{ color: "#F59E0B", fontSize: 14 }}>
      {"★".repeat(score)}
      {"☆".repeat(5 - score)}
    </Text>
  );
}

function RideCard({
  ride,
  role,
  colors,
}: {
  ride: RideHistoryItem;
  role: string;
  colors: any;
}) {
  const date = new Date(ride.createdAt);
  const dateStr = date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCompleted = ride.status === "COMPLETED";
  const statusColor = isCompleted ? "#22C55E" : "#EF4444";
  const statusLabel = isCompleted ? "Completado" : "Cancelado";

  const otherPartyName =
    role === "CLIENTE"
      ? `${ride.selectedOffer?.driver?.profile?.nombre ?? "Chofer"} ${ride.selectedOffer?.driver?.profile?.apellido ?? ""}`.trim()
      : `${ride.client?.profile?.nombre ?? ride.detalle ?? "Pasajero"} ${ride.client?.profile?.apellido ?? ""}`.trim();

  return (
    <Surface
      style={[styles.card, { backgroundColor: colors.surface }]}
      elevation={1}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text
            variant="labelSmall"
            style={{ color: colors.text, opacity: 0.5 }}
          >
            {dateStr} · {timeStr}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: colors.text, opacity: 0.75, marginTop: 2 }}
          >
            {role === "CLIENTE" ? "Chofer:" : "Pasajero:"}{" "}
            {otherPartyName || "—"}
          </Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}
        >
          <Text style={{ color: statusColor, fontWeight: "700", fontSize: 11 }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <Divider
        style={{ backgroundColor: colors.divider, marginVertical: 10 }}
      />

      {/* Ruta */}
      <View style={styles.route}>
        <View style={styles.routeRow}>
          <Text style={[styles.routeDot, { color: colors.primary }]}>●</Text>
          <Text
            variant="bodyMedium"
            style={{ color: colors.text, flex: 1 }}
            numberOfLines={1}
          >
            {ride.originAddress}
          </Text>
        </View>
        <View style={[styles.routeLine, { backgroundColor: colors.divider }]} />
        <View style={styles.routeRow}>
          <Text style={[styles.routeDot, { color: "#EF4444" }]}>●</Text>
          <Text
            variant="bodyMedium"
            style={{ color: colors.text, flex: 1 }}
            numberOfLines={1}
          >
            {ride.destAddress}
          </Text>
        </View>
      </View>

      {/* Footer */}
      {isCompleted && (
        <>
          <Divider
            style={{ backgroundColor: colors.divider, marginVertical: 10 }}
          />
          <View style={styles.cardFooter}>
            {ride.selectedOffer?.quotedPrice != null && (
              <Text
                variant="titleMedium"
                style={{ color: colors.primary, fontWeight: "bold" }}
              >
                ${ride.selectedOffer.quotedPrice.toFixed(2)}
              </Text>
            )}
            {ride.rating ? (
              <StarRating score={ride.rating.score} />
            ) : (
              <Text
                variant="labelSmall"
                style={{ color: colors.text, opacity: 0.4 }}
              >
                Sin calificación
              </Text>
            )}
          </View>
        </>
      )}
    </Surface>
  );
}

export default function HistoryScreen() {
  const { colors } = useAppTheme();
  const { user } = useAuth();

  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("TODOS");
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await ridesService.getHistory(1, 50);
      setRides(res.data);
    } catch (e: any) {
      setError("No se pudo cargar el historial. Intentá de nuevo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carga automática al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory]),
  );

  const filteredRides =
    filter === "TODOS" ? rides : rides.filter((r) => r.status === filter);

  const role = user?.role ?? "CLIENTE";
  const title = role === "CLIENTE" ? "Mis Viajes" : "Viajes Realizados";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Filtros */}
      <View style={styles.filters}>
        {(Object.keys(FILTER_LABELS) as FilterStatus[]).map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={[
              styles.chip,
              {
                backgroundColor: filter === f ? colors.primary : colors.surface,
              },
            ]}
            textStyle={{
              color: filter === f ? "#FFFFFF" : colors.text,
              fontSize: 12,
            }}
          >
            {FILTER_LABELS[f]}
          </Chip>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: "#EF4444", textAlign: "center" }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchHistory(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🛺</Text>
              <Text
                variant="bodyLarge"
                style={{
                  color: colors.text,
                  opacity: 0.5,
                  textAlign: "center",
                }}
              >
                {filter === "TODOS"
                  ? "Todavía no tenés viajes registrados."
                  : `Sin viajes ${FILTER_LABELS[filter].toLowerCase()}.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <RideCard ride={item} role={role} colors={colors} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    borderRadius: 20,
  },
  list: {
    padding: 16,
    paddingTop: 4,
    gap: 12,
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  route: {
    gap: 4,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeDot: {
    fontSize: 10,
    width: 14,
    textAlign: "center",
  },
  routeLine: {
    width: 2,
    height: 10,
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    minHeight: 300,
  },
});
