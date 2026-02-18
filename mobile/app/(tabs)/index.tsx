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
        handler: (ride: any) => setRideRequests((prev) => [ride, ...prev]),
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

    return events;
  }, [user?.role, activeRide?.id]);

  // Se encarga de la conexión, handshake auth y registro de eventos
  const { isConnected } = useSocket(socketEvents);

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

  const handleSendOffer = () => {
    if (!offerForm.price || !offerForm.eta) {
      Alert.alert("Error", "Completa precio y tiempo");
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
    Alert.alert("Oferta Enviada", "Esperando respuesta del cliente.");
  };

  const handleAcceptOffer = (offer: any) => {
    socketService.emit("accept_offer", {
      rideId: offer.rideRequestId,
      offerId: offer.id,
    });
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

  const renderActiveRideCard = () => (
    <Card
      style={[
        styles.mainSurface,
        {
          borderColor: colors.primary,
          borderWidth: 2,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <Card.Title
        title="Viaje Confirmado"
        subtitle="El chofer está en camino"
        titleStyle={{ color: colors.text }}
        subtitleStyle={{ color: colors.text, opacity: 0.7 }}
      />
      <Card.Content>
        <Text
          variant="bodyLarge"
          style={{ color: colors.text, fontWeight: "bold" }}
        >
          Vehículo:{" "}
          {activeRide.selectedOffer?.driver?.driverDocument?.vehicleModel ||
            "Transporte Habilitado"}
        </Text>
        <Text variant="bodyMedium" style={{ color: colors.text, opacity: 0.7 }}>
          Patente:{" "}
          {activeRide.selectedOffer?.driver?.driverDocument?.vehiclePlate ||
            "N/A"}
        </Text>
        <Text variant="titleLarge" style={[styles.priceTag, { marginTop: 10 }]}>
          Precio Total: ${activeRide.selectedOffer?.quotedPrice}
        </Text>
      </Card.Content>
    </Card>
  );

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
            labelStyle={{ color: "#3B82F6" }}
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

          {offers.length > 0 && (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Ofertas Cercanas ({offers.length})
              </Text>
              {offers.map((offer: any) => (
                <Surface key={offer.id} style={styles.offerCard} elevation={0}>
                  <View style={styles.rideHeader}>
                    <Text variant="titleMedium" style={{ color: "#FFFFFF" }}>
                      {offer.driver?.profile?.nombre || "Chofer Disponible"}
                    </Text>
                    <Text variant="titleLarge" style={styles.priceTag}>
                      ${offer.quotedPrice}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={{ color: "#94A3B8" }}>
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
                      labelStyle={{ color: "#94A3B8" }}
                    >
                      DETALLES
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => handleAcceptOffer(offer)}
                      buttonColor="#2563EB"
                    >
                      ACEPTAR
                    </Button>
                  </View>
                </Surface>
              ))}
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
              color: isOnline ? colors.secondary : "#EF4444",
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

      <Surface style={styles.driverControls} elevation={0}>
        <View style={styles.switchRow}>
          <Text variant="bodyMedium" style={{ color: "#FFFFFF" }}>
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
                <Text
                  variant="titleSmall"
                  style={{ color: colors.secondary, fontWeight: "bold" }}
                >
                  NUEVO
                </Text>
              </View>
              <List.Item
                title={req.originAddress}
                titleStyle={{ color: "#FFFFFF" }}
                description="Origen"
                descriptionStyle={{ color: "#94A3B8" }}
                left={(p) => (
                  <List.Icon {...p} icon="map-marker" color={colors.primary} />
                )}
              />
              <List.Item
                title={req.destAddress}
                titleStyle={{ color: "#FFFFFF" }}
                description="Destino"
                descriptionStyle={{ color: "#94A3B8" }}
                left={(p) => <List.Icon {...p} icon="flag" color="#EF4444" />}
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
                  labelStyle={{ color: "#94A3B8" }}
                >
                  DETALLES
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setSelectedRide(req);
                    setOfferDialogVisible(true);
                  }}
                  buttonColor="#2563EB"
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
                  {selectedOffer.driver?.driverDocument?.vehicleModel ||
                    "Vehículo Habilitado"}{" "}
                  (
                  {selectedOffer.driver?.driverDocument?.vehicleColor || "Gris"}
                  )
                </Text>

                {isAuthenticated ? (
                  <>
                    <Text
                      variant="bodyMedium"
                      style={{ color: colors.text, opacity: 0.7 }}
                    >
                      Patente:{" "}
                      {selectedOffer.driver?.driverDocument?.vehiclePlate ||
                        "N/A"}
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
                    <Text
                      variant="bodyMedium"
                      style={{ color: colors.text, opacity: 0.7 }}
                    >
                      Tel: {selectedOffer.driver?.profile?.phone || "N/A"}
                    </Text>
                  </>
                ) : (
                  <Surface style={styles.lockNotice} elevation={0}>
                    <Text style={{ color: "#94A3B8" }}>
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
                        <Text style={{ fontWeight: "bold", color: "#F59E0B" }}>
                          {rating.score} ★
                        </Text>
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
                  <Text variant="bodySmall" style={{ color: "#64748B" }}>
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
                        <Text style={{ fontWeight: "bold", color: "#F59E0B" }}>
                          {rating.score} ★
                        </Text>
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
                  <Text variant="bodySmall" style={{ color: "#64748B" }}>
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
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Button
                  key={s}
                  mode={ratingScore === s ? "contained" : "outlined"}
                  onPress={() => setRatingScore(s)}
                  compact
                  buttonColor={ratingScore === s ? "#F59E0B" : "transparent"}
                  textColor={ratingScore === s ? "#000000" : "#F59E0B"}
                  style={{ borderColor: "#F59E0B" }}
                >
                  {s}★
                </Button>
              ))}
            </View>
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
