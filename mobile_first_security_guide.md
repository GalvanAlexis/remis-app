# Seguridad Técnica — Arquitectura Mobile-First

Documento técnico para IDE. Define **medidas de seguridad obligatorias** en una API mobile-first basada en NestJS, TypeScript y autenticación por tokens.

---

## Principios de seguridad

- El cliente **no es confiable** (mobile/web).
- La API es **pública por diseño**.
- Seguridad explícita > seguridad implícita.
- Mínimo privilegio en todos los niveles.
- Fallar de forma segura (secure by default).

---

## Autenticación

### Modelo obligatorio
- Autenticación **stateless**.
- Access Token (JWT) de corta duración.
- Refresh Token de larga duración.
- No usar sesiones server-side.
- No usar cookies para mobile.

### Reglas técnicas
- Access Token: 5–15 minutos.
- Refresh Token: 7–30 días.
- Refresh Token **almacenado en Redis**.
- Logout invalida refresh token.
- Rotación de refresh token en cada uso.

---

## JWT — Reglas estrictas

- Firmar con algoritmo seguro (HS256 o RS256).
- Claves en variables de entorno.
- Nunca guardar datos sensibles en el payload.
- Validar expiración y firma en cada request.
- Scope y roles dentro del token.

---

## Almacenamiento de credenciales

### Passwords
- Hash obligatorio con Argon2 o bcrypt.
- Nunca almacenar passwords en texto plano.
- Comparación constante (timing safe).

### Tokens
- Mobile: Secure Storage / Keychain.
- Web: memoria o almacenamiento seguro.
- Nunca LocalStorage para tokens críticos.

---

## Autorización

### Modelo
- Role-Based Access Control (RBAC).
- Guards por endpoint.
- Policies para reglas de negocio.

### Reglas
- Verificar permisos en backend siempre.
- No confiar en validaciones del frontend.
- Separar autenticación de autorización.

---

## Validación de datos

- Validación server-side obligatoria.
- DTOs estrictos.
- Rechazar campos desconocidos.
- Sanitizar inputs.
- Limitar tamaños de payload.

---

## Rate Limiting

- Rate limit global.
- Rate limit por IP.
- Rate limit por usuario autenticado.
- Endpoints críticos con límites más bajos.

---

## Protección contra ataques comunes

### Fuerza bruta
- Rate limit en login.
- Bloqueo temporal tras intentos fallidos.

### Injection
- ORM con queries parametrizadas.
- Nunca interpolar SQL.

### Replay attacks
- Tokens cortos.
- Rotación de refresh tokens.

---

## CORS

- Orígenes permitidos explícitos.
- No usar wildcard en producción.
- Métodos y headers limitados.

---

## HTTPS

- HTTPS obligatorio.
- Rechazar tráfico HTTP.
- Certificados gestionados por proveedor.

---

## Logs y monitoreo

- Logs estructurados.
- No loggear datos sensibles.
- Auditoría de accesos críticos.
- Alertas ante patrones sospechosos.

---

## Manejo de errores

- Errores genéricos al cliente.
- Detalles solo en logs internos.
- Nunca exponer stack traces.

---

## Versionado y breaking changes

- Versionar API (/api/v1).
- Nunca romper contratos existentes.
- Deprecar antes de eliminar.

---

## Infraestructura

- Variables de entorno seguras.
- Secrets fuera del repositorio.
- Backups automáticos de DB.
- Accesos mínimos a servicios.

---

## Checklist obligatorio antes de producción

- [ ] HTTPS activo
- [ ] JWT expiración correcta
- [ ] Refresh token rotación
- [ ] Rate limiting activo
- [ ] Logs sin datos sensibles
- [ ] Validaciones server-side
- [ ] CORS configurado
- [ ] Secrets protegidos

---

## Instrucción final para el IDE

> Implementar todas estas medidas de seguridad de forma estricta en el backend. No omitir controles. Priorizar seguridad mobile-first, autenticación por tokens y arquitectura stateless. Cumplir clean architecture y buenas prácticas enterprise.

