# Tests de Riesgo Medio — Remis App Backend: OpenSpec

## 1. Introducción

Habiendo asegurado el funcionamiento de las rutas Críticas (Riesgo Alto: Auth y WebSockets) mediante `critical-tests.spec.md`, este conjunto de pruebas (_Medium Risk_) está orientado a estabilizar las **Entidades Secundarias**, **Lógica de Negocio Unitaria** y **Guardias de Seguridad (RBAC y Estados)**.

Estos tests mezclarán **Unit Tests** puros (para lógica aislada, ej. cálculos) e **Integration Tests** (para endpoints CRUD secundarios).

## 2. Metas (Goals)

- Garantizar que los perfiles y documentos de los choferes y clientes operen correctamente.
- Verificar exhaustivamente los Guards de acceso (`Roles`, `IsVerified`, `IsPremium`).
- Probar funciones unitarias clave (ej: Cálculo de tiempos/precios, validación de DNI).
- Aislar la base de datos de los Unit Tests usando Mocks, y usar DB Real o en memoria para Integration Tests.

## 3. Bloques de Testing (Historias de Usuario / Features)

### US-007: Perfiles de Usuario (Integration)

**Descripción:** Los usuarios deben poder gestionar sus datos personales.

**Criterios de Aceptación:**

- [ ] `GET /profile` → Devuelve datos del perfil asociados al JWT.
- [ ] `PATCH /profile` → Actualiza nombre, apellido o avatar correctamente y devuelve 200.
- [ ] `PATCH /profile` con datos inválidos (ej. teléfono alfanumérico) → Devuelve 400.

---

### US-008: Documentos del Chofer y Verificación (Integration)

**Descripción:** El administrador o el flujo automático necesita validar los documentos (DNI, Licencia, Seguro) del chofer para cambiar su estado a VERIFIED.

**Criterios de Aceptación:**

- [ ] `POST /driver-documents` (upload) → 201 Created (Mockeando el servicio de S3/Cloudinary si aplica).
- [ ] `GET /driver-documents/status` → Devuelve el estado de revisión.
- [ ] `PATCH /admin/users/:id/verify` (Admin Only) → Cambia el estado a VERIFICADO y permite al chofer ofertar viajes (vía Guard).
- [ ] _Guard Check_: Chofer NO verificado intenta `patch /drivers/status` (online) → 403 Forbidden.

---

### US-009: Sistema de Reseñas y Ratings (Integration)

**Descripción:** Clientes y Choferes se califican mutuamente para mantener la calidad de la plataforma.

**Criterios de Aceptación:**

- [ ] `POST /ratings` → Cliente califica Chofer con 5 estrellas, 201 Created.
- [ ] _Cálculo automático_: Al crear un rating, el promedio del chofer en su `Profile` debe actualizarse.
- [ ] `POST /ratings` → Intentar calificar un viaje no terminado o que no te pertenece → 403 Forbidden.
- [ ] `GET /ratings/driver/:id` → Lista paginada de reseñas del chofer.

---

### US-010: Lógica de Negocio Interna (Unit Tests - Aislados)

**Descripción:** Probar servicios y utilidades sin requerir base de datos (Jest standard).

**Criterios de Aceptación:**

- [ ] `AuthService.hashPassword()` → Produce un hash bcrypt válido y diferente a la contraseña original.
- [ ] `RidesService.calculateEstimatedPrice()` (si existe) → Dados KM y tiempo, devuelve un monto esperado dentro de rangos paramétricos.
- [ ] `JwtStrategy.validate()` → Retorna el payload validado o lanza UnauthorizedException si expiró.

## 4. Quality Gates y Ejecución

```bash
# Tests de integración medios
npm run test:medium

# Tests unitarios puros
npm run test:unit
```

## 5. Consideraciones Técnicas

- **Ubicación:** `backend/test/medium.e2e-spec.ts` (Integración) y `backend/src/**/*.spec.ts` (Unitarios).
- **Mocks:** Para subida de archivos (multer/AWS) y envío de notificaciones (Mail/Push).
- **Setup E2E:** Usar una config similar a `jest-critical.json`, pero bajo el nombre `jest-medium.json`.
