# 📋 REMIS APP - Project Overview

## 🎯 Visión del Proyecto

**REMIS APP** es una plataforma mobile-first que conecta directamente a clientes y choferes de transporte local (remis) **sin intermediarios**. La comunicación es peer-to-peer, permitiendo a los usuarios solicitar viajes y a los choferes ofertar sus servicios en tiempo real.

### Problema que resuelve

- Elimina comisiones de plataformas intermediarias (Uber, Cabify)
- Permite a choferes locales competir directamente
- Da transparencia total en precios y tiempos
- Fomenta economía local sin dependencia de grandes corporaciones

### Usuarios objetivo

1. **Choferes locales** con vehículo habilitado para transporte de pasajeros
2. **Clientes** que necesitan transporte local confiable y económico

---

## ⚡ Características Principales

### Para Clientes

- ✅ **Registro opcional**: Pueden usar la app sin registrarse
- ✅ **Solicitud de viaje**: Ingresan origen y destino
- ✅ **Ofertas en tiempo real**: Ven múltiples ofertas de choferes cercanos
- ✅ **Datos completos**: Usuarios registrados ven información completa del chofer
- ✅ **Sistema de rating**: Pueden puntuar y comentar sobre el servicio
- ✅ **Historial**: Acceso a viajes anteriores

### Para Choferes

- ✅ **Registro verificado**: Con documentación obligatoria (DNI, licencia, habilitaciones)
- ✅ **Control total**: Toggle ON/OFF para disponibilidad
- ✅ **Filtro de clientes**: Pueden elegir aceptar solo clientes registrados
- ✅ **Ofertas flexibles**: Definen precio y tiempo estimado de llegada
- ✅ **Sistema de rating**: Construyen reputación con puntuaciones
- ✅ **Seguimiento**: Ubicación en tiempo real durante el servicio

---

## 🛠️ Stack Tecnológico

### Mobile (Cliente Principal)

```
- React Native (framework principal)
- Expo SDK 51+ (desarrollo y distribución)
- TypeScript (strict mode)
- Expo Router (navegación basada en archivos)
- TanStack Query v5 (gestión de estado del servidor)
- Zustand (gestión de estado del cliente)
- Socket.io Client (comunicación en tiempo real)
- Expo Location (geolocalización y GPS)
- Expo Notifications (notificaciones push)
- Expo SecureStore (almacenamiento seguro de tokens)
- React Native Maps (visualización de mapas)
```

### Backend (API-First)

```
- Node.js 20+
- NestJS 10+ (framework backend)
- TypeScript (strict mode)
- PostgreSQL 15+ (base de datos principal)
- PostGIS (extensión para datos geoespaciales)
- Prisma ORM (ORM type-safe)
- Redis 7+ (cache + almacenamiento de tokens)
- Socket.io (WebSocket para real-time)
- Bull Queue (procesamiento asíncrono)
- JWT (autenticación stateless)
- bcrypt (hashing de contraseñas)
```

### DevOps & Infraestructura

```
- Docker + Docker Compose (desarrollo local)
- GitHub Actions (CI/CD)
- Railway/Render (hosting backend)
- PostgreSQL managed service
- Redis managed service
- Expo EAS (build y distribución mobile)
- Sentry (monitoreo de errores)
```

---

## 🏗️ Arquitectura de Alto Nivel

```
┌─────────────────────────────────┐
│   Mobile App (React Native)     │
│  - Cliente Interface             │
│  - Chofer Interface              │
└───────────┬─────────────────────┘
            │
            │ REST API + WebSocket
            ▼
┌─────────────────────────────────┐
│   API Layer (NestJS)             │
│  - /api/v1/auth                  │
│  - /api/v1/rides                 │
│  - /api/v1/offers                │
│  - /api/v1/ratings               │
│  - Socket.io Gateway             │
└───────────┬─────────────────────┘
            │
            │ Business Logic
            ▼
┌─────────────────────────────────┐
│   Core Modules                   │
│  - Auth & Security               │
│  - Geolocation Service           │
│  - Matching Algorithm            │
│  - Notification Service          │
└───────────┬─────────────────────┘
            │
            │ Data Access
            ▼
┌──────────────┬──────────────────┐
│ PostgreSQL   │     Redis        │
│ + PostGIS    │   (Cache/Tokens) │
└──────────────┴──────────────────┘
```

---

## 📅 Timeline de Desarrollo (7 semanas)

### Fase 1: Setup & Arquitectura (2 semanas)

- Configuración de repositorios
- Setup backend (NestJS + Prisma + PostgreSQL)
- Setup frontend (Expo + navegación + state management)
- Docker Compose para desarrollo local
- CI/CD básico

### Fase 2: Autenticación & Perfiles (1 semana)

- Sistema de JWT (access + refresh tokens)
- Registro dual (Cliente/Chofer)
- Upload y verificación de documentos
- Perfiles de usuario
- Guards y autorización

### Fase 3: Geolocalización & Matching (1 semana)

- Integración PostGIS
- Tracking de ubicación en tiempo real
- Sistema de solicitudes de viaje
- Algoritmo de matching por cercanía
- Comunicación Socket.io

### Fase 4: Ofertas & Confirmaciones (1 semana)

- Sistema de ofertas del chofer
- Listado de ofertas para cliente
- Confirmación automática
- Estados del viaje (pending, matched, in-progress, completed)
- Notificaciones push

### Fase 5: Ratings & Mejoras (1 semana)

- Sistema de puntuación bidireccional
- Historial de viajes
- Optimizaciones de performance
- Refinamiento de UX

### Fase 6: Testing & Deploy (1 semana)

- Testing E2E
- Security audit
- Deploy a producción
- Monitoreo y logging

---

## 🎨 Principios de Diseño

### Mobile-First

- El desarrollo prioriza la experiencia móvil
- interfaz nativa y responsive
- Optimizada para conexiones inestables

### Real-Time

- Actualizaciones instantáneas de ofertas
- Tracking en vivo de choferes
- Notificaciones inmediatas

### Seguridad

- Autenticación stateless (JWT)
- Verificación obligatoria de choferes
- Rate limiting en todos los endpoints
- Encriptación de datos sensibles
- HTTPS obligatorio

### Escalabilidad

- Arquitectura modular
- Cache inteligente con Redis
- Queries optimizadas con índices
- Horizontal scaling preparado

---

## 🔒 Seguridad & Privacidad

### Para Choferes

- Verificación de documentación obligatoria
- Estado de verificación visible para clientes
- Datos completos visibles solo para clientes registrados

### Para Clientes

- Registro opcional para mayor privacidad
- Datos personales solo compartidos tras confirmación de viaje
- Sistema de reputación transparente

### Seguridad Técnica

- Access tokens de 15 minutos
- Refresh tokens de 7 días (rotación automática)
- Rate limiting agresivo en endpoints críticos
- Validación server-side de todas las entradas
- Sanitización de inputs

---

## 📊 Métricas de Éxito (Post-MVP)

- **Tiempo promedio de matching**: < 2 minutos
- **Tasa de confirmación de viajes**: > 80%
- **Rating promedio de choferes**: > 4.5/5
- **Retención de usuarios**: > 40% a 30 días
- **Disponibilidad del sistema**: > 99.5%

---

## 🚀 Roadmap Post-MVP

### V2 Features

- Viajes programados (reservas anticipadas)
- Pagos integrados (opcional)
- Chat in-app durante el viaje
- Modo viajes compartidos (carpooling)
- Panel administrativo web

### Expansión

- Soporte multi-ciudad
- Internacionalización (i18n)
- Web app como cliente secundario
- Integración con sistemas de pago locales
