# Tests Críticos — Remis App Backend: OpenSpec

## 1. Introducción

Tests E2E automatizados para validar los flujos de negocio críticos de la app Remis. El objetivo es tener una batería de tests que pueda correrse en cualquier momento para verificar que las rutas principales del sistema siguen funcionando.

Los tests corren contra la **misma base de datos de desarrollo** (PostgreSQL) usando datos con timestamp único para evitar colisiones entre ejecuciones.

## 2. Metas (Goals)

- Cubrir el 100% del flujo de Auth: register → login → refresh → logout
- Cubrir el 100% del flujo de Rides vía WebSocket: request → offer → accept → AT_LOCATION → IN_PROGRESS → COMPLETED
- Ejecutar en < 60 segundos en total (sin reconstruir la DB)
- Sin efectos secundarios: limpieza de datos al finalizar cada suite

## 3. Quality Gates (BARRERA CRÍTICA)

```bash
cd backend
npm run test:critical
```

**✅ Criterio de éxito:** Output final: `Tests: XX passed, XX total` sin ningún FAIL.

## 4. Historias de Usuario (Requerimientos Funcionales)

### US-001: Registro de usuario

**Descripción:** Como usuario nuevo, quiero registrarme con username/password y datos de perfil para obtener un JWT.

**Criterios de Aceptación:**

- [ ] `POST /auth/register` con `role: CLIENTE` y datos válidos → **201** con `access_token`, `refresh_token`, `user.id`, `user.role === 'CLIENTE'`
- [ ] `POST /auth/register` con username duplicado → **409**
- [ ] `POST /auth/register` con campos faltantes → **400**
- [ ] `POST /auth/register` con `role: SUPERADMIN` (inválido) → **400**

---

### US-002: Login

**Descripción:** Como usuario registrado, quiero hacer login para obtener un nuevo par de tokens.

**Criterios de Aceptación:**

- [ ] `POST /auth/login` con credenciales correctas → **200** con `access_token` y `refresh_token`
- [ ] `POST /auth/login` con contraseña incorrecta → **401**
- [ ] `POST /auth/login` con usuario inexistente → **401**
- [ ] `POST /auth/logout` sin Bearer token → **401**

---

### US-003: Refresh Token con Rotación

**Descripción:** Como usuario autenticado, quiero rotar mi refresh_token para obtener nuevos tokens sin re-login.

**Criterios de Aceptación:**

- [ ] `POST /auth/refresh` con `userId` y `refreshToken` válidos → **200** con nuevos tokens distintos al anterior
- [ ] `POST /auth/refresh` con el token viejo (ya rotado) → **401**
- [ ] `POST /auth/refresh` con `userId` inexistente → **401**

---

### US-004: Logout

**Descripción:** Como usuario autenticado, quiero hacer logout para invalidar mi refresh_token.

**Criterios de Aceptación:**

- [ ] `POST /auth/logout` con Bearer válido → **200**
- [ ] Después de logout: `POST /auth/refresh` con el mismo refresh_token → **401**
- [ ] `POST /auth/logout` sin Bearer → **401**

---

### US-005: Historial y pendientes de Rides

**Descripción:** Como usuario, quiero acceder a mi historial de viajes. Como chofer, quiero ver los viajes pendientes.

**Criterios de Aceptación:**

- [ ] `GET /rides/history` sin token → **401**
- [ ] `GET /rides/history` con token CLIENTE → **200** con `{ data: Array }`
- [ ] `GET /rides/pending` con token CLIENTE → **403**
- [ ] `GET /rides/pending` con token CHOFER → **200** con Array

---

### US-006: Flujo Completo de Viaje via WebSocket

**Descripción:** Como cliente y chofer, queremos completar un viaje de principio a fin a través de WebSocket.

**Criterios de Aceptación:**

- [ ] `request_ride` → chofer recibe evento `new_ride_request` con `status: PENDING`
- [ ] `send_offer` → cliente recibe `new_offer` con `precio: 1500`
- [ ] `accept_offer` → cliente recibe `ride_matched` con `status: MATCHED`
- [ ] `driver_arrived` → cliente recibe `driver_at_location` con `ride.status: AT_LOCATION`
- [ ] `start_ride` → cliente recibe `ride_started` con `status: IN_PROGRESS`
- [ ] `finish_ride` → cliente recibe `ride_completed` con `status: COMPLETED`
- [ ] Historial del cliente muestra el viaje con `status: COMPLETED`

## 5. Non-Goals (Out of Scope)

- No testear rate limiting (requeriría > 5 requests en 1 min — peligroso en dev)
- No testear IsVerifiedGuard (requiere datos complejos de DriverDocument)
- No testear IsPremiumGuard (está cubierto en el flujo de stats)
- No testear push notifications (requieren dispositivo físico)

## 6. Consideraciones Técnicas

- **Ubicación**: `backend/test/auth.critical.e2e-spec.ts` y `backend/test/rides.critical.e2e-spec.ts`
- **Config Jest**: `backend/test/jest-critical.json` con `rootDir: ".."` (backend/) para resolver `node_modules`
- **Script**: `package.json` script `"test:critical": "jest --config ./test/jest-critical.json --runInBand"`
- **Sockets**: usar `socket.io-client` (ya instalado como devDependency)
- **Puerto**: `app.listen(0)` para puerto aleatorio — necesario para WebSocket tests
- **Cleanup**: `prisma.user.deleteMany({ where: { username: { startsWith: 'test_' } } })` en `afterAll`
- **Timestamps**: sufijo `_${Date.now()}` en usernames para evitar colisiones entre ejecuciones
