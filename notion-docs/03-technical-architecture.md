# 🏗️ REMIS APP - Technical Architecture

## System Architecture Overview

```mermaid
graph TB
    subgraph "Mobile Layer"
        MA[Mobile App<br/>React Native + Expo]
        MA_C[Cliente UI]
        MA_D[Chofer UI]
        MA --> MA_C
        MA --> MA_D
    end

    subgraph "API Gateway"
        NEST[NestJS API<br/>/api/v1]
        WS[Socket.io Gateway<br/>Real-time Events]
    end

    subgraph "Business Logic"
        AUTH[Auth Module]
        USERS[Users Module]
        RIDES[Rides Module]
        GEO[Geolocation Module]
        OFFERS[Offers Module]
        RATINGS[Ratings Module]
        NOTIF[Notifications Module]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>+ PostGIS)]
        REDIS[(Redis<br/>Cache + Tokens)]
        QUEUE[Bull Queue<br/>Async Jobs]
    end

    MA_C -->|REST + WS| NEST
    MA_D -->|REST + WS| NEST
    MA -->|WS| WS

    NEST --> AUTH
    NEST --> USERS
    NEST --> RIDES
    NEST --> GEO
    NEST --> OFFERS
    NEST --> RATINGS
    NEST --> NOTIF

    AUTH --> PG
    AUTH --> REDIS
    USERS --> PG
    RIDES --> PG
    GEO --> PG
    OFFERS --> PG
    RATINGS --> PG

    GEO --> REDIS
    NOTIF --> QUEUE

    WS --> RIDES
    WS --> OFFERS
```

---

## Database Schema (Prisma)

### Complete ERD

```mermaid
erDiagram
    User ||--o| Profile : has
    User ||--o| DriverDocuments : has
    User ||--o| DriverStatus : has
    User ||--o{ Ride : "creates (client)"
    User ||--o{ Ride : "accepts (driver)"
    User ||--o{ Offer : creates
    User ||--o{ Rating : "gives"
    User ||--o{ Rating : "receives"

    Ride ||--o{ Offer : "has many"
    Ride ||--o{ Rating : "generates"

    User {
        string id PK
        string email UK
        string password
        enum role
        datetime created_at
        datetime updated_at
    }

    Profile {
        string id PK
        string user_id FK
        string nombre
        string apellido
        string dni UK
        string direccion
        string phone
        string avatar_url
    }

    DriverDocuments {
        string id PK
        string user_id FK
        string licencia_url
        string cedula_url
        string habilitaciones_url
        int max_passengers
        string vehicle_brand
        string vehicle_model
        string vehicle_plate UK
        enum verification_status
        datetime verified_at
    }

    DriverStatus {
        string id PK
        string user_id FK
        boolean is_online
        boolean accepting_unregistered
        decimal current_lat
        decimal current_lng
        datetime updated_at
    }

    Ride {
        string id PK
        string client_id FK
        string driver_id FK
        string origin_address
        decimal origin_lat
        decimal origin_lng
        string destination_address
        decimal destination_lat
        decimal destination_lng
        enum status
        decimal estimated_price
        decimal final_price
        datetime created_at
        datetime started_at
        datetime completed_at
    }

    Offer {
        string id PK
        string ride_id FK
        string driver_id FK
        int estimated_arrival_minutes
        decimal quoted_price
        enum status
        datetime created_at
    }

    Rating {
        string id PK
        string ride_id FK
        string from_user_id FK
        string to_user_id FK
        int score
        string comment
        datetime created_at
    }
```

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  CLIENTE
  CHOFER
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum RideStatus {
  PENDING
  MATCHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum OfferStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  role          UserRole
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  profile          Profile?
  driverDocuments  DriverDocuments?
  driverStatus     DriverStatus?
  ridesAsClient    Ride[]   @relation("ClientRides")
  ridesAsDriver    Ride[]   @relation("DriverRides")
  offers           Offer[]
  ratingsGiven     Rating[] @relation("RatingsGiven")
  ratingsReceived  Rating[] @relation("RatingsReceived")

  @@map("users")
}

