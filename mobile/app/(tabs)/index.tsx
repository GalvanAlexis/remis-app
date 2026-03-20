import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  StatusBar,
} from "react-native";
import {
  Text,
  Card,
  Chip,
  Button,
  TextInput,
  Switch,
  Divider,
  List,
  Surface,
  Portal,
  Dialog,
} from "react-native-paper";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "expo-router";
import { socketService } from "../../services/socket.service";
import { ridesService } from "../../services/rides.service";
import { useAppTheme } from "../../context/ThemeContext";
import { useSocket } from "../../hooks/useSocket";
import { useToast } from "../../context/ToastContext";
import { RatingStars } from "../../components/RatingStars";

const EXPIRE_SECONDS_GLOBAL = 3600;

const RideTimerDisplay = ({
  createdAt,
  onExpire,
}: {
  createdAt: string | Date;
  onExpire?: () => void;
}) => {
  const { colors } = useAppTheme();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!createdAt) return;
    const startMs = new Date(createdAt).getTime();

    const updateTimer = () => {
      const nowMs = Date.now();
      const currentElapsed = Math.floor((nowMs - startMs) / 1000);
      setElapsed(currentElapsed);
      if (currentElapsed >= EXPIRE_SECONDS_GLOBAL && onExpire) {
        onExpire();
      }
      return currentElapsed;
    };

    const initial = updateTimer();
    if (initial >= EXPIRE_SECONDS_GLOBAL) return; // Ya expirado

    const interval = setInterval(() => {
      const current = updateTimer();
      if (current >= EXPIRE_SECONDS_GLOBAL) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, onExpire]);

  if (elapsed >= EXPIRE_SECONDS_GLOBAL) {
    return (
      <Text style={{ color: colors.error, fontWeight: "bold", fontSize: 13 }}>
        Expirado
      </Text>
    );
  }

  const remaining = Math.max(0, EXPIRE_SECONDS_GLOBAL - elapsed);
  const m = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");

  return (
    <Text style={{ color: colors.secondary, fontWeight: "bold", fontSize: 13 }}>
      ⏱ Faltan {m}:{s}
    </Text>
  );
};

