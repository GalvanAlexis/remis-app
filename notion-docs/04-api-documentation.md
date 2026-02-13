# 🔌 REMIS APP - API Documentation

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api-remis.railway.app/api/v1
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

All responses follow this structure:

```typescript
{
  "data": any | null,
  "meta": {
    "timestamp": string,
    "requestId": string
  },
  "error": {
    "code": string,
    "message": string,
    "details": any
  } | null
}
```

---

## Auth Endpoints

### POST /auth/register/client

Register a new client user.

**Request Body:**

```json
{
  "email": "cliente@example.com",
  "password": "SecurePass123!",
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12345678",
  "direccion": "Calle Falsa 123",
  "phone": "+541112345678"
}
```

**Response (201):**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "cliente@example.com",
      "role": "CLIENTE",
      "createdAt": "2026-02-10T10:00:00Z"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "meta": {...},
  "error": null
}
```

### POST /auth/register/driver

Register a new driver user with documents.

**Request Body (multipart/form-data):**

```
email: string
password: string
nombre: string
apellido: string
dni: string
phone: string
maxPassengers: number
vehicleBrand: string
vehicleModel: string
vehiclePlate: string
licenciaFile: File (image)
cedulaFile: File (image)
habilitacionesFile: File (image)
```

**Response (201):**

```json
{
  "data": {
    "user": { ... },
    "documents": {
      "verificationStatus": "PENDING"
    },
    "accessToken": "...",
    "refreshToken": "..."
  },
  "meta": {...},
  "error": null
}
```

### POST /auth/login

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CLIENTE"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**

```json
{
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

### POST /auth/logout

Invalidate refresh token.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**

```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Users Endpoints

### GET /users/me

Get current user profile.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CHOFER",
    "profile": {
      "nombre": "Carlos",
      "apellido": "González",
      "dni": "87654321",
      "phone": "+541198765432",
      "avatarUrl": "https://..."
    },
    "driverDocuments": {
      "verificationStatus": "APPROVED",
      "vehicleBrand": "Ford",
      "vehicleModel": "Focus",
      "vehiclePlate": "ABC123",
      "maxPassengers": 4
    },
    "averageRating": 4.8,
    "totalRides": 150
  }
}
```

### PATCH /users/me

Update current user profile.

**Request Body:**

```json
{
  "nombre": "Carlos Antonio",
  "phone": "+541199999999",
  "avatarUrl": "https://new-avatar.jpg"
}
```

**Response (200):**

```json
{
  "data": {
    "updated": true,
    "profile": { ... }
  }
}
```

### GET /users/:id

Get public user profile (privacy rules apply).

**Response (200) - Cliente no registrado consultando chofer:**

```json
{
  "data": {
    "nombre": "Carlos",
    "apellido": "González",
    "avatarUrl": "https://...",
    "averageRating": 4.8,
    "totalRides": 150
  }
}
```

**Response (200) - Cliente registrado consultando chofer:**

```json
{
  "data": {
    "nombre": "Carlos",
    "apellido": "González",
    "dni": "87654321",
    "phone": "+541198765432",
    "vehicleBrand": "Ford",
    "vehicleModel": "Focus",
    "vehiclePlate": "ABC123",
    "averageRating": 4.8,
    "totalRides": 150
  }
}
```

---

## Drivers Endpoints

### PATCH /drivers/location

Update driver current location (only for verified drivers).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "lat": -34.603722,
  "lng": -58.381592
}
```

**Response (200):**

```json
{
  "data": {
    "updated": true,
    "timestamp": "2026-02-10T14:30:00Z"
  }
}
```

### PATCH /drivers/status

Toggle driver online/offline status.

**Request Body:**

```json
{
  "isOnline": true,
  "acceptingUnregistered": false
}
```

**Response (200):**

```json
{
  "data": {
    "userId": "uuid",
    "isOnline": true,
    "acceptingUnregistered": false
  }
}
```

### GET /drivers/nearby

Get nearby online drivers (for matching algorithm - internal use).

**Query Params:**

```
lat=-34.603722
lng=-58.381592
radius=10000 (meters)
```

**Response (200):**

```json
{
  "data": [
    {
      "driverId": "uuid",
      "distance": 1250, // meters
      "nombre": "Carlos",
      "avatarUrl": "...",
      "averageRating": 4.8,
      "currentLat": -34.605,
      "currentLng": -58.38
    }
  ]
}
```

---

## Rides Endpoints

### POST /rides/request

Create a new ride request.

**Headers:**

```
Authorization: Bearer <access_token> (optional for guests)
```

**Request Body:**

```json
{
  "originAddress": "Av. Corrientes 1234",
  "originLat": -34.603722,
  "originLng": -58.381592,
  "destinationAddress": "Av. Santa Fe 5678",
  "destinationLat": -34.593722,
  "destinationLng": -58.391592
}
```

**Response (201):**

```json
{
  "data": {
    "rideId": "uuid",
    "status": "PENDING",
    "originAddress": "Av. Corrientes 1234",
    "destinationAddress": "Av. Santa Fe 5678",
    "createdAt": "2026-02-10T14:30:00Z"
  }
}
```

### GET /rides/:id

Get ride details.

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "status": "MATCHED",
    "originAddress": "...",
    "destinationAddress": "...",
    "driver": {
      "nombre": "Carlos",
      "phone": "+54111234",
      "vehiclePlate": "ABC123"
    },
    "estimatedPrice": 500,
    "createdAt": "...",
    "startedAt": null
  }
}
```