model Profile {
  id        String  @id @default(uuid())
  userId    String  @unique @map("user_id")
  nombre    String
  apellido  String
  dni       String  @unique
  direccion String?
  phone     String?
  avatarUrl String? @map("avatar_url")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

model DriverDocuments {
  id                  String             @id @default(uuid())
  userId              String             @unique @map("user_id")
  licenciaUrl         String             @map("licencia_url")
  cedulaUrl           String             @map("cedula_url")
  habilitacionesUrl   String             @map("habilitaciones_url")
  maxPassengers       Int                @map("max_passengers")
  vehicleBrand        String             @map("vehicle_brand")
  vehicleModel        String             @map("vehicle_model")
  vehiclePlate        String             @unique @map("vehicle_plate")
  verificationStatus  VerificationStatus @default(PENDING) @map("verification_status")
  verifiedAt          DateTime?          @map("verified_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("driver_documents")
}

model DriverStatus {
  id                    String    @id @default(uuid())
  userId                String    @unique @map("user_id")
  isOnline              Boolean   @default(false) @map("is_online")
  acceptingUnregistered Boolean   @default(true) @map("accepting_unregistered")
  currentLat            Decimal?  @map("current_lat") @db.Decimal(10, 8)
  currentLng            Decimal?  @map("current_lng") @db.Decimal(11, 8)
  updatedAt             DateTime  @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("driver_status")
  @@index([currentLat, currentLng], type: Gist) // PostGIS spatial index
}

model Ride {
  id                  String      @id @default(uuid())
  clientId            String      @map("client_id")
  driverId            String?     @map("driver_id")
  originAddress       String      @map("origin_address")
  originLat           Decimal     @map("origin_lat") @db.Decimal(10, 8)
  originLng           Decimal     @map("origin_lng") @db.Decimal(11, 8)
  destinationAddress  String      @map("destination_address")
  destinationLat      Decimal     @map("destination_lat") @db.Decimal(10, 8)
  destinationLng      Decimal     @map("destination_lng") @db.Decimal(11, 8)
  status              RideStatus  @default(PENDING)
  estimatedPrice      Decimal?    @map("estimated_price") @db.Decimal(10, 2)
  finalPrice          Decimal?    @map("final_price") @db.Decimal(10, 2)
  createdAt           DateTime    @default(now()) @map("created_at")
  startedAt           DateTime?   @map("started_at")
  completedAt         DateTime?   @map("completed_at")

  client  User     @relation("ClientRides", fields: [clientId], references: [id])
  driver  User?    @relation("DriverRides", fields: [driverId], references: [id])
  offers  Offer[]
  ratings Rating[]

  @@map("rides")
  @@index([status, createdAt])
  @@index([clientId])
  @@index([driverId])
}

model Offer {
  id                      String      @id @default(uuid())
  rideId                  String      @map("ride_id")
  driverId                String      @map("driver_id")
  estimatedArrivalMinutes Int         @map("estimated_arrival_minutes")
  quotedPrice             Decimal     @map("quoted_price") @db.Decimal(10, 2)
  status                  OfferStatus @default(PENDING)
  createdAt               DateTime    @default(now()) @map("created_at")

  ride   Ride @relation(fields: [rideId], references: [id], onDelete: Cascade)
  driver User @relation(fields: [driverId], references: [id])

  @@map("offers")
  @@index([rideId, status])
  @@index([driverId])
}

model Rating {
  id         String   @id @default(uuid())
  rideId     String   @map("ride_id")
  fromUserId String   @map("from_user_id")
  toUserId   String   @map("to_user_id")
  score      Int      // 1-5
  comment    String?  @db.Text
  createdAt  DateTime @default(now()) @map("created_at")

  ride     Ride @relation(fields: [rideId], references: [id])
  fromUser User @relation("RatingsGiven", fields: [fromUserId], references: [id])
  toUser   User @relation("RatingsReceived", fields: [toUserId], references: [id])

  @@map("ratings")
  @@unique([rideId, fromUserId]) // Un usuario solo puede calificar una vez por viaje
  @@index([toUserId])
}
```

---

## Module Breakdown

### 1. Auth Module

**Responsabilidades:**

- Registro de usuarios (cliente/chofer)
- Login con JWT
- Refresh token management
- Logout (invalidación de refresh tokens)

**Endpoints:**

- `POST /api/v1/auth/register/client`
- `POST /api/v1/auth/register/driver`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

**Services:**

- `AuthService`: Lógica de autenticación
- `JwtService`: Generación y validación de tokens
- `RedisService`: Almacenamiento de refresh tokens

**Guards:**

- `JwtAuthGuard`: Verificación de access token
- `RolesGuard`: Verificación de rol (CLIENTE/CHOFER)

### 2. Users Module

**Responsabilidades:**

- Gestión de perfiles
- Upload y verificación de documentos (chofer)
- Consulta de usuarios

**Endpoints:**

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users/:id`
- `POST /api/v1/drivers/documents`
- `GET /api/v1/drivers/documents/status`

**Services:**

- `UsersService`: CRUD de usuarios
- `FileUploadService`: Manejo de archivos
- `DocumentVerificationService`: Lógica de verificación

### 3. Geolocation Module

**Responsabilidades:**

- Update de ubicación en tiempo real
- Cálculo de distancias (PostGIS)
- Búsqueda de choferes cercanos

**Endpoints:**

- `PATCH /api/v1/drivers/location`
- `GET /api/v1/drivers/nearby`

**Services:**

- `GeolocationService`: Queries geoespaciales
- `DistanceCalculatorService`: Cálculos con PostGIS

### 4. Rides Module

**Responsabilidades:**

- Creación de solicitudes de viaje
- Matching de cliente-chofer
- Gestión de estados del viaje
- WebSocket para eventos real-time

**Endpoints:**

- `POST /api/v1/rides/request`
- `GET /api/v1/rides/:id`
- `PATCH /api/v1/rides/:id/start`
- `PATCH /api/v1/rides/:id/complete`
- `DELETE /api/v1/rides/:id` (cancelar)
- `GET /api/v1/rides/history`

**WebSocket Events:**

- Emit: `new_ride_request` (a choferes)
- Emit: `ride_status_changed` (a participantes)

**Services:**

- `RidesService`: CRUD y lógica de negocio
- `MatchingService`: Algoritmo de matching
- `RideCleanupService`: Job para limpiar rides huérfanos

### 5. Offers Module

**Responsabilidades:**

- Creación de ofertas por choferes
- Aceptación de ofertas por clientes
- WebSocket para ofertas en tiempo real

**Endpoints:**

- `POST /api/v1/offers`
- `GET /api/v1/rides/:rideId/offers`
- `POST /api/v1/offers/:id/accept`

**WebSocket Events:**

- Emit: `new_offer` (a cliente específico)
- Emit: `offer_accepted` (a chofer específico)

**Services:**

- `OffersService`: CRUD y lógica de ofertas

### 6. Ratings Module

**Responsabilidades:**

- Creación de calificaciones
- Cálculo de rating promedio
- Consulta de ratings de usuarios

**Endpoints:**

- `POST /api/v1/ratings`
- `GET /api/v1/users/:id/ratings`

**Services:**

- `RatingsService`: CRUD y cálculos

### 7. Notifications Module

**Responsabilidades:**

- Envío de push notifications
- Gestión de tokens de dispositivos
- Queue de notificaciones asíncronas

**Endpoints:**

- `POST /api/v1/notifications/register-token`
- `DELETE /api/v1/notifications/unregister-token`

**Services:**

- `NotificationsService`: Lógica de envío
- `ExpoNotificationsService`: Integración con Expo

---

## Real-Time Communication Flow

### Socket.io Configuration (Critical)

> [!IMPORTANT]
> Para asegurar la conexión con clientes móviles (React Native/Expo), se requiere la siguiente configuración en el backend:

1.  **IoAdapter:** Debe estar habilitado en `main.ts` (`app.useWebSocketAdapter(new IoAdapter(app))`).
2.  **Transports:** El Gateway debe permitir `['websocket', 'polling']` para compatibilidad.
3.  **Cors:** `credentials: true` y `origin: *` (o específico en prod).

### Socket.io Events

```typescript
// Server → Client Events
interface ServerToClientEvents {
  new_ride_request: (payload: {
    rideId: string;
    origin: string;
    destination: string;
    clientName: string;
    isClientRegistered: boolean;
    distance: number;
  }) => void;

  new_offer: (payload: {
    offerId: string;
    driverName: string;
    driverRating: number;
    estimatedArrival: number;
    quotedPrice: number;
  }) => void;

  offer_accepted: (payload: {
    rideId: string;
    clientName: string;
    origin: string;
    destination: string;
  }) => void;

  ride_status_changed: (payload: {
    rideId: string;
    newStatus: RideStatus;
  }) => void;
}

// Client → Server Events
interface ClientToServerEvents {
  join_driver_room: () => void;
  leave_driver_room: () => void;
  join_ride_room: (rideId: string) => void;
  leave_ride_room: (rideId: string) => void;
}
```

### WebSocket Flow Diagram

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Server
    participant D as Chofer

    C->>S: POST /rides/request
    S->>S: Busca choferes cercanos
    S->>D: emit("new_ride_request")
    D->>S: POST /offers
    S->>C: emit("new_offer")
    C->>S: POST /offers/:id/accept
    S->>D: emit("offer_accepted")
    S->>D: Cambia status a OFFLINE
```

---

## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Redis
    participant DB

    App->>API: POST /auth/login
    API->>DB: Verificar credenciales
    DB-->>API: Usuario válido
    API->>API: Generar Access Token (15min)
    API->>API: Generar Refresh Token (7 días)
    API->>Redis: Almacenar Refresh Token
    API-->>App: {accessToken, refreshToken}

    Note over App: Access Token expira

    App->>API: POST /auth/refresh
    API->>Redis: Validar Refresh Token
    Redis-->>API: Token válido
    API->>API: Generar nuevo Access Token
    API->>API: Rotar Refresh Token
    API->>Redis: Almacenar nuevo Refresh Token
    API-->>App: {accessToken, refreshToken}
```

### Authorization Layers

1. **JwtAuthGuard**: Valida access token en headers
2. **RolesGuard**: Verifica rol del usuario
3. **IsVerifiedGuard**: Verifica aprobación de documentos (solo choferes)
4. **OwnershipGuard**: Verifica que el usuario sea owner del recurso

---

## Performance Optimizations

### Caching Strategy (Redis)

```typescript
// Driver locations cache
Key: `driver:location:{userId}`
Value: { lat, lng, updated_at }
TTL: 60 seconds

// Driver online status
Key: `driver:online:{userId}`
Value: { is_online, accepting_unregistered }
TTL: indefinite (manual delete on offline)

// Refresh tokens
Key: `refresh_token:{userId}`
Value: { token, device_id, created_at }
TTL: 7 days

// Rate limiting
Key: `rate_limit:{ip}:{endpoint}`
Value: request_count
TTL: 60 seconds
```

### Database Indexes

```sql
-- Geospatial index for driver locations
CREATE INDEX idx_driver_status_location
ON driver_status
USING GIST (
  ST_SetSRID(ST_MakePoint(current_lng, current_lat), 4326)
);

-- Compound index for active rides
CREATE INDEX idx_rides_status_created
ON rides (status, created_at DESC);

-- Index for user ratings
CREATE INDEX idx_ratings_to_user
ON ratings (to_user_id);
```

---

## Deployment Architecture

```mermaid
graph LR
    subgraph "Client"
        MOB[Mobile App<br/>Expo]
    end

    subgraph "Backend - Railway"
        API[NestJS API<br/>Docker Container]
    end

    subgraph "Database"
        PG[(PostgreSQL<br/>Managed Service)]
        REDIS[(Redis<br/>Upstash/Railway)]
    end

    subgraph "Storage"
        S3[S3/Cloudinary<br/>Document Images]
    end

    subgraph "Monitoring"
        SENTRY[Sentry<br/>Error Tracking]
        LOG[LogRocket<br/>Session Replay]
    end

    MOB -->|HTTPS| API
    API --> PG
    API --> REDIS
    API --> S3
    API --> SENTRY
    API --> LOG
```

---

## Technology Stack Summary

| Layer              | Technology          | Purpose                   | Local config |
| ------------------ | ------------------- | ------------------------- | ------------ |
| **Mobile**         | React Native + Expo | Cross-platform app        | Port 8081    |
| **Navigation**     | Expo Router         | File-based routing        | -            |
| **State (Server)** | TanStack Query      | Server state management   | -            |
| **State (Client)** | Zustand             | Client state management   | -            |
| **Real-time**      | Socket.io Client    | WebSocket communication   | v4.x         |
| **API**            | NestJS + TypeScript | Backend framework         | Port 3000    |
| **Database**       | PostgreSQL 16       | Primary data store        | Port 5433    |
| **Geospatial**     | PostGIS             | Geographic queries        | Enabled      |
| **Cache**          | Redis 7             | Caching + token storage   | Optional     |
| **ORM**            | Prisma              | Type-safe database access | v5.x         |
| **Auth**           | JWT + bcrypt        | Authentication            | -            |
| **File Upload**    | Multer + Local      | Document storage          | /uploads     |
| **Queue**          | Bull                | Async job processing      | -            |
| **Notifications**  | Expo Notifications  | Push notifications        | -            |
| **Deployment**     | Railway/Render      | Container hosting         | -            |
| **Monitoring**     | Sentry              | Error tracking            | -            |
