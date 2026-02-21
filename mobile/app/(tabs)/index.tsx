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

export default function HomeScreen() {
  const { theme, colors, isDark } = useAppTheme();
  const { user, isAuthenticated } = useAuth();
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
          Alert.alert(
            "¡Éxito!",
            "Tu oferta ha sido aceptada. Dirígete al origen.",
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
          Alert.alert("Viaje Confirmado", "El chofer está en camino.");
        },
      });
      events.push({
        name: "ride_completed",
        handler: (ride: any) => {
          setActiveRide(ride);
          setRatingDialogVisible(true);
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
      name: "ride_expired",
      handler: (data: any) => {
        if (pendingRideId && data.rideId === pendingRideId) {
          setPendingRideId(null);
          setElapsedSeconds(0);
          Alert.alert(
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
    Alert.alert("¡Gracias!", "Tu calificación ha sido enviada.");
  };

  const handleRequestRide = async () => {
    if (!origin || !destination) {
      Alert.alert("Error", "Por favor ingresa origen y destino");
      return;
    }

    if (!isConnected) {
      Alert.alert(
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
        setPendingRideId(result.id); // Arrancar el timer
        setElapsedSeconds(0);
        setOrigin("");
        setDestination("");
        setDetalle("");
        Alert.alert(
          "✅ Solicitado",
          "Tu pedido fue enviado. Esperando ofertas de choferes...",
        );
      } else {
        Alert.alert(
          "Error",
          "No se pudo enviar el pedido. Verificá tu conexión.",
        );
      }
    } catch (e) {
      Alert.alert("Error", "Ocurrió un error al enviar el pedido.");
    } finally {
      setIsRequesting(false);
    }
  };

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
            <TextInput
              label="Comentario"
              value={ratingComment}
              onChangeText={setRatingComment}
              mode="outlined"
              style={{ marginTop: 20, backgroundColor: "transparent" }}
              textColor={colors.text}
              activeOutlineColor="#F59E0B"
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
    backgroundColor: "#1E293B", // Slate 800
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  surfaceTitle: {
    color: "#FFFFFF",
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
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },
  offerCard: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  priceTag: {
    color: "#3B82F6", // Azure Blue
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
    backgroundColor: "#1E293B",
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
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  ratingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingDate: {
    fontSize: 10,
    color: "#64748B",
  },
  lockNotice: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.2)",
  },
});