### PATCH /rides/:id/start

Start the ride (driver only).

**Response (200):**

```json
{
  "data": {
    "rideId": "uuid",
    "status": "IN_PROGRESS",
    "startedAt": "2026-02-10T14:45:00Z"
  }
}
```

### PATCH /rides/:id/complete

Complete the ride (driver only).

**Request Body:**

```json
{
  "finalPrice": 550
}
```

**Response (200):**

```json
{
  "data": {
    "rideId": "uuid",
    "status": "COMPLETED",
    "completedAt": "2026-02-10T15:00:00Z",
    "finalPrice": 550
  }
}
```

### DELETE /rides/:id

Cancel ride (client only, before IN_PROGRESS).

**Response (200):**

```json
{
  "data": {
    "rideId": "uuid",
    "status": "CANCELLED"
  }
}
```

### GET /rides/history

Get user's ride history.

**Query Params:**

```
page=1
limit=20
status=COMPLETED (optional)
```

**Response (200):**

```json
{
  "data": {
    "rides": [
      {
        "id": "uuid",
        "status": "COMPLETED",
        "originAddress": "...",
        "destinationAddress": "...",
        "driver": { "nombre": "..." },
        "finalPrice": 500,
        "completedAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "hasMore": true
    }
  }
}
```

---

## Offers Endpoints

### POST /offers

Create an offer for a ride (driver only).

**Request Body:**

```json
{
  "rideId": "uuid",
  "estimatedArrivalMinutes": 5,
  "quotedPrice": 450
}
```

**Response (201):**

```json
{
  "data": {
    "offerId": "uuid",
    "rideId": "uuid",
    "driverId": "uuid",
    "estimatedArrivalMinutes": 5,
    "quotedPrice": 450,
    "status": "PENDING",
    "createdAt": "2026-02-10T14:32:00Z"
  }
}
```

### GET /rides/:rideId/offers

Get all offers for a specific ride (client only).

**Response (200):**

```json
{
  "data": [
    {
      "offerId": "uuid1",
      "driver": {
        "id": "uuid",
        "nombre": "Carlos",
        "apellido": "González",
        "avatarUrl": "...",
        "averageRating": 4.8,
        "totalRides": 150
      },
      "estimatedArrivalMinutes": 5,
      "quotedPrice": 450,
      "createdAt": "..."
    },
    {
      "offerId": "uuid2",
      "driver": { ... },
      "estimatedArrivalMinutes": 8,
      "quotedPrice": 420,
      "createdAt": "..."
    }
  ]
}
```

### POST /offers/:id/accept

Accept an offer (client only).

**Response (200):**

```json
{
  "data": {
    "offerId": "uuid",
    "rideId": "uuid",
    "status": "ACCEPTED",
    "ride": {
      "status": "MATCHED",
      "driver": { ... }
    }
  }
}
```

---

## Ratings Endpoints

### POST /ratings

Create a rating for a completed ride.

**Request Body:**

```json
{
  "rideId": "uuid",
  "toUserId": "uuid",
  "score": 5,
  "comment": "Excelente servicio, muy puntual"
}
```

**Response (201):**

