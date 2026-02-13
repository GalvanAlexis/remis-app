# 🧪 REMIS APP - Testing Strategy

## Testing Pyramid

```
           /\
          /  \         E2E Tests (10%)
         /    \
        /------\      Integration Tests (30%)
       /        \
      /----------\    Unit Tests (60%)
     /__________  \
```

---

## Unit Testing

### Backend Unit Tests

**Framework**: Jest + ts-jest

**Coverage Goal**: 80%+

#### Auth Service Tests

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, PrismaService, RedisService, JwtService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should hash password before storing', async () => {
      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        role: 'CLIENTE',
      });

      expect(result.password).not.toBe('password123');
      expect(await bcrypt.compare('password123', result.password)).toBe(true);
    });

    it('should throw error if email already exists', async () => {
      // Arrange: create user first
      // Act & Assert
      await expect(service.register({ ... })).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      const result = await service.login('test@example.com', 'password123');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error on invalid credentials', async () => {
      await expect(service.login('test@example.com', 'wrong')).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens with valid refresh token', async () => {
      // Create refresh token first
      const { refreshToken } = await service.login('test@example.com', 'password123');

      // Use refresh token
      const result = await service.refreshToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).not.toBe(refreshToken); // Token rotation
    });

    it('should throw error on invalid refresh token', async () => {
      await expect(service.refreshToken('invalid_token')).rejects.toThrow();
    });
  });
});
```

#### Geolocation Service Tests

```typescript
// geolocation.service.spec.ts
describe("GeolocationService", () => {
  describe("calculateDistance", () => {
    it("should calculate correct distance between two points", () => {
      const point1 = { lat: -34.603722, lng: -58.381592 }; // Buenos Aires
      const point2 = { lat: -34.605722, lng: -58.385592 };

      const distance = service.calculateDistance(point1, point2);

      expect(distance).toBeCloseTo(450, 0); // ~450 meters
    });
  });

  describe("findNearbyDrivers", () => {
    it("should return drivers within radius", async () => {
      // Seed test data
      await prisma.driverStatus.createMany({
        data: [
          {
            userId: "1",
            isOnline: true,
            currentLat: -34.603,
            currentLng: -58.381,
          },
          {
            userId: "2",
            isOnline: true,
            currentLat: -34.604,
            currentLng: -58.382,
          },
          { userId: "3", isOnline: true, currentLat: -35.0, currentLng: -60.0 }, // Far away
        ],
      });

      const drivers = await service.findNearbyDrivers(
        -34.603722,
        -58.381592,
        1000,
      ); // 1km

      expect(drivers).toHaveLength(2);
      expect(drivers.map((d) => d.userId)).toContain("1");
      expect(drivers.map((d) => d.userId)).toContain("2");
      expect(drivers.map((d) => d.userId)).not.toContain("3");
    });
  });
});
```

### Frontend Unit Tests

**Framework**: Jest + React Native Testing Library

#### Component Tests

```typescript
// OfferCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { OfferCard } from '@/components/OfferCard';

describe('OfferCard', () => {
  const mockOffer = {
    id: '1',
    driver: {
      nombre: 'Carlos',
      apellido: 'González',
      avatarUrl: 'https://...',
      rating: 4.8,
      totalRides: 120,
    },
    estimatedArrivalMinutes: 5,
    quotedPrice: 450,
  };

  it('should render driver information correctly', () => {
    const { getByText } = render(<OfferCard offer={mockOffer} onAccept={() => {}} />);

    expect(getByText('Carlos G.')).toBeTruthy();
    expect(getByText('⭐ 4.8 (120 viajes)')).toBeTruthy();
    expect(getByText('5 minutos')).toBeTruthy();
    expect(getByText('$450')).toBeTruthy();
  });

  it('should call onAccept when accept button is pressed', () => {
    const onAcceptMock = jest.fn();
    const { getByText } = render(<OfferCard offer={mockOffer} onAccept={onAcceptMock} />);

    fireEvent.press(getByText('Aceptar'));

    expect(onAcceptMock).toHaveBeenCalledWith('1');
  });
});
```

#### Hook Tests

```typescript
// useAuth.test.ts
import { renderHook, act } from "@testing-library/react-hooks";
import { useAuth } from "@/hooks/useAuth";

