# 📱 REMIS APP - Frontend Specifications

## App Structure (Expo Router)

```
app/
├── _layout.tsx                 # Root layout
├── (auth)/
│   ├── _layout.tsx            # Auth stack layout
│   ├── login.tsx              # Login screen
│   ├── register-choice.tsx    # Choose client/driver registration
│   ├── register-client.tsx    # Client registration form
│   └── register-driver.tsx    # Driver registration with documents
├── (tabs)/
│   ├── _layout.tsx            # Bottom tabs layout
│   ├── (client)/
│   │   ├── index.tsx          # Client home (request ride)
│   │   ├── offers.tsx         # View offers
│   │   └── ride-active.tsx    # Active ride tracking
│   ├── (driver)/
│   │   ├── index.tsx          # Driver dashboard
│   │   └── ride-active.tsx    # Active ride management
│   ├── history.tsx            # Ride history (shared)
│   └── profile.tsx            # User profile (shared)
└── modals/
    ├── rating.tsx             # Rating modal
    └── offer-create.tsx       # Driver creates offer
```

---

## Screen Specifications

### 1. Login Screen (`(auth)/login.tsx`)

**Components:**

- Email input
- Password input (secure)
- "Iniciar Sesión" button
- "Registrarse" link
- "Continuar como invitado" button (clients only)

**State Management:**

```typescript
// Zustand store
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}
```

**Validations:**

- Email format validation
- Password minimum 8 characters
- Loading state while authenticating
- Error messages

**Navigation:**

- On success → redirect to role-based home (client/driver)
- "Registrarse" → navigate to register-choice
- "Continuar como invitado" → navigate to (client)/index

---

### 2. Register Client (`(auth)/register-client.tsx`)

**Form Fields:**

- Nombre (required)
- Apellido (required)
- DNI (required, unique)
- Email (required, unique)
- Teléfono (required)
- Dirección (optional)
- Contraseña (required, min 8 chars)
- Confirmar contraseña

**Components:**

- TextInput components with validation
- Phone input with country code
- Password strength indicator
- "Crear cuenta" button

**Validation:**

- Real-time validation on blur
- DNI format (8 digits)
- Email uniqueness check
- Password match confirmation

---

### 3. Register Driver (`(auth)/register-driver.tsx`)

**Form Sections:**

**Sección 1: Datos Personales** (igual que cliente)

**Sección 2: Documentos**

- Upload DNI frente y dorso
- Upload Licencia de conducir
- Upload Cédula verde/azul
- Upload Habilitaciones de transporte

**Sección 3: Datos del Vehículo**

- Marca del vehículo
- Modelo del vehículo
- Patente (unique)
- Cantidad máxima de pasajeros (1-8)
- Foto del vehículo

**Components:**

- Multi-step form (Stepper)
- Image picker for documents
- Preview de imágenes seleccionadas
- Progress indicator

**State:**

```typescript
const [step, setStep] = useState(1); // 1-3
const [formData, setFormData] = useState({
  personal: { ... },
  documents: { ... },
  vehicle: { ... }
});
```

**Validation:**

- Each image max 5MB
- Supported formats: JPG, PNG
- All documents required
- Plate format validation

---

### 4. Client Home (`(tabs)/(client)/index.tsx`)

**Layout:**

```
┌──────────────────────────────┐
│      [Map View - Full]       │
│   - Current location pin     │
│   - Origin/destination pins  │
│                              │
└──────────────────────────────┘
┌──────────────────────────────┐
│  📍 Origen:                  │
│  [Input: Calle y Número]     │
│  📍 Destino:                 │
│  [Input: Calle y Número]     │
│  [Buscar Choferes] Button    │
└──────────────────────────────┘
```

**Features:**

- Interactive map (react-native-maps)
- Tap on map to set origin/destination
- Address autocomplete (optional: Google Places API)
- Current location button
- "Buscar Choferes" triggers ride request

**State:**

```typescript
const [origin, setOrigin] = useState({ address, lat, lng });
const [destination, setDestination] = useState({ address, lat, lng });
const [isSearching, setIsSearching] = useState(false);
```

**On Submit:**

```typescript
const handleSearchDrivers = async () => {
  const { data } = await createRideRequest({ origin, destination });
  navigation.navigate("offers", { rideId: data.rideId });
};
```

---

### 5. Offers Screen (`(tabs)/(client)/offers.tsx`)

**Layout:**

```
┌──────────────────────────────┐
│  Ofertas disponibles (3)     │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ [Avatar] Carlos G.     │  │
│  │ ⭐ 4.8 (120 viajes)     │  │
│  │ 🕐 5 minutos           │  │
│  │ 💵 $450                │  │
│  │        [Aceptar]       │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ [Avatar] María L.      │  │
│  │ ⭐ 4.9 (85 viajes)      │  │
│  │ 🕐 8 minutos           │  │
│  │ 💵 $420                │  │
│  │        [Aceptar]       │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

**Components:**

- OfferCard (reusable component)
- Sort/Filter options (precio, tiempo, rating)
- Loading skeleton while waiting for offers
- Empty state "Esperando ofertas..."

**Real-time Updates:**

```typescript
const socket = useSocket();