```json
{
  "data": {
    "ratingId": "uuid",
    "score": 5,
    "comment": "...",
    "createdAt": "2026-02-10T15:05:00Z"
  }
}
```

### GET /users/:id/ratings

Get ratings received by a user.

**Query Params:**

```
page=1
limit=10
```

**Response (200):**

```json
{
  "data": {
    "averageRating": 4.8,
    "totalRatings": 150,
    "ratings": [
      {
        "id": "uuid",
        "score": 5,
        "comment": "Excelente servicio",
        "fromUser": {
          "nombre": "Juan",
          "avatarUrl": "..."
        },
        "createdAt": "2026-02-10T15:05:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

## Notifications Endpoints

### POST /notifications/register-token

Register device token for push notifications.

**Request Body:**

```json
{
  "expoToken": "ExponentPushToken[xxxxxx]",
  "deviceId": "unique-device-id"
}
```

**Response (200):**

```json
{
  "data": {
    "registered": true
  }
}
```

### DELETE /notifications/unregister-token

Unregister device token.

**Request Body:**

```json
{
  "expoToken": "ExponentPushToken[xxxxxx]"
}
```

**Response (200):**

```json
{
  "data": {
    "unregistered": true
  }
}
```

---

## WebSocket Events

### Connection

```javascript
import io from "socket.io-client";

const socket = io("ws://localhost:3000", {
  auth: {
    token: accessToken,
  },
});
```

### Driver Events

**Listen: `new_ride_request`**

```typescript
socket.on("new_ride_request", (payload) => {
  // payload:
  {
    rideId: string;
    origin: string;
    destination: string;
    clientName: string;
    isClientRegistered: boolean;
    distance: number; // meters
  }
});
```

**Emit: `join_driver_room`**

```typescript
socket.emit("join_driver_room");
```

**Listen: `offer_accepted`**

```typescript
socket.on("offer_accepted", (payload) => {
  // payload:
  {
    rideId: string;
    offerId: string;
    clientName: string;
    origin: string;
    destination: string;
  }
});
```

### Client Events

**Listen: `new_offer`**

```typescript
socket.on("new_offer", (payload) => {
  // payload:
  {
    offerId: string;
    rideId: string;
    driver: {
      id: string;
      nombre: string;
      avatarUrl: string;
      rating: number;
    }
    estimatedArrivalMinutes: number;
    quotedPrice: number;
  }
});
```

**Emit: `join_ride_room`**

```typescript
socket.emit("join_ride_room", rideId);
```

**Listen: `ride_status_changed`**

```typescript
socket.on("ride_status_changed", (payload) => {
  // payload:
  {
    rideId: string;
    newStatus: "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  }
});
```

---

## Error Codes

| Code             | HTTP Status | Description                         |
| ---------------- | ----------- | ----------------------------------- |
| `AUTH_001`       | 401         | Invalid credentials                 |
| `AUTH_002`       | 401         | Token expired                       |
| `AUTH_003`       | 401         | Invalid token                       |
| `AUTH_004`       | 403         | Insufficient permissions            |
| `USER_001`       | 404         | User not found                      |
| `USER_002`       | 409         | Email already exists                |
| `DRIVER_001`     | 403         | Driver not verified                 |
| `DRIVER_002`     | 400         | Driver already online               |
| `RIDE_001`       | 404         | Ride not found                      |
| `RIDE_002`       | 400         | Invalid ride status                 |
| `RIDE_003`       | 429         | Too many ride requests (rate limit) |
| `OFFER_001`      | 404         | Offer not found                     |
| `OFFER_002`      | 400         | Offer already accepted              |
| `RATING_001`     | 400         | Rating already exists for this ride |
| `RATING_002`     | 403         | Not authorized to rate this ride    |
| `VALIDATION_001` | 400         | Invalid input data                  |

---

## Rate Limits

| Endpoint                           | Limit        | Window   |
| ---------------------------------- | ------------ | -------- |
| `POST /auth/login`                 | 5 requests   | 1 minute |
| `POST /auth/register/*`            | 3 requests   | 1 hour   |
| `POST /rides/request` (guest)      | 10 requests  | 1 hour   |
| `POST /rides/request` (registered) | Unlimited    | -        |
| `POST /offers`                     | 30 requests  | 1 hour   |
| `Global`                           | 100 requests | 1 minute |