export default function HomeScreen() {
  const { theme, colors, isDark } = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showInfo, showWarning, showError } = useToast();
  const router = useRouter();

  // Navigation / Workflow States
  const [reserveMode, setReserveMode] = useState(!isAuthenticated);

  // Client States
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [detalle, setDetalle] = useState("");
  const [activeRide, setActiveRide] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [pendingRideId, setPendingRideId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const EXPIRE_SECONDS = 60 * 60; // 1 hour
  const [offerSort, setOfferSort] = useState<"price" | "eta">("price");

  // Driver States
  const [isOnline, setIsOnline] = useState(false);
  const [onlyRegisteredClients, setOnlyRegisteredClients] = useState(false);
  const [rideRequests, setRideRequests] = useState<any[]>([]);

  // Dialog State (Offer/Details)
  const [offerDialogVisible, setOfferDialogVisible] = useState(false);
  const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [selectedUserRatings, setSelectedUserRatings] = useState<any[]>([]);
  const [offerForm, setOfferForm] = useState({ price: "", eta: "10" });

  // Rating States
  const [ratingDialogVisible, setRatingDialogVisible] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  // --- Socket Events Logic ---
  const socketEvents = React.useMemo(() => {
    const events: any[] = [];

    if (user?.role === "CHOFER") {
      events.push({
        name: "new_ride_request",
        handler: (ride: any) => {
          if (isOnline) {
            setRideRequests((prev) => [ride, ...prev]);
          }
        },
      });
      events.push({
        name: "offer_accepted",
        handler: (ride: any) => {
          showSuccess(
            "¡Oferta aceptada! 🎉",
            "Dirígete al punto de origen del cliente.",
          );
          setIsOnline(false);
          setActiveRide(ride);
          setRideRequests((prev) => prev.filter((r) => r.id !== ride.id));
        },
      });
    } else {
      events.push({
        name: "new_offer",
        handler: (offer: any) => setOffers((prev) => [...prev, offer]),
      });
      events.push({
        name: "ride_matched",
        handler: (ride: any) => {
          setActiveRide(ride);
          setOffers([]);
          showSuccess("Viaje Confirmado 🚗", "El chofer está en camino.");
        },
      });
      events.push({
        name: "ride_started",
        handler: (ride: any) => {
          setActiveRide(ride);
          showInfo("En camino 🚗", "El chofer ya te recogió. ¡Buen viaje!");
        },
      });
      events.push({
        name: "ride_completed",
        handler: (ride: any) => {
          setActiveRide(ride);
          setRatingDialogVisible(true);
        },
      });
      events.push({
        name: "ride_cancelled",
        handler: () => {
          setActiveRide(null);
          showWarning(
            "Viaje Cancelado",
            "El viaje fue cancelado. Podés pedir otro en cualquier momento.",
          );
        },
      });
      // Chofer en camino (se emite al aceptar la oferta)
      events.push({
        name: "driver_en_camino",
        handler: ({ ride, driverName }: any) => {
          setActiveRide(ride);
          showSuccess(
            "🚗 ¡Tu chofer está en camino!",
            `${driverName} ya va para allá. Prepárate en el punto de encuentro.`,
          );
        },
      });
      // Chofer lleg al lugar
      events.push({
        name: "driver_at_location",
        handler: ({ ride }: any) => {
          setActiveRide(ride);
          showSuccess(
            "📍 ¡Tu remis llegó!",
            "El chofer te está esperando en el punto de encuentro.",
          );
        },
      });
      // Bocina del chofer
      events.push({
        name: "horn_beep",
        handler: ({ driverName }: any) => {
          showInfo(
            "📣 ¡Beep beep!",
            `${driverName} te está avisando. ¡Ya bajá!`,
          );
        },
      });
    }

    events.push({
      name: "ride_completed_global",
      handler: (ride: any) => {
        if (user?.role === "CHOFER" && activeRide?.id === ride.id) {
          setRatingDialogVisible(true);
        }
      },
    });

    events.push({
      name: "ride_cancelled_global",
      handler: (data: any) => {
        if (user?.role === "CHOFER" && activeRide?.id === data.rideId) {
          setActiveRide(null);
          setIsOnline(true);
          showWarning(
            "Viaje Cancelado",
            "El cliente canceló el viaje. Volvíste a estar disponible.",
          );
        }
      },
    });

    events.push({
      name: "ride_expired",
      handler: (data: any) => {
        if (user?.role === "CHOFER") {
          setRideRequests((prev) => prev.filter((r) => r.id !== data.rideId));
        }
        if (pendingRideId && data.rideId === pendingRideId) {
          setPendingRideId(null);
          setElapsedSeconds(0);
          showWarning(
            "⏰ Pedido Expirado",
            "Tu solicitud de remis expiró después de 1 hora sin respuesta.",
          );
        }
      },
    });

    return events;
  }, [user?.role, activeRide?.id, isOnline, pendingRideId]);

  // Se encarga de la conexión, handshake auth y registro de eventos
  const { isConnected } = useSocket(socketEvents);

  // Fetch pending rides on connect/status/filter change
  useEffect(() => {
    if (user?.role === "CHOFER") {
      if (isOnline) {
        // Pequeño retardo (debounce) para asegurar que el DB termine de guardar la preferencia
        // del filtro "onlyRegistered" antes de solicitar la descarga de nuevos viajes pendientes.
        const timeout = setTimeout(() => {
          ridesService
            .getPendingRides()
            .then((data) => setRideRequests(data))
            .catch((e) => console.error("Error fetching pending rides:", e));
        }, 300);
        return () => clearTimeout(timeout);
      } else {
        setRideRequests([]); // Clear out the list so we don't accidentally accept an old request
      }
    }
  }, [user?.role, isOnline, onlyRegisteredClients]);
  // Timer: count elapsed seconds and auto-expire at EXPIRE_SECONDS
  useEffect(() => {
    if (!pendingRideId) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= EXPIRE_SECONDS) {
          clearInterval(interval);
          socketService.emit("expire_ride", { rideId: pendingRideId });
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingRideId]);

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Calcula el rating promedio a partir del array ratingsReceived que llega del backend
  const calcAvgRating = (ratingsReceived?: { score: number }[]) => {
    if (!ratingsReceived || ratingsReceived.length === 0) return null;
    const sum = ratingsReceived.reduce((acc, r) => acc + r.score, 0);
    return (sum / ratingsReceived.length).toFixed(1);
  };

  const sortedOffers = [...offers].sort((a, b) =>
    offerSort === "price"
      ? a.quotedPrice - b.quotedPrice
      : a.estimatedMinutes - b.estimatedMinutes,
  );

  const handleFinishRide = () => {
    socketService.emit("finish_ride", { rideId: activeRide.id });
  };

  const handleRate = () => {
    const toUserId =
      user?.role === "CHOFER"
        ? activeRide.clientId
        : activeRide.selectedOffer?.driverId;

    if (!toUserId) {
      setRatingDialogVisible(false);
      setActiveRide(null);
      return;
    }

    socketService.emit("rate_ride", {
      rideId: activeRide.id,
      fromUserId: user?.id,
      toUserId: toUserId,
      score: ratingScore,
      comment: ratingComment,
    });

    setRatingDialogVisible(false);
    setActiveRide(null);
    setRatingScore(5);
    setRatingComment("");
    showSuccess("¡Gracias! ⭐", "Tu calificación fue enviada correctamente.");
  };

  const handleRequestRide = async () => {
    if (!origin || !destination) {
      showWarning("Campos incompletos", "Por favor ingresá origen y destino.");
      return;
    }

    if (!isConnected) {
      showError(
        "Sin conexión",
        "No hay conexión con el servidor. Intentá de nuevo en unos segundos.",
      );
      return;
    }

    setIsRequesting(true);
    const data = {
      clientId: user?.id || null,
      guestName: !isAuthenticated ? "Invitado" : null,
      guestPhone: !isAuthenticated ? "N/A" : null,
      detalle: detalle,
      originAddress: origin,
      destAddress: destination,
    };

    try {
      const result = await socketService.request("request_ride", data);
      if (result) {
        setPendingRideId(result.id);
        setElapsedSeconds(0);
        setOrigin("");
        setDestination("");
        setDetalle("");
        showSuccess(
          "✅ Solicitado",
          "Tu pedido fue enviado. Esperando ofertas de choferes...",
        );
      } else {
        showError(
          "Error",
          "No se pudo enviar el pedido. Verificá tu conexión.",
        );
      }
    } catch (e) {
      showError("Error", "Ocurrió un error al enviar el pedido.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSendOffer = () => {
    if (!offerForm.price || !offerForm.eta) {
      showWarning(
        "Campos incompletos",
        "Por favor completá precio y tiempo estimado.",
      );
      return;
    }

    socketService.emit("send_offer", {
      rideRequestId: selectedRide.id,
      driverId: user?.id,
      estimatedMinutes: parseInt(offerForm.eta),
      quotedPrice: parseFloat(offerForm.price),
    });

    setOfferDialogVisible(false);
    setOfferForm({ price: "", eta: "10" });
    showSuccess("Oferta Enviada 👌", "Esperando respuesta del cliente.");
  };

  const handleAcceptOffer = (offer: any) => {
    socketService.emit("accept_offer", {
      rideId: offer.rideRequestId,
      offerId: offer.id,
    });
    // Limpiar timer al aceptar oferta
    setPendingRideId(null);
    setElapsedSeconds(0);
  };

  const loadUserRatings = async (targetUserId: string) => {
    if (!targetUserId) return;
    try {
      const socket = socketService.getSocket();
      if (!socket) return;

      socket.emit(
        "get_user_ratings",
        {
          targetUserId,
          requesterRole: user?.role || "CLIENTE",
        },
        (ratings: any) => {
          setSelectedUserRatings(ratings || []);
        },
      );
    } catch (error) {
      console.error("Error loading ratings:", error);
    }
  };

  const handleUpdateStatus = (online: boolean) => {
    setIsOnline(online);
    socketService.emit("update_driver_status", {
      userId: user?.id,
      isOnline: online,
      onlyRegistered: onlyRegisteredClients,
    });
  };

  const handleStartRide = () => {
    socketService.emit("start_ride", { rideId: activeRide.id });
  };

  const handleCancelRide = () => {
    Alert.alert(
      "Cancelar viaje",
      "¿Estás seguro que querés cancelar? El chofer ya fue confirmado.",
      [
        { text: "No, continuar", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: () => {
            socketService.emit("cancel_ride", { rideId: activeRide.id });
            setActiveRide(null);
            setPendingRideId(null);
          },
        },
      ],
    );
  };

  // Card de viaje activo para el CLIENTE — diferencia MATCHED de IN_PROGRESS
  const renderActiveRideCard = () => {
    const isInProgress = activeRide?.status === "IN_PROGRESS";
    const driverName =
      activeRide.selectedOffer?.driver?.profile?.nombre || "Chofer";

    return (
      <Card
        style={[
          styles.mainSurface,
          {
            borderColor: isInProgress ? colors.secondary : colors.primary,
            borderWidth: 2,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Card.Title
          title={isInProgress ? "Viaje en Curso" : "Viaje Confirmado"}
          subtitle={
            isInProgress
              ? `${driverName} te recogió. ¡Buen viaje!`
              : `${driverName} está en camino`
          }
          titleStyle={{ color: colors.text }}
          subtitleStyle={{ color: colors.text, opacity: 0.7 }}
        />
        <Card.Content>
          <Text
            variant="bodyLarge"
            style={{ color: colors.text, fontWeight: "bold" }}
          >
            Vehículo:{" "}
            {activeRide.selectedOffer?.driver?.driverDocs?.vehicleModel ||
              "Transporte Habilitado"}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: colors.text, opacity: 0.7 }}
          >
            Patente:{" "}
            {activeRide.selectedOffer?.driver?.driverDocs?.vehiclePlate ||
              "N/A"}
          </Text>
          <Text
            variant="titleLarge"
            style={[styles.priceTag, { marginTop: 10 }]}
          >
            Precio Total: ${activeRide.selectedOffer?.quotedPrice}
          </Text>

          {/* Botón de Pago si está pendiente */}
          {activeRide?.paymentStatus === 'PENDING' && (
            <Button
              mode="contained"
              onPress={handlePayRide}
              style={{ marginTop: 12, backgroundColor: '#009EE3' }} // Azul Mercado Pago
              textColor="white"
              icon="credit-card"
            >
              Pagar con Mercado Pago
            </Button>
          )}

          {activeRide?.paymentStatus === 'PAID' && (
            <Chip
              icon="check-circle"
              style={{ marginTop: 12, backgroundColor: '#4CAF50' }}
              textStyle={{ color: 'white' }}
            >
              Pagado
            </Chip>
          )}

          {/* Cancelar solo disponible mientras MATCHED y no IN_PROGRESS */}
          {!isInProgress && (
            <Button
              mode="outlined"
              onPress={handleCancelRide}
              style={{ marginTop: 12, borderColor: colors.error }}
              textColor={colors.error}
            >
              Cancelar Viaje
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  const handlePayRide = async () => {
    if (!activeRide?.id) return;

    try {
      const result = await ridesService.createPaymentPreference(activeRide.id);
      if (result.initPoint || result.sandboxInitPoint) {
        const checkoutUrl = result.sandboxInitPoint || result.initPoint;
        router.push({
          pathname: '/payment',
          params: { checkoutUrl, rideId: activeRide.id }
        });
      } else {
        showError("Error", "No se pudo generar el enlace de pago.");
      }
    } catch (error) {
      showError("Error", "Ocurrió un problema al conectar con Mercado Pago.");
      console.error(error);
    }
  };

  const renderClientView = () => (
    <View style={styles.viewContainer}>
      <View style={styles.header}>
        <Text
          variant="headlineSmall"
          style={[styles.welcomeText, { color: colors.text }]}
        >
          Hola, {user?.profile?.nombre || "Cliente"}! 👋
        </Text>
        {!isAuthenticated && (
          <Button
            mode="text"
            onPress={() => router.replace("/(auth)/welcome")}
            labelStyle={{ color: colors.primary }}
          >
            Volver
          </Button>
        )}
      </View>

      {!activeRide ? (
        <>
          <Surface
            style={[styles.mainSurface, { backgroundColor: colors.surface }]}
            elevation={1}
          >
            <Text
              variant="titleMedium"
              style={[styles.surfaceTitle, { color: colors.text }]}
            >
              ¿A dónde vamos?
            </Text>
            <TextInput
              label="Origen"
              value={origin}
              onChangeText={setOrigin}
              mode="outlined"
              style={styles.input}
              textColor={colors.text}
              outlineColor={colors.divider}
              activeOutlineColor={colors.primary}
            />
            <TextInput
              label="Destino"
              value={destination}
              onChangeText={setDestination}
              mode="outlined"
              style={styles.input}
              textColor={colors.text}
              outlineColor={colors.divider}
              activeOutlineColor={colors.primary}
            />
            <TextInput
              label="Detalle Opcional"
              value={detalle}
              onChangeText={setDetalle}
              mode="outlined"
              style={styles.input}
              placeholder="Nº de puerta, indicaciones..."
              textColor={colors.text}
              outlineColor={colors.divider}
              activeOutlineColor={colors.primary}
            />
            <Button
              mode="contained"
              onPress={handleRequestRide}
              style={styles.actionButton}
              buttonColor={isConnected ? colors.primary : colors.divider}
              contentStyle={{ height: 50 }}
              textColor="white"
              disabled={isRequesting || !isConnected}
              loading={isRequesting}
            >
              {isRequesting
                ? "Enviando..."
                : isConnected
                  ? "Pedir Remis Ahora"
                  : "Conectando..."}
            </Button>
          </Surface>

          {offers.length === 0 && pendingRideId && (
            <Surface
              style={[
                styles.mainSurface,
                {
                  backgroundColor: colors.surface,
                  marginTop: 12,
                  alignItems: "center",
                },
              ]}
              elevation={0}
            >
              <Text
                variant="titleMedium"
                style={{
                  color: colors.primary,
                  fontWeight: "bold",
                  marginBottom: 4,
                }}
              >
                ⏱ Esperando choferes...
              </Text>
              <Text
                variant="bodyLarge"
                style={{ color: colors.text, letterSpacing: 2 }}
              >
                {formatElapsed(elapsedSeconds)}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: colors.text, opacity: 0.5, marginTop: 4 }}
              >
                El pedido expira en{" "}
                {formatElapsed(EXPIRE_SECONDS - elapsedSeconds)}
              </Text>
            </Surface>
          )}

          {offers.length > 0 && (
            <>
              {/* Header de ofertas con ordenamiento */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Ofertas ({offers.length})
                </Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Chip
                    selected={offerSort === "price"}
                    onPress={() => setOfferSort("price")}
                    compact
                    style={{
                      backgroundColor:
                        offerSort === "price" ? colors.primary : colors.divider,
                    }}
                    textStyle={{
                      color: offerSort === "price" ? "#fff" : colors.text,
                      fontSize: 11,
                    }}
                  >
                    💰 Precio
                  </Chip>
                  <Chip
                    selected={offerSort === "eta"}
                    onPress={() => setOfferSort("eta")}
                    compact
                    style={{
                      backgroundColor:
                        offerSort === "eta" ? colors.primary : colors.divider,
                    }}
                    textStyle={{
                      color: offerSort === "eta" ? "#fff" : colors.text,
                      fontSize: 11,
                    }}
                  >
                    ⏱ Tiempo
                  </Chip>
                </View>
              </View>
              {sortedOffers.map((offer: any) => {
                const avgRating = calcAvgRating(offer.driver?.ratingsReceived);
                const totalTrips = offer.driver?.ratingsReceived?.length ?? 0;
                return (
                  <Surface
                    key={offer.id}
                    style={styles.offerCard}
                    elevation={0}
                  >
                    <View style={styles.rideHeader}>
                      <View>
                        <Text
                          variant="titleMedium"
                          style={{ color: colors.text }}
                        >
                          {offer.driver?.profile?.nombre || "Chofer Disponible"}
                        </Text>
                        {/* Rating y viajes totales */}
                        <Text
                          variant="labelSmall"
                          style={{ color: colors.placeholder, marginTop: 2 }}
                        >
                          {avgRating
                            ? `⭐ ${avgRating} · ${totalTrips} viaje${totalTrips !== 1 ? "s" : ""}`
                            : "Sin calificaciones aún"}
                        </Text>
                      </View>
                      <Text variant="titleLarge" style={styles.priceTag}>
                        ${offer.quotedPrice}
                      </Text>
                    </View>
                    <Text variant="bodyMedium" style={{ color: colors.placeholder }}>
                      Llega en {offer.estimatedMinutes} mins
                    </Text>
                    <View style={styles.offerActions}>
                      <Button
                        mode="text"
                        onPress={() => {
                          setSelectedOffer(offer);
                          setSelectedRide(null);
                          setDetailsDialogVisible(true);
                          loadUserRatings(offer.driverId);
                        }}
                        labelStyle={{ color: colors.placeholder }}
                      >
                        DETALLES
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => handleAcceptOffer(offer)}
                        buttonColor={colors.primary}
                        textColor="white"
                      >
                        ACEPTAR
                      </Button>
                    </View>
                  </Surface>
                );
              })}
            </>
          )}
        </>
      ) : (
        renderActiveRideCard()
      )}
    </View>
  );

  const renderDriverView = () => (
    <View style={styles.viewContainer}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.welcomeText}>
            Modo Chofer
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              color: isOnline ? colors.secondary : colors.error,
              fontWeight: "bold",
            }}
          >
            {isOnline ? "• EN LÍNEA" : "• FUERA DE SERVICIO"}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleUpdateStatus}
          color={colors.primary}
        />
      </View>

      <Surface style={[styles.driverControls, { backgroundColor: colors.surface }]} elevation={0}>
        <View style={styles.switchRow}>
          <Text variant="bodyMedium" style={{ color: colors.text }}>
            Solo clientes registrados
          </Text>
          <Switch
            value={onlyRegisteredClients}
            onValueChange={(val) => {
              setOnlyRegisteredClients(val);
              socketService.emit("update_driver_status", {
                userId: user?.id,
                isOnline,
                onlyRegistered: val,
              });
            }}
            color={colors.primary}
          />
        </View>
      </Surface>

      {activeRide ? (
        <Surface
          style={[
            styles.mainSurface,
            {
              borderLeftWidth: 5,
              borderLeftColor: colors.primary,
              backgroundColor: colors.surface,
            },
          ]}
          elevation={1}
        >
          <Text variant="titleMedium" style={styles.surfaceTitle}>
            Viaje Activo
          </Text>
          <Text
            variant="labelSmall"
            style={{
              color:
                activeRide?.status === "IN_PROGRESS"
                  ? colors.secondary
                  : activeRide?.status === "AT_LOCATION"
                    ? "#F59E0B"
                    : colors.primary,
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            {activeRide?.status === "IN_PROGRESS"
              ? "● EN TRAYECTO"
              : activeRide?.status === "AT_LOCATION"
                ? "● EN EL LUGAR"
                : "● EN CAMINO"}
          </Text>
          <Text variant="bodyLarge" style={{ color: "#FFFFFF" }}>
            Cliente:{" "}
            {activeRide.client?.profile?.nombre ||
              activeRide.guestName ||
              "Invitado"}
          </Text>
          <Text variant="bodyMedium" style={{ color: "#94A3B8", marginTop: 5 }}>
            Origen: {activeRide.originAddress}
          </Text>
          <Text variant="bodyMedium" style={{ color: "#94A3B8" }}>
            Destino: {activeRide.destAddress}
          </Text>
          {activeRide.detalle && (
            <Text
              variant="bodySmall"
              style={{ color: "#64748B", marginTop: 5 }}
            >
              Info: {activeRide.detalle}
            </Text>
          )}
          {/* Botones adaptativos según estado del viaje */}
          {activeRide?.status === "IN_PROGRESS" ? (
            // En trayecto: solo finalizar
            <Button
              mode="contained"
              style={{ marginTop: 20 }}
              onPress={handleFinishRide}
              buttonColor={colors.secondary}
              contentStyle={{ height: 50 }}
              textColor="white"
            >
              FINALIZAR VIAJE
            </Button>
          ) : activeRide?.status === "AT_LOCATION" ? (
            // En el lugar: bocina + iniciar viaje
            <View style={{ gap: 10, marginTop: 20 }}>
              <Button
                mode="outlined"
                onPress={() => {
                  socketService.emit("horn_beep", {
                    rideId: activeRide?.id,
                  });
                }}
                style={{ borderColor: colors.secondary }}
                textColor={colors.secondary}
                icon="bullhorn"
                contentStyle={{ height: 44 }}
              >
                🔔 BOCINA
              </Button>
              <Button
                mode="contained"
                onPress={handleStartRide}
                buttonColor={colors.primary}
                contentStyle={{ height: 50 }}
                textColor="white"
              >
                INICIAR VIAJE
              </Button>
            </View>
          ) : (
            // En camino (MATCHED): llegué + bocina
            <View style={{ gap: 10, marginTop: 20 }}>
              <Button
                mode="outlined"
                onPress={() => {
                  socketService.emit("horn_beep", {
                    rideId: activeRide?.id,
                  });
                }}
                style={{ borderColor: colors.divider }}
                textColor={colors.placeholder}
                icon="bullhorn"
                contentStyle={{ height: 44 }}
              >
                🔔 BOCINA
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  socketService.emit("driver_arrived", {
                    rideId: activeRide?.id,
                  });
                }}
                buttonColor="#F59E0B"
                contentStyle={{ height: 50 }}
                textColor="white"
                icon="map-marker-check"
              >
                LLEGUÉ AL PUNTO
              </Button>
            </View>
          )}
        </Surface>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {rideRequests.length === 0 && isOnline && (
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Text style={{ color: "#64748B" }}>Esperando solicitudes...</Text>
            </View>
          )}
          {!isOnline && (
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Text style={{ color: "#64748B" }}>
                Ponte en línea para recibir viajes
              </Text>
            </View>
          )}
          {rideRequests.map((req: any) => (
            <Surface key={req.id} style={styles.offerCard} elevation={0}>
              <View style={styles.rideHeader}>
                <Chip
                  icon="account"
                  style={{ backgroundColor: colors.divider }}
                  textStyle={{ color: colors.text }}
                >
                  {req.client?.profile?.nombre || req.guestName || "Invitado"}
                </Chip>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    variant="titleSmall"
                    style={{
                      color: colors.secondary,
                      fontWeight: "bold",
                      marginBottom: 4,
                    }}
                  >
                    NUEVO
                  </Text>
                  {req.createdAt && (
                    <RideTimerDisplay
                      createdAt={req.createdAt}
                      onExpire={() =>
                        setRideRequests((prev) =>
                          prev.filter((r) => r.id !== req.id),
                        )
                      }
                    />
                  )}
                </View>
              </View>
              <List.Item
                title={req.originAddress}
                titleStyle={{ color: colors.text }}
                description="Origen"
                descriptionStyle={{ color: colors.placeholder }}
                left={(p) => (
                  <List.Icon {...p} icon="map-marker" color={colors.primary} />
                )}
              />
              <List.Item
                title={req.destAddress}
                titleStyle={{ color: colors.text }}
                description="Destino"
                descriptionStyle={{ color: colors.placeholder }}
                left={(p) => <List.Icon {...p} icon="flag" color={colors.error} />}
              />
              <View style={styles.offerActions}>
                <Button
                  mode="text"
                  onPress={() => {
                    setSelectedRide(req);
                    setSelectedOffer(null);
                    setDetailsDialogVisible(true);
                    if (req.clientId) loadUserRatings(req.clientId);
                  }}
                  labelStyle={{ color: colors.placeholder }}
                >
                  DETALLES
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setSelectedRide(req);
                    setOfferDialogVisible(true);
                  }}
                  buttonColor={colors.primary}
                  textColor="white"
                >
                  RESPONDER
                </Button>
              </View>
            </Surface>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isAuthenticated || user?.role === "CLIENTE"
          ? renderClientView()
          : renderDriverView()}
      </ScrollView>

      {/* MODALS / PORTALS */}
      <Portal>
        {/* Offer Form Dialog */}
        <Dialog
          visible={offerDialogVisible}
          onDismiss={() => setOfferDialogVisible(false)}
          style={{ backgroundColor: colors.surface }}
        >
          <Dialog.Title style={{ color: colors.text }}>
            Enviar Oferta
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Precio ($)"
              value={offerForm.price}
              onChangeText={(t) => setOfferForm({ ...offerForm, price: t })}
              keyboardType="numeric"
              mode="outlined"
              style={{ backgroundColor: "transparent", marginBottom: 10 }}
              textColor={colors.text}
              activeOutlineColor={colors.primary}
              outlineColor={colors.divider}
            />
            <TextInput
              label="ETA (mins)"
              value={offerForm.eta}
              onChangeText={(t) => setOfferForm({ ...offerForm, eta: t })}
              keyboardType="numeric"
              mode="outlined"
              style={{ backgroundColor: "transparent" }}
              textColor={colors.text}
              activeOutlineColor={colors.primary}
              outlineColor={colors.divider}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setOfferDialogVisible(false)}
              textColor={colors.text}
            >
              Cerrar
            </Button>
            <Button onPress={handleSendOffer} textColor={colors.primary}>
              ENVIAR
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Details Dialog */}
        <Dialog
          visible={detailsDialogVisible}
          onDismiss={() => setDetailsDialogVisible(false)}
          style={{ backgroundColor: colors.surface }}
        >
          <Dialog.Title style={{ color: colors.text }}>
            {selectedOffer ? "Detalles del Chofer" : "Detalles del Pasajero"}
          </Dialog.Title>
          <Dialog.Content>
            {selectedOffer ? (
              <ScrollView style={{ maxHeight: 300 }}>
                <Text variant="titleMedium" style={{ color: colors.primary }}>
                  Vehículo:
                </Text>
                <Text variant="bodyLarge" style={{ color: colors.text }}>
                  {selectedOffer.driver?.driverDocs?.vehicleModel ||
                    "Vehículo Habilitado"}{" "}
                  ({selectedOffer.driver?.driverDocs?.vehicleColor || "Gris"})
                </Text>

                {isAuthenticated ? (
                  <>
                    <Text
                      variant="bodyMedium"
                      style={{ color: colors.text, opacity: 0.7 }}
                    >
                      Patente:{" "}
                      {selectedOffer.driver?.driverDocs?.vehiclePlate || "N/A"}
                    </Text>
                    <Divider
                      style={{
                        marginVertical: 15,
                        backgroundColor: colors.divider,
                      }}
                    />
                    <Text
                      variant="titleMedium"
                      style={{ color: colors.primary }}
                    >
                      Datos del Chofer:
                    </Text>
                    <Text variant="bodyLarge" style={{ color: colors.text }}>
                      Nombre: {selectedOffer.driver?.profile?.nombre}{" "}
                      {selectedOffer.driver?.profile?.apellido}
                    </Text>
                  </>
                ) : (
                  <Surface style={[styles.lockNotice, { backgroundColor: colors.surface, borderColor: colors.divider, borderWidth: 1 }]} elevation={0}>
                    <Text style={{ color: colors.placeholder }}>
                      🔒 Regístrate para ver contacto, patente y datos
                      completos.
                    </Text>
                  </Surface>
                )}

                <Divider
                  style={{
                    marginVertical: 15,
                    backgroundColor: colors.divider,
                  }}
                />
                <Text variant="titleMedium" style={{ color: colors.primary }}>
                  Reviews:
                </Text>
                {selectedUserRatings.length > 0 ? (
                  selectedUserRatings.map((rating: any) => (
                    <View key={rating.id} style={styles.ratingItem}>
                      <View style={styles.ratingHeader}>
                        <RatingStars
                          rating={rating.score}
                          size={16}
                          disabled
                        />
                        <Text style={styles.ratingDate}>
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text
                        variant="bodySmall"
                        style={{
                          fontStyle: "italic",
                          color: colors.text,
                          opacity: 0.7,
                        }}
                      >
                        "{rating.comment || "Sin comentario"}"
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text variant="bodySmall" style={{ color: colors.placeholder }}>
                    Sin reseñas aún.
                  </Text>
                )}
              </ScrollView>
            ) : selectedRide ? (
              <ScrollView style={{ maxHeight: 300 }}>
                <Text variant="titleMedium" style={{ color: colors.primary }}>
                  Pasajero:
                </Text>
                <Text variant="bodyLarge" style={{ color: colors.text }}>
                  {selectedRide.client?.profile?.nombre ||
                    selectedRide.guestName ||
                    "Invitado"}
                </Text>
                <Divider
                  style={{
                    marginVertical: 15,
                    backgroundColor: colors.divider,
                  }}
                />
                <Text variant="titleMedium" style={{ color: colors.primary }}>
                  Reputación:
                </Text>
                {selectedUserRatings.length > 0 ? (
                  selectedUserRatings.map((rating: any) => (
                    <View key={rating.id} style={styles.ratingItem}>
                      <View style={styles.ratingHeader}>
                        <RatingStars
                          rating={rating.score}
                          size={16}
                          disabled
                        />
                        <Text style={styles.ratingDate}>
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={{ color: "#94A3B8" }}>
                        "{rating.comment}"
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text variant="bodySmall" style={{ color: colors.placeholder }}>
                    Sin calificaciones.
                  </Text>
                )}
              </ScrollView>
            ) : (
              <Text style={{ color: "#FFFFFF" }}>Cargando...</Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDetailsDialogVisible(false)}
              textColor={colors.primary}
            >
              Cerrar
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Rating Dialog */}
        <Dialog
          visible={ratingDialogVisible}
          onDismiss={() => setRatingDialogVisible(false)}
          style={{ backgroundColor: colors.surface }}
        >
          <Dialog.Title style={{ color: colors.text }}>
            Calificar Viaje
          </Dialog.Title>
          <Dialog.Content>
            <Text
              variant="bodyMedium"
              style={{
                textAlign: "center",
                color: colors.text,
                marginBottom: 20,
                opacity: 0.8,
              }}
            >
              ¿Cómo fue tu experiencia en este viaje?
            </Text>
            <RatingStars
              rating={ratingScore}
              onRatingChange={setRatingScore}
              size={40}
            />
            <TextInput
              label="Comentario"
              value={ratingComment}
              onChangeText={setRatingComment}
              mode="outlined"
              style={{ marginTop: 20, backgroundColor: "transparent" }}
              textColor={colors.text}
              activeOutlineColor={colors.primary}
              outlineColor={colors.divider}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleRate} textColor={colors.primary}>
              ENVIAR
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  viewContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    marginTop: Platform.OS === "ios" ? 40 : 20,
  },
  welcomeText: {
    fontWeight: "bold",
  },
  mainSurface: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
    borderWidth: 1,
  },
  surfaceTitle: {
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
    backgroundColor: "transparent",
  },
  actionButton: {
    marginTop: 10,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },
  offerCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  priceTag: {
    fontWeight: "bold",
    fontSize: 20,
  },
  offerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  driverControls: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  ratingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  ratingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingDate: {
    fontSize: 10,
  },
  lockNotice: {
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
});
