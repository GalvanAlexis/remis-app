import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Text,
  Surface,
  Button,
  Chip,
  Divider,
  ProgressBar,
} from "react-native-paper";
import { useAppTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface FreeStats {
  totalRides: number;
  earningsThisMonth: number;
  avgRating: number | null;
  totalRatings: number;
  history: {
    id: string;
    origin: string;
    dest: string;
    price: number;
    date: string;
  }[];
}

interface DayEarning {
  date: string;
  total: number;
}

interface HourSlot {
  hour: number;
  count: number;
}

interface TopItem {
  label: string;
  count: number;
}

interface RatingRow {
  star: number;
  count: number;
}

interface PremiumStats {
  earningsByDay: DayEarning[];
  thisMonthTotal: number;
  lastMonthTotal: number;
  growthPct: number | null;
  monthlyProjection: number;
  acceptanceRate: number | null;
  totalOffers: number;
  acceptedOffers: number;
  hourDistribution: HourSlot[];
  topZones: TopItem[];
  topRoutes: TopItem[];
  ratingBreakdown: RatingRow[];
  topComments: { score: number; comment: string }[];
  cancellationRate: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `$${n.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

const StarBar = ({
  row,
  max,
  colors,
}: {
  row: RatingRow;
  max: number;
  colors: any;
}) => (
  <View style={{ marginBottom: 6 }}>
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}
    >
      <Text style={{ color: colors.text, width: 24, fontSize: 12 }}>
        {row.star}⭐
      </Text>
      <ProgressBar
        progress={max > 0 ? row.count / max : 0}
        color={
          row.star >= 4 ? "#22C55E" : row.star === 3 ? "#F59E0B" : "#EF4444"
        }
        style={{ flex: 1, height: 8, borderRadius: 4, marginHorizontal: 8 }}
      />
      <Text style={{ color: "#94A3B8", fontSize: 11, width: 20 }}>
        {row.count}
      </Text>
    </View>
  </View>
);

// ─── Mini gráfico de barras para ganancias diarias ───────────────────────────

const EarningsChart = ({
  data,
  colors,
}: {
  data: DayEarning[];
  colors: any;
}) => {
  const last14 = data.slice(-14);
  const maxVal = Math.max(...last14.map((d) => d.total), 1);
  return (
    <View>
      <Text style={{ color: "#94A3B8", fontSize: 11, marginBottom: 8 }}>
        Últimos 14 días
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          height: 80,
          gap: 4,
        }}
      >
        {last14.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{
                width: "80%",
                height: Math.max(4, (d.total / maxVal) * 68),
                backgroundColor:
                  i === last14.length - 1 ? colors.primary : "#334155",
                borderRadius: 4,
              }}
            />
            <Text style={{ color: "#475569", fontSize: 8, marginTop: 2 }}>
              {d.date.slice(8)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Horas pico mini heatmap ──────────────────────────────────────────────────

const HourHeatmap = ({ data, colors }: { data: HourSlot[]; colors: any }) => {
  const maxCount = Math.max(...data.map((h) => h.count), 1);
  const peaks = [...data].sort((a, b) => b.count - a.count).slice(0, 3);
  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
        {data.map((slot) => {
          const intensity = slot.count / maxCount;
          const bg =
            intensity > 0.66
              ? colors.primary
              : intensity > 0.33
                ? "#1E40AF"
                : intensity > 0
                  ? "#1E3A5F"
                  : "#1E293B";
          return (
            <View
              key={slot.hour}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: bg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#CBD5E1", fontSize: 9 }}>
                {slot.hour}h
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={{ color: "#64748B", fontSize: 11, marginTop: 8 }}>
        🔥 Picos: {peaks.map((p) => `${p.hour}hs`).join(", ")}
      </Text>
    </View>
  );
};

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function StatsScreen() {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const [tab, setTab] = useState<"free" | "premium">("free");
  const [freeData, setFreeData] = useState<FreeStats | null>(null);
  const [premiumData, setPremiumData] = useState<PremiumStats | null>(null);
  const [loadingFree, setLoadingFree] = useState(false);
  const [loadingPremium, setLoadingPremium] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumBlocked, setPremiumBlocked] = useState(false);

  const loadFree = useCallback(async () => {
    try {
      setLoadingFree(true);
      const res = await api.get<FreeStats>("/stats/free");
      setFreeData(res.data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las estadísticas.");
    } finally {
      setLoadingFree(false);
    }
  }, []);

  const loadPremium = useCallback(async () => {
    try {
      setLoadingPremium(true);
      const res = await api.get<PremiumStats>("/stats/premium");
      setPremiumData(res.data);
      setIsPremium(true);
    } catch (err: any) {
      if (err?.status === 403 || err?.response?.status === 403) {
        setPremiumBlocked(true);
      } else {
        Alert.alert("Error", "No se pudo cargar el analytics premium.");
      }
    } finally {
      setLoadingPremium(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "CHOFER") return;
    loadFree();
  }, [loadFree, user]);

  useEffect(() => {
    if (tab === "premium" && !premiumData && !premiumBlocked) {
      loadPremium();
    }
  }, [tab, premiumData, premiumBlocked, loadPremium]);

  if (user?.role !== "CHOFER") {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: "#64748B" }}>Solo disponible para choferes.</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── Tabs ── */}
      <View style={s.tabRow}>
        <Chip
          selected={tab === "free"}
          onPress={() => setTab("free")}
          style={[s.tab, tab === "free" && { backgroundColor: colors.primary }]}
          textStyle={{ color: tab === "free" ? "#FFF" : colors.text }}
        >
          🆓 Básico
        </Chip>
        <Chip
          selected={tab === "premium"}
          onPress={() => setTab("premium")}
          style={[s.tab, tab === "premium" && { backgroundColor: "#B45309" }]}
          textStyle={{ color: tab === "premium" ? "#FFF" : colors.text }}
        >
          👑 Premium
        </Chip>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ════════════ FREE ════════════ */}
        {tab === "free" && (
          <>
            {loadingFree ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 40 }}
              />
            ) : freeData ? (
              <>
                {/* KPI Cards */}
                <View style={s.kpiRow}>
                  <Surface style={[s.kpi, { backgroundColor: colors.surface }]}>
                    <Text style={s.kpiVal}>{freeData.totalRides}</Text>
                    <Text style={s.kpiLabel}>Viajes totales</Text>
                  </Surface>
                  <Surface style={[s.kpi, { backgroundColor: colors.surface }]}>
                    <Text style={[s.kpiVal, { color: "#22C55E" }]}>
                      {fmt(freeData.earningsThisMonth)}
                    </Text>
                    <Text style={s.kpiLabel}>Este mes</Text>
                  </Surface>
                  <Surface style={[s.kpi, { backgroundColor: colors.surface }]}>
                    <Text style={[s.kpiVal, { color: "#F59E0B" }]}>
                      {freeData.avgRating?.toFixed(1) ?? "—"}⭐
                    </Text>
                    <Text style={s.kpiLabel}>
                      Rating ({freeData.totalRatings})
                    </Text>
                  </Surface>
                </View>

                {/* Historial últimos 20 */}
                <Surface style={[s.card, { backgroundColor: colors.surface }]}>
                  <Text style={[s.cardTitle, { color: colors.text }]}>
                    📋 Últimos viajes
                  </Text>
                  {freeData.history.length === 0 ? (
                    <Text style={{ color: "#64748B", fontSize: 13 }}>
                      Sin viajes completados aún.
                    </Text>
                  ) : (
                    freeData.history.map((ride, i) => (
                      <View key={ride.id}>
                        {i > 0 && (
                          <Divider
                            style={{
                              backgroundColor: "#1E293B",
                              marginVertical: 8,
                            }}
                          />
                        )}
                        <View style={s.rideRow}>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{ color: colors.text, fontSize: 13 }}
                              numberOfLines={1}
                            >
                              {ride.origin}
                            </Text>
                            <Text
                              style={{ color: "#64748B", fontSize: 12 }}
                              numberOfLines={1}
                            >
                              → {ride.dest}
                            </Text>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text
                              style={{ color: "#22C55E", fontWeight: "bold" }}
                            >
                              {fmt(ride.price)}
                            </Text>
                            <Text style={{ color: "#475569", fontSize: 11 }}>
                              {new Date(ride.date).toLocaleDateString("es-AR")}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </Surface>
              </>
            ) : null}
          </>
        )}

        {/* ════════════ PREMIUM ════════════ */}
        {tab === "premium" && (
          <>
            {premiumBlocked ? (
              /* Paywall */
              <Surface style={[s.paywall, { backgroundColor: colors.surface }]}>
                <Text style={s.paywallEmoji}>👑</Text>
                <Text style={[s.paywallTitle, { color: colors.text }]}>
                  Estadísticas Premium
                </Text>
                <Text style={s.paywallDesc}>
                  Desbloqueá gráficos de ganancias, horas pico, tasa de
                  aceptación, proyecciones y mucho más.
                </Text>
                <View style={s.paywallFeatures}>
                  {[
                    "📊 Gráfico de ganancias diarias",
                    "📈 Comparativa mes anterior + Δ%",
                    "🎯 Proyección mensual",
                    "✅ Tasa de aceptación",
                    "🕐 Horas pico (heatmap)",
                    "📍 Top 5 zonas y rutas",
                    "⭐ Análisis de rating completo",
                  ].map((f) => (
                    <Text key={f} style={s.paywallFeatureItem}>
                      {f}
                    </Text>
                  ))}
                </View>
                <Button
                  mode="contained"
                  buttonColor="#B45309"
                  textColor="white"
                  style={{ marginTop: 20 }}
                  contentStyle={{ height: 50 }}
                  icon="crown"
                  onPress={() =>
                    Alert.alert(
                      "Próximamente",
                      "La suscripción premium estará disponible en la próxima actualización.",
                    )
                  }
                >
                  Activar Premium
                </Button>
              </Surface>
            ) : loadingPremium ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 40 }}
              />
            ) : premiumData ? (
              <>
                {/* ── Ganancias ── */}
                <Surface style={[s.card, { backgroundColor: colors.surface }]}>
                  <Text style={[s.cardTitle, { color: colors.text }]}>
                    💰 Ganancias
                  </Text>
                  <View style={s.kpiRow}>
                    <View style={s.miniKpi}>
                      <Text style={[s.kpiVal, { color: "#22C55E" }]}>
                        {fmt(premiumData.thisMonthTotal)}
                      </Text>
                      <Text style={s.kpiLabel}>Este mes</Text>
                    </View>
                    <View style={s.miniKpi}>
                      <Text style={[s.kpiVal, { color: "#94A3B8" }]}>
                        {fmt(premiumData.lastMonthTotal)}
                      </Text>
                      <Text style={s.kpiLabel}>Mes anterior</Text>
                    </View>
                    <View style={s.miniKpi}>
                      <Text
                        style={[
                          s.kpiVal,
                          {
                            color:
                              (premiumData.growthPct ?? 0) >= 0
                                ? "#22C55E"
                                : "#EF4444",
                          },
                        ]}
                      >
                        {premiumData.growthPct != null
                          ? `${premiumData.growthPct > 0 ? "+" : ""}${premiumData.growthPct}%`
                          : "—"}
                      </Text>
                      <Text style={s.kpiLabel}>Δ vs anterior</Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: "#64748B", fontSize: 12 }}>
                      📈 Proyección mensual:{" "}
                      <Text style={{ color: "#22C55E", fontWeight: "bold" }}>
                        {fmt(premiumData.monthlyProjection)}
                      </Text>
                    </Text>
                  </View>
                  <View style={{ marginTop: 16 }}>
                    <EarningsChart
                      data={premiumData.earningsByDay}
                      colors={colors}
                    />
                  </View>
                </Surface>

                {/* ── Tasa de aceptación ── */}
                <Surface style={[s.card, { backgroundColor: colors.surface }]}>
                  <Text style={[s.cardTitle, { color: colors.text }]}>
                    ✅ Tasa de aceptación
                  </Text>
                  <Text style={[s.kpiVal, { color: colors.primary }]}>
                    {premiumData.acceptanceRate != null
                      ? `${premiumData.acceptanceRate}%`
                      : "—"}
                  </Text>
                  <Text
                    style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}
                  >
                    {premiumData.acceptedOffers} de {premiumData.totalOffers}{" "}
                    ofertas aceptadas
                  </Text>
                  <ProgressBar
                    progress={
                      premiumData.acceptanceRate != null
                        ? premiumData.acceptanceRate / 100
                        : 0
                    }
                    color={colors.primary}
                    style={{ marginTop: 10, height: 8, borderRadius: 4 }}
                  />
                </Surface>

                {/* ── Horas pico ── */}
                <Surface style={[s.card, { backgroundColor: colors.surface }]}>
                  <Text style={[s.cardTitle, { color: colors.text }]}>
                    🕐 Horas pico
                  </Text>
                  <HourHeatmap
                    data={premiumData.hourDistribution}
                    colors={colors}
                  />
                </Surface>

                {/* ── Top Zonas ── */}
                <Surface style={[s.card, { backgroundColor: colors.surface }]}>
                  <Text style={[s.cardTitle, { color: colors.text }]}>
                    📍 Top 5 zonas de origen
                  </Text>
                  {premiumData.topZones.length === 0 ? (
                    <Text style={{ color: "#64748B", fontSize: 13 }}>
                      Sin datos suficientes.
                    </Text>
                  ) : (
                    premiumData.topZones.map((z, i) => (
                      <View key={i} style={s.topItem}>
                        <Text style={{ color: "#F59E0B", width: 20 }}>
                          {i + 1}.
                        </Text>
                        <Text
                          style={{ color: colors.text, flex: 1, fontSize: 13 }}
                          numberOfLines={1}
                        >
                          {z.label}
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          {z.count}x
                        </Text>
                      </View>
                    ))
                  )}
                </Surface>

                {/* ── Top Rutas ── */}
                <Surface style={[s.card, { backgroundColor: colors.surface }]}>
                  <Text style={[s.cardTitle, { color: colors.text }]}>
                    🗺️ Top 5 rutas
                  </Text>
                  {premiumData.topRoutes.map((r, i) => (
                    <View key={i} style={s.topItem}>
                      <Text style={{ color: "#F59E0B", width: 20 }}>
                        {i + 1}.
                      </Text>
                      <Text
                        style={{ color: colors.text, flex: 1, fontSize: 12 }}
                        numberOfLines={2}
                      >
                        {r.label}
                      </Text>
                      <Text style={{ color: "#64748B", fontSize: 12 }}>
                        {r.count}x
                      </Text>
                    </View>
                  ))}
                </Surface>

                {/* ── Rating breakdown ── */}
                <Surface style={[s.card, { backgroundColor: colors.surface }]}>
                  <Text style={[s.cardTitle, { color: colors.text }]}>
                    ⭐ Distribución de rating
                  </Text>
                  {(() => {
                    const maxCount = Math.max(
                      ...premiumData.ratingBreakdown.map((r) => r.count),
                      1,
                    );
                    return premiumData.ratingBreakdown.map((row) => (
                      <StarBar
                        key={row.star}
                        row={row}
                        max={maxCount}
                        colors={colors}
                      />
                    ));
                  })()}
                  <View style={{ marginTop: 12 }}>
                    <Text
                      style={{
                        color: "#64748B",
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                    >
                      💬 Mejores comentarios
                    </Text>
                    {premiumData.topComments.length === 0 ? (
                      <Text style={{ color: "#475569", fontSize: 13 }}>
                        Sin comentarios aún.
                      </Text>
                    ) : (
                      premiumData.topComments.map((c, i) => (
                        <View
                          key={i}
                          style={{
                            borderLeftWidth: 2,
                            borderLeftColor: "#22C55E",
                            paddingLeft: 10,
                            marginBottom: 8,
                          }}
                        >
                          <Text style={{ color: colors.text, fontSize: 13 }}>
                            "{c.comment}"
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </Surface>

                {/* ── Cancelaciones ── */}
                <Surface
                  style={[
                    s.card,
                    { backgroundColor: colors.surface, marginBottom: 24 },
                  ]}
                >
                  <Text style={[s.cardTitle, { color: colors.text }]}>
                    ❌ Cancelaciones del cliente
                  </Text>
                  <Text
                    style={[
                      s.kpiVal,
                      {
                        color:
                          premiumData.cancellationRate < 10
                            ? "#22C55E"
                            : "#EF4444",
                      },
                    ]}
                  >
                    {premiumData.cancellationRate}%
                  </Text>
                  <Text
                    style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}
                  >
                    {premiumData.cancellationRate < 10
                      ? "✅ Tasa baja — buena señal"
                      : "⚠️ Tasa alta — considerá ajustar tu zona"}
                  </Text>
                </Surface>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingBottom: 0,
  },
  tab: { flex: 1, borderRadius: 20 },
  kpiRow: { flexDirection: "row", gap: 10 },
  kpi: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  miniKpi: { flex: 1, alignItems: "center" },
  kpiVal: { fontSize: 22, fontWeight: "bold", color: "#F8FAFC" },
  kpiLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    padding: 16,
    borderRadius: 14,
    gap: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 10 },
  rideRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  paywall: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
  },
  paywallEmoji: { fontSize: 52, marginBottom: 12 },
  paywallTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  paywallDesc: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  paywallFeatures: { width: "100%", gap: 6 },
  paywallFeatureItem: { color: "#CBD5E1", fontSize: 14 },
});
