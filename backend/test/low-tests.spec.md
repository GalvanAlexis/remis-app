# Tests de Riesgo Bajo — Remis App Backend: OpenSpec

## 1. Introducción

Con los bloques **Crítico** (Auth + Rides WebSocket) y **Medio** (Perfiles, Documentos, Ratings, Guards)
completados y al 100%, el bloque **Low Risk** se enfoca en los módulos de soporte y analítica:

- **Stats** — Endpoints de estadísticas del chofer (free & premium), con `IsPremiumGuard`.
- **Notifications** — Registro y validación del Expo Push Token.
- **Unit Tests de StatsService** — Funciones helpers aisladas con mocks.

Estos módulos tienen bajo riesgo de negocio porque no afectan el flujo de viaje principal,
pero deben estar cubiertos para garantizar la integridad de la plataforma.

---

## 2. Metas (Goals)

- Verificar que `GET /stats/free` devuelva datos correctos para un chofer con historial.
- Verificar que `GET /stats/history` implemente paginación por cursor correctamente.
- Verificar que `GET /stats/premium` exija `isPremium: true` vía `IsPremiumGuard`.
- Verificar que `POST /notifications/register-token` valide el formato Expo Push Token.
- Unit-testear los helpers de `StatsService` (`groupEarningsByDay`, `topNByFrequency`).

---

## 3. Bloques de Testing

### US-011: Estadísticas del Chofer — Free (Integration)

**Descripción:** El chofer accede a sus estadísticas básicas.

**Criterios de Aceptación:**

- [ ] `GET /stats/free` → Devuelve `{ totalRides, earningsThisMonth, avgRating, history }` — 200 OK.
- [ ] `GET /stats/free` sin token → 401 Unauthorized.
- [ ] `GET /stats/free` con token de CLIENTE → 403 Forbidden (RolesGuard).
- [ ] `GET /stats/history` → Devuelve `{ items, hasMore, nextCursor }` — 200 OK.
- [ ] `GET /stats/history?take=1` → Devuelve máximo 1 item con `hasMore: true` si hay más de 1 viaje.

---

### US-012: Estadísticas Premium — Guard IsPremium (Integration)

**Descripción:** Solo los choferes con `isPremium: true` pueden acceder al análisis avanzado.

**Criterios de Aceptación:**

- [ ] `GET /stats/premium` con chofer sin premium → 403 Forbidden.
- [ ] `GET /stats/premium` con chofer con `isPremium: true` → 200 OK con campos `earningsByDay`, `topZones`, etc.

---

### US-013: Registro de Expo Push Token (Integration)

**Descripción:** La app mobile registra el dispositivo para recibir notificaciones push.

**Criterios de Aceptación:**

- [ ] `POST /notifications/register-token` con token válido `ExponentPushToken[xxx]` → `{ success: true }` 200/201.
- [ ] `POST /notifications/register-token` sin token → 400 Bad Request.
- [ ] `POST /notifications/register-token` con formato inválido (no ExponentPushToken/ExpoPushToken) → 400.
- [ ] `POST /notifications/register-token` sin autenticar → 401.

---

### US-014: Unit Tests de StatsService (Unit — Aislados)

**Descripción:** Probar los helpers privados del servicio con datos mockeados.

**Criterios de Aceptación:**

- [ ] `groupEarningsByDay()` → Agrupa correctamente viajes del mismo día y suma los montos.
- [ ] `topNByFrequency()` → Retorna el top N de ítems más frecuentes, ordenados.
- [ ] `getFreeStats()` devuelve `avgRating: null` cuando el chofer no tiene ratings.
- [ ] `getRideHistory()` con cursor implementa salto y devuelve el `nextCursor` correcto.

---

## 4. Quality Gates

```bash
# Suite Low Risk (Integration)
npm run test:low

# Unit Tests del StatsService
npm test -- --testPathPattern="stats.service.spec"
```

---

## 5. Consideraciones Técnicas

- **Ubicación E2E:** `backend/test/low.e2e-spec.ts`
- **Jest config:** `backend/test/jest-low.json` (igual a `jest-medium.json`, apuntando a `low.*.e2e-spec.ts`)
- **Unit Tests:** `backend/src/stats/stats.service.spec.ts`
- **Mocking:** `NotificationsService.saveToken` puede mockearse (no envía push real en tests).
- **Setup DB:** El `beforeAll` reutiliza el patron del bloque medium (cleanup + registro de usuarios test).
- **IsPremiumGuard:** Se activa/desactiva vía `prisma.driverDocument.update({ isPremium: true/false })`.
