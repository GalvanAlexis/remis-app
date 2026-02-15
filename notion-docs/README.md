# 📖 REMIS APP - Documentation Index

Bienvenido a la documentación completa del proyecto **REMIS APP**.

Esta carpeta contiene toda la planificación técnica y especificaciones necesarias para desarrollar la plataforma de transporte peer-to-peer.

---

## ⚡ Estado Actual y Configuración Local (2026-02-15)

El proyecto está **100% funcional** con la siguiente configuración:

### 🔌 Puertos y Servicios

- **Backend (NestJS):** Puerto `3000` (http://localhost:3000)
- **Mobile (Expo):** Puerto `8081` (exp://192.168.1.100:8081)
- **Base de Datos (PostgreSQL):** Puerto `5433` (Base de datos: `remis`)
- **WebSocket:** Integrado en puerto `3000` (Namespace: `/`)

### 🚀 Comandos de Inicio Rápido

**Terminal 1: Backend**

```bash
cd backend
npm run start:dev
```

**Terminal 2: Mobile**

```bash
cd mobile
npx expo start --clear
```

> **Nota:** Se cambió el puerto del backend a `3000` para evitar conflictos con servicios del sistema (Apache) en el puerto 8080.

---

## 📂 Estructura de Documentos

### 1. [Project Overview](./01-project-overview.md)

**Visión general del proyecto**

- Descripción del problema y solución
- Características principales (cliente y chofer)
- Stack tecnológico completo (React Native + NestJS)
- Timeline de 7 semanas (6 fases de desarrollo)
- Roadmap post-MVP

**Lee esto primero** para entender el alcance completo del proyecto.

---

### 2. [Requirements & User Stories](./02-requirements-user-stories.md)

**Requisitos funcionales y casos de uso**

- 9 User Stories de Cliente (US-C01 a US-C09)
- 9 User Stories de Chofer (US-D01 a US-D09)
- 3 User Stories de Sistema (US-S01 a US-S03)
- Flujos completos paso a paso
- Reglas de negocio

**Usa esto** para validar requisitos con stakeholders y diseñar pruebas de aceptación.

---

### 3. [Technical Architecture](./03-technical-architecture.md)

**Diseño técnico del sistema**

- Diagrama de arquitectura (Mermaid)
- Schema completo de base de datos (Prisma)
- 7 módulos del backend (Auth, Users, Geolocation, Rides, Offers, Ratings, Notifications)
- Flujos de comunicación real-time (Socket.io)
- Estrategia de seguridad y caching (Redis)

**Usa esto** durante la fase de implementación como referencia técnica.

---

### 4. [API Documentation](./04-api-documentation.md)

**Especificación completa de la API**

- 30+ endpoints REST documentados
- Request/Response examples
- WebSocket events (driver/client)
- Códigos de error
- Rate limits por endpoint

**Usa esto** para integrar el frontend con el backend y para pruebas de API.

---

### 5. [Frontend Specifications](./05-frontend-specifications.md)

**Diseño de pantallas y componentes**

- 11 pantallas principales con layouts
- Estructura de navegación (Expo Router)
- Componentes reutilizables
- Hooks personalizados (useAuth, useSocket, useLocation)
- Design tokens y tema

**Usa esto** para implementar la UI mobile y mantener consistencia visual.

---

### 6. [Security Checklist](./06-security-checklist.md)

**Medidas de seguridad obligatorias**

- Autenticación JWT (access + refresh tokens)
- Validación de inputs y rate limiting
- CORS, HTTPS, headers de seguridad
- Privacidad y GDPR compliance
- Checklist pre-producción (20+ items)

**Usa esto** antes de cada deploy para validar que no se omitieron controles de seguridad.

---

### 7. [Deployment Guide](./07-deployment-guide.md)

**Guía paso a paso de deployment**

- Setup de Railway (backend)
- Setup de EAS Expo (mobile)
- Configuración de PostgreSQL + PostGIS
- CI/CD con GitHub Actions
- Monitoreo con Sentry
- Estrategia de rollback

**Usa esto** para desplegar a producción y configurar infraestructura.

---

### 8. [Testing Strategy](./08-testing-strategy.md)

**Plan de pruebas completo**

- Unit tests (Jest) - 80%+ coverage
- Integration tests (Supertest)
- E2E tests (Detox)
- Performance tests (k6)
- Checklist pre-deploy

**Usa esto** para garantizar calidad y prevenir regresiones.

---

## 🚀 Cómo usar esta documentación

### Para Importar a Notion:

1. Crea una página principal en Notion llamada "REMIS APP"
2. Importa cada archivo `.md` como página hija
3. Mantén el orden numérico para navegación lógica
4. Crea enlaces cruzados entre documentos cuando sea relevante

### Para Desarrollo:

**Fase 1 (Setup & Arquitectura):**

- Lee [Technical Architecture](./03-technical-architecture.md)
- Sigue [Deployment Guide](./07-deployment-guide.md) para setup inicial

**Fase 2 (Autenticación):**

- Implementa según [API Documentation](./04-api-documentation.md) - Auth endpoints
- Valida con [Testing Strategy](./08-testing-strategy.md) - Auth tests

**Fase 3-5 (Features):**

- Consulta [Requirements](./02-requirements-user-stories.md) para user stories
- Implementa UI según [Frontend Specifications](./05-frontend-specifications.md)
- Implementa API según [API Documentation](./04-api-documentation.md)

**Fase 6 (Deploy):**

- Ejecuta [Security Checklist](./06-security-checklist.md)
- Sigue [Deployment Guide](./07-deployment-guide.md)
- Ejecuta [Testing Strategy](./08-testing-strategy.md) - Todas las pruebas

---

## 🛠️ Stack Tecnológico Rápido

### Frontend Mobile

```
React Native + Expo + TypeScript
TanStack Query + Zustand + Socket.io Client
Expo Location + Expo Notifications
```

### Backend

```
NestJS + TypeScript + Prisma ORM
PostgreSQL + PostGIS + Redis
Socket.io + Bull Queue + JWT
```

### Deployment

```
Railway (backend) + EAS (mobile)
GitHub Actions (CI/CD) + Sentry (monitoring)
```

---

## 📊 Métricas del Proyecto

- **Endpoints API**: 30+
- **Tablas DB**: 7
- **User Stories**: 21
- **Pantallas Mobile**: 11
- **Duración Estimada**: 7 semanas (MVP)
- **Cobertura de Tests**: 80%+

---

## 📞 Próximos Pasos

1. **Revisar** documentación completa
2. **Importar** a Notion para tracking
3. **Validar** requisitos con stakeholders
4. **Comenzar** Fase 1 - Setup & Arquitectura
5. **Seguir** task.md para tracking granular

---

## 📝 Notas Importantes

- Esta documentación está **viva**: actualízala según evolucione el proyecto
- Los diagramas Mermaid se renderizan automáticamente en Notion
- Todos los ejemplos de código están validados contra las guías de arquitectura del proyecto
- La estructura sigue principios de **clean architecture** y **mobile-first**

---

**¡Todo listo para comenzar el desarrollo! 🚀**