describe("useAuth", () => {
  it("should login successfully", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });

  it("should logout and clear tokens", async () => {
    const { result } = renderHook(() => useAuth());

    // Login first
    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
```

---

## Integration Testing

### Backend Integration Tests

**Framework**: Jest + Supertest

#### Auth Flow Integration Test

```typescript
// auth.integration.spec.ts
describe("Auth Flow (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should complete full auth flow", async () => {
    // 1. Register
    const registerRes = await request(app.getHttpServer())
      .post("/api/v1/auth/register/client")
      .send({
        email: "test@example.com",
        password: "SecurePass123!",
        nombre: "Test",
        apellido: "User",
        dni: "12345678",
      })
      .expect(201);

    expect(registerRes.body.data.accessToken).toBeDefined();

    // 2. Login
    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({
        email: "test@example.com",
        password: "SecurePass123!",
      })
      .expect(200);

    const { accessToken, refreshToken } = loginRes.body.data;

    // 3. Access protected route
    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    // 4. Refresh token
    const refreshRes = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(200);

    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.accessToken).not.toBe(accessToken);

    // 5. Logout
    await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    // 6. Verify refresh token is invalidated
    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(401);
  });
});
```

#### Ride Flow Integration Test

```typescript
// ride-flow.integration.spec.ts
describe("Ride Flow (e2e)", () => {
  let clientToken: string;
  let driverToken: string;
  let rideId: string;

  beforeAll(async () => {
    // Setup client and driver users
    clientToken = await createTestUser("CLIENTE");
    driverToken = await createAndVerifyDriver();
  });

  it("should complete full ride flow", async () => {
    // 1. Driver goes online
    await request(app.getHttpServer())
      .patch("/api/v1/drivers/status")
      .set("Authorization", `Bearer ${driverToken}`)
      .send({ isOnline: true, acceptingUnregistered: true })
      .expect(200);

    // 2. Client creates ride request
    const rideRes = await request(app.getHttpServer())
      .post("/api/v1/rides/request")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        originAddress: "Av. Corrientes 1234",
        originLat: -34.603722,
        originLng: -58.381592,
        destinationAddress: "Av. Santa Fe 5678",
        destinationLat: -34.593722,
        destinationLng: -58.391592,
      })
      .expect(201);

    rideId = rideRes.body.data.rideId;

    // 3. Driver creates offer
    const offerRes = await request(app.getHttpServer())
      .post("/api/v1/offers")
      .set("Authorization", `Bearer ${driverToken}`)
      .send({
        rideId,
        estimatedArrivalMinutes: 5,
        quotedPrice: 450,
      })
      .expect(201);

    const offerId = offerRes.body.data.offerId;

    // 4. Client accepts offer
    await request(app.getHttpServer())
      .post(`/api/v1/offers/${offerId}/accept`)
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    // 5. Verify ride status is MATCHED
    const rideCheck = await request(app.getHttpServer())
      .get(`/api/v1/rides/${rideId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    expect(rideCheck.body.data.status).toBe("MATCHED");

    // 6. Driver starts ride
    await request(app.getHttpServer())
      .patch(`/api/v1/rides/${rideId}/start`)
      .set("Authorization", `Bearer ${driverToken}`)
      .expect(200);

    // 7. Driver completes ride
    await request(app.getHttpServer())
      .patch(`/api/v1/rides/${rideId}/complete`)
      .set("Authorization", `Bearer ${driverToken}`)
      .send({ finalPrice: 450 })
      .expect(200);

    // 8. Client rates driver
    await request(app.getHttpServer())
      .post("/api/v1/ratings")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        rideId,
        toUserId: driverUserId,
        score: 5,
        comment: "Excelente servicio",
      })
      .expect(201);
  });
});
```

---

## End-to-End Testing

### Mobile E2E Tests

**Framework**: Detox

#### Setup Detox

```json
// package.json
{
  "detox": {
    "configurations": {
      "ios.sim.debug": {
        "device": {
          "type": "iPhone 14"
        },
        "app": "ios.debug"
      },
      "android.emu.debug": {
        "device": {
          "avdName": "Pixel_5_API_31"
        },
        "app": "android.debug"
      }
    }
  }
}
```

#### E2E Test - Client Request Ride

```typescript
// e2e/client-request-ride.e2e.ts
describe("Client Request Ride Flow", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should request a ride and view offers", async () => {
    // 1. Skip registration (guest mode)
    await element(by.text("Continuar como invitado")).tap();

    // 2. Enter origin
    await element(by.id("origin-input")).typeText("Av. Corrientes 1234\n");

    // 3. Enter destination
    await element(by.id("destination-input")).typeText("Av. Santa Fe 5678\n");

    // 4. Request ride
    await element(by.id("search-drivers-button")).tap();

    // 5. Wait for offers screen
    await waitFor(element(by.text("Ofertas disponibles")))
      .toBeVisible()
      .withTimeout(5000);

    // 6. Verify at least one offer appears (assuming test driver is seeded)
    await expect(element(by.id("offer-card-0"))).toBeVisible();

    // 7. Accept first offer
    await element(by.id("accept-offer-0")).tap();

    // 8. Confirm acceptance
    await element(by.text("Confirmar")).tap();

    // 9. Verify ride active screen
    await waitFor(element(by.text("Viaje Confirmado")))
      .toBeVisible()
      .withTimeout(3000);
  });
});
```

---

## Performance Testing

### Load Testing with k6

```javascript
// load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 20 }, // Ramp up to 20 users
    { duration: "1m", target: 100 }, // Ramp up to 100 users
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests < 500ms
    http_req_failed: ["rate<0.01"], // Error rate < 1%
  },
};

export default function () {
  // Test ride request endpoint
  const payload = JSON.stringify({
    originAddress: "Test Origin",
    originLat: -34.603722,
    originLng: -58.381592,
    destinationAddress: "Test Destination",
    destinationLat: -34.593722,
    destinationLng: -58.391592,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${__ENV.TEST_TOKEN}`,
    },
  };

  const res = http.post(`${__ENV.API_URL}/rides/request`, payload, params);

  check(res, {
    "status is 201": (r) => r.status === 201,
    "response time OK": (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

**Run:**

```bash
k6 run load-test.js --env API_URL=https://api-remis.railway.app/api/v1 --env TEST_TOKEN=your_token
```

---

## Test Coverage

### Generate Coverage Report

```bash
# Backend
cd backend
npm run test:cov

# Frontend
cd mobile
npm run test -- --coverage
```

### Coverage Goals

| Layer        | Target              | Critical Paths                   |
| ------------ | ------------------- | -------------------------------- |
| **Backend**  | 80%+                | Auth, Rides, Geolocation         |
| **Frontend** | 70%+                | Auth flows, Forms, Components    |
| **E2E**      | Critical paths only | Request ride, Accept offer, Rate |

---

## Continuous Testing (CI)

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - name: Install dependencies
        run: cd backend && npm ci
      - name: Run tests
        run: cd backend && npm run test:cov
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: cd mobile && npm ci
      - name: Run tests
        run: cd mobile && npm run test -- --coverage
```

---

## Testing Checklist

### Before Deploy

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Coverage > 80% (backend), > 70% (frontend)
- [ ] E2E tests for critical paths passing
- [ ] Load test completed (100 concurrent users)
- [ ] Security tests completed
- [ ] Manual smoke testing on staging
- [ ] Mobile tested on real devices (Android + iOS)
- [ ] Performance benchmarks met (p95 < 500ms)