useEffect(() => {
  socket.on("new_offer", (payload) => {
    queryClient.invalidateQueries(["offers", rideId]);
    // Show toast notification
  });

  return () => socket.off("new_offer");
}, [rideId]);
```

**OfferCard Component:**

```typescript
interface OfferCardProps {
  offer: {
    id: string;
    driver: {
      nombre: string;
      apellido: string;
      avatarUrl: string;
      rating: number;
      totalRides: number;
    };
    estimatedArrivalMinutes: number;
    quotedPrice: number;
  };
  onAccept: (offerId: string) => void;
  isClientRegistered: boolean; // Show more info if true
}
```

---

### 6. Driver Dashboard (`(tabs)/(driver)/index.tsx`)

**Layout:**

```
┌──────────────────────────────┐
│  Estado: [ON/OFF Toggle]     │
│  Acepto: [Solo reg / Todos]  │
├──────────────────────────────┤
│  Solicitudes (2)             │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ 📍 Av. Corrientes 123  │  │
│  │ 📍 Av. Santa Fe 456    │  │
│  │ 📏 2.5 km              │  │
│  │ 👤 Juan P. ✓ Reg       │  │
│  │        [Ofertar]       │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

**Components:**

- Online/Offline switch (large, prominent)
- Client preference switch
- RideRequestCard list
- Empty state "No hay solicitudes"

**State:**

```typescript
const [isOnline, setIsOnline] = useState(false);
const [acceptingUnregistered, setAcceptingUnregistered] = useState(true);
```

**Location Tracking:**

```typescript
useEffect(() => {
  if (!isOnline) return;

  const subscription = Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 30000, // 30 seconds
      distanceInterval: 50, // 50 meters
    },
    (location) => {
      updateDriverLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    },
  );

  return () => subscription.then((sub) => sub.remove());
}, [isOnline]);
```

**WebSocket Listener:**

```typescript
useEffect(() => {
  if (!isOnline) return;

  socket.emit("join_driver_room");
  socket.on("new_ride_request", (payload) => {
    // Show push notification
    sendPushNotification({
      title: "Nueva solicitud de viaje",
      body: `${payload.origin} → ${payload.destination}`,
    });

    // Add to local state
    setRideRequests((prev) => [...prev, payload]);
  });

  return () => {
    socket.off("new_ride_request");
    socket.emit("leave_driver_room");
  };
}, [isOnline]);
```

---

### 7. Offer Create Modal (`modals/offer-create.tsx`)

**Modal Trigger:**

- Tap on "Ofertar" in RideRequestCard

**Form:**

```
┌──────────────────────────────┐
│  Crear Oferta                │
├──────────────────────────────┤
│  Origen: Av. Corrientes 123  │
│  Destino: Av. Santa Fe 456   │
│  Distancia: 2.5 km           │
├──────────────────────────────┤
│  Tiempo de llegada (min):    │
│  [Input numérico: 5]         │
│                              │
│  Precio del viaje ($):       │
│  [Input numérico: 450]       │
│                              │
│  [Cancelar]     [Enviar]     │
└──────────────────────────────┘
```

**Validation:**

- Tiempo mínimo: 1 min, máximo: 60 min
- Precio mínimo: $100, máximo: $10000
- Inputs numéricos con keyboard type="numeric"

**On Submit:**

```typescript
const handleSubmit = async () => {
  await createOffer({
    rideId,
    estimatedArrivalMinutes: time,
    quotedPrice: price,
  });

  navigation.goBack();
  showToast("Oferta enviada");
};
```

---

### 8. Active Ride Screen (Shared)

**Driver View:**

```
┌──────────────────────────────┐
│      [Map with route]        │
│   - Driver pin (current)     │
│   - Origin pin               │
│   - Destination pin          │
└──────────────────────────────┘
┌──────────────────────────────┐
│  Estado: MATCHED             │
│  Cliente: Juan Pérez         │
│  📞 +541112345678            │
├──────────────────────────────┤
│  📍 Recoger en:              │
│     Av. Corrientes 123       │
│  📍 Destino:                 │
│     Av. Santa Fe 456         │
│  💵 Precio: $450             │
├──────────────────────────────┤
│  [Iniciar Viaje]             │
│  (o [Finalizar Viaje])       │
└──────────────────────────────┘
```

**Client View:**

```
┌──────────────────────────────┐
│      [Map tracking driver]   │
│   - Driver pin (realtime)    │
│   - My location              │
└──────────────────────────────┘
┌──────────────────────────────┐
│  Tu chofer: Carlos González  │
│  ⭐ 4.8 (120 viajes)          │
│  🚗 Ford Focus - ABC123      │
│  📞 +541198765432            │
├──────────────────────────────┤
│  ETA: 5 minutos              │
│  Estado: En camino           │
├──────────────────────────────┤
│  [Contactar Chofer]          │
│  [Cancelar Viaje]            │
└──────────────────────────────┘
```

**Real-time Location Updates:**

