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

### 3. Register Driver (`(auth)/register-chofer.tsx`)

> **Nota:** El archivo real es `register-chofer.tsx`, no `register-driver.tsx`.

**Form Sections:**

**Sección 1: Datos Personales**

- Nombre de usuario (único, 3-30 chars alfanuméricos)
- Contraseña (mínimo 8 caracteres)
- Nombre y Apellido
- DNI (7-8 dígitos, único en BD)
- Foto de perfil (obligatoria, desde cámara o galería)

**Sección 2: Documentación**

> Los documentos se ingresan como **texto** (número/código), no como imágenes.

| Campo                        | Formato                  | Ejemplo   |
| ---------------------------- | ------------------------ | --------- |
| Nº Licencia de Conducir      | 5-15 chars alfanuméricos | `A123456` |
| Cédula Verde/Azul            | 5-15 chars alfanuméricos | `AB12345` |
| Habilitaciones de Transporte | 3-20 chars alfanuméricos | `MUN-001` |

**Sección 3: Datos del Vehículo**

| Campo             | Formato                 | Ejemplo              |
| ----------------- | ----------------------- | -------------------- |
| Modelo            | Texto libre, 3-60 chars | `Fiat Cronos`        |
| Patente           | Formato argentino       | `ABC123` o `AB123CD` |
| Color             | Solo letras, 3-20 chars | `Blanco`             |
| Pasajeros máximos | Número 1-20             | `4`                  |

**Validaciones Anti-Fraude:**

- DNI, Nº Licencia, Nº Cédula y Patente son **únicos en la BD** (no se puede registrar el mismo documento dos veces)
- Validación de formato **client-side** con mensajes de error inline
- Validación de formato **server-side** con `class-validator` (doble capa)
- Error Prisma `P2002` devuelve mensaje claro en español

**Components:**

- Formulario en una sola pantalla con scroll
- `HelperText` de error bajo cada campo inválido
- Validación al perder el foco (blur) y al intentar enviar
- `ThemeSelector` para elegir tema visual

### 4. Client Home (`(tabs)/index.tsx` — vista cliente)

**Layout:**

```
┌──────────────────────────────┐
│  📍 Origen:                  │
│  [Input: Calle y Número]     │
│  📍 Destino:                 │
│  [Input: Calle y Número]     │
│  [Pedir Remis Ahora] Button  │
└──────────────────────────────┘
```

**Features:**

- Inputs de texto para origen y destino
- Botón "Pedir Remis Ahora" que emite solicitud por WebSocket
- Lista de ofertas recibidas en tiempo real
- Tarjeta de viaje activo cuando hay un viaje en curso

**State:**

```typescript
const [origin, setOrigin] = useState("");
const [destination, setDestination] = useState("");
const [offers, setOffers] = useState([]);
const [activeRide, setActiveRide] = useState(null);
```

**On Submit:**

```typescript
const handleRequestRide = () => {
  socketService.emit("request_ride", { originAddress, destAddress });
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

### 6. Driver Dashboard (`(tabs)/index.tsx` — vista chofer)

> **Nota:** Implementado dentro de `(tabs)/index.tsx` como `renderDriverView()`, no en archivo separado.

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
│  │ 👤 Juan P. ✓ Reg       │  │
│  │  [DETALLES] [RESPONDER]│  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

**Components:**

- Online/Offline switch (prominente)
- Filtro "Solo clientes registrados"
- Lista de RideRequestCards
- Dialog para enviar oferta (precio + ETA)
- Dialog de detalles del pasajero
- Empty state "Ponte en línea para recibir viajes"

**State:**

```typescript
const [isOnline, setIsOnline] = useState(false);
const [onlyRegistered, setOnlyRegistered] = useState(false);
const [rideRequests, setRideRequests] = useState([]);
const [activeRide, setActiveRide] = useState(null);
```

**WebSocket Listener:**

```typescript
useEffect(() => {
  if (!isOnline) return;

  socket.on("new_ride_request", (payload) => {
    setRideRequests((prev) => [...prev, payload]);
  });

  return () => {
    socket.off("new_ride_request");
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

**Real-time Status Updates:**

```typescript
useEffect(() => {
  socket.on("ride_status_changed", ({ newStatus }) => {
    setRideStatus(newStatus);

    if (newStatus === "COMPLETED") {
      navigation.navigate("modals/rating", { rideId });
    }
  });

  return () => {
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
        auth: { token: accessToken },
      });
    }

    return () => socket.current?.disconnect();
  }, [accessToken]);

  return socket.current;
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