```typescript
useEffect(() => {
  socket.on("driver_location_update", ({ lat, lng }) => {
    setDriverPosition({ latitude: lat, longitude: lng });
  });

  socket.on("ride_status_changed", ({ newStatus }) => {
    setRideStatus(newStatus);

    if (newStatus === "COMPLETED") {
      navigation.navigate("modals/rating", { rideId });
    }
  });

  return () => {
    socket.off("driver_location_update");
    socket.off("ride_status_changed");
  };
}, [rideId]);
```

---

### 9. Rating Modal (`modals/rating.tsx`)

**Layout:**

```
┌──────────────────────────────┐
│  Calificar a Carlos          │
├──────────────────────────────┤
│       ⭐⭐⭐⭐⭐               │
│   (tappable stars 1-5)       │
├──────────────────────────────┤
│  Comentario (opcional):      │
│  [TextArea]                  │
│                              │
├──────────────────────────────┤
│  [Omitir]        [Enviar]    │
└──────────────────────────────┘
```

**Components:**

- StarRating component (reusable)
- TextInput multiline
- Buttons

**Validation:**

- Score required (1-5)
- Comment optional, max 500 chars

**On Submit:**

```typescript
const handleSubmit = async () => {
  await createRating({
    rideId,
    toUserId: otherUserId,
    score,
    comment,
  });

  navigation.navigate("history");
  showToast("Gracias por tu calificación");
};
```

---

### 10. History Screen (`(tabs)/history.tsx`)

**Layout:**

```
┌──────────────────────────────┐
│  Historial de viajes         │
│  [Filter: Todos ▼]           │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ 10 Feb 2026 - 14:30   │  │
│  │ Av. Corrientes 123     │  │
│  │ → Av. Santa Fe 456     │  │
│  │ Carlos G. - $450       │  │
│  │ ⭐⭐⭐⭐⭐              │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 08 Feb 2026 - 09:15   │  │
│  │ ...                    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

**Features:**

- Infinite scroll pagination (TanStack Query)
- Filter by status (all, completed, cancelled)
- Pull to refresh
- Tap on ride → navigate to ride details (read-only)

**Query:**

```typescript
const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
  queryKey: ["ride-history"],
  queryFn: ({ pageParam = 1 }) => getRideHistory({ page: pageParam }),
  getNextPageParam: (lastPage) =>
    lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
});
```

---

### 11. Profile Screen (`(tabs)/profile.tsx`)

**Layout:**

```
┌──────────────────────────────┐
│       [Avatar]               │
│     Carlos González          │
│  ⭐ 4.8 (120 viajes)          │
├──────────────────────────────┤
│  DNI: 12345678               │
│  Email: carlos@mail.com      │
│  Tel: +541112345678          │
│                              │
│  [Editar Perfil]             │
├──────────────────────────────┤
│  Vehículo (solo chofer):     │
│  Ford Focus - ABC123         │
│  Max pasajeros: 4            │
│  Estado verificación: ✅     │
│                              │
│  [Ver estadísticas]          │
├──────────────────────────────┤
│  [Cerrar Sesión]             │
└──────────────────────────────┘
```

**Stats Section (driver only):**

- Total viajes completados
- Rating promedio
- Ingresos totales
- Viajes hoy/semana/mes

---

## Component Library

### Reusable Components

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: "primary" | "secondary" | "outline" | "danger";
  isLoading?: boolean;
  disabled?: boolean;
}

// components/ui/Card.tsx
interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  elevation?: number;
}

// components/ui/Input.tsx
interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
}

// components/ui/StarRating.tsx
interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  disabled?: boolean;
}

// components/MapView.tsx
interface MapViewProps {
  origin?: { latitude: number; longitude: number };
  destination?: { latitude: number; longitude: number };
  driverLocation?: { latitude: number; longitude: number };
  onOriginChange?: (coords) => void;
  onDestinationChange?: (coords) => void;
}
```

---

## Hooks

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    login: store.login,
    logout: store.logout,
  };
};

// hooks/useSocket.ts
export const useSocket = () => {
  const socket = useRef<Socket | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    if (accessToken) {
      socket.current = io(API_URL, {
        auth: { token: accessToken }
      });
    }

    return () => socket.current?.disconnect();
  }, [accessToken]);

  return socket.current;
};

// hooks/useLocation.ts
export const useLocation = (enabled: boolean) => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    const watch = Location.watchPositionAsync({ ... }, setLocation);
    return () => watch.then(w => w.remove());
  }, [enabled]);

  return location;
};
```

---

## Design Tokens

```typescript
// constants/theme.ts
export const colors = {
  primary: "#2563EB", // Blue
  secondary: "#10B981", // Green
  danger: "#EF4444", // Red
  warning: "#F59E0B", // Amber
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    // ...
    900: "#111827",
  },
  text: {
    primary: "#1F2937",
    secondary: "#6B7280",
    disabled: "#9CA3AF",
  },
  background: "#FFFFFF",
  surface: "#F9FAFB",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: "bold" },
  h2: { fontSize: 24, fontWeight: "bold" },
  h3: { fontSize: 20, fontWeight: "600" },
  body: { fontSize: 16 },
  caption: { fontSize: 14, color: colors.text.secondary },
};
```
