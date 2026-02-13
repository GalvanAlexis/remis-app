# Arquitectura Mobile-First — Prompt Técnico para IDE

## Objetivo
Construir un **producto mobile-first real**, escalable y profesional, basado en una arquitectura **API-first**, con frontend desacoplado y foco prioritario en aplicaciones móviles.

El IDE debe generar código siguiendo **buenas prácticas enterprise**, clean architecture y TypeScript estricto.

---

## Principios no negociables
- Mobile es el cliente principal.
- Backend 100% API-first.
- Frontend desacoplado (mobile y web consumen la misma API).
- Nada de render server-side.
- Contratos API estables y versionados.
- Escalabilidad y mantenibilidad como prioridad.

---

## Stack tecnológico obligatorio

### Backend
- Node.js
- TypeScript (strict)
- NestJS
- PostgreSQL
- Prisma ORM
- Redis (cache + tokens)
- JWT + Refresh Tokens
- Arquitectura modular

### Mobile
- React Native
- Expo
- TypeScript
- TanStack Query (React Query)
- Zustand o Redux Toolkit
- Secure Storage para tokens

### Web
- React
- Vite o Next.js
- TypeScript
- Responsive design
- PWA opcional

### Infraestructura
- Docker
- CI/CD
- Logs estructurados
- Variables de entorno

---

## Arquitectura de alto nivel

Mobile App (React Native / Expo)
        ↓
API Layer (NestJS REST / GraphQL)
        ↓
Business Core (Domain + Use Cases)
        ↓
Data Layer (PostgreSQL / Redis)

Web App (React) consume la misma API.

---

## Backend — Reglas estrictas

### Estructura del proyecto
```
src/
 ├── auth/
 ├── users/
 ├── content/
 ├── subscriptions/
 ├── common/
 │    ├── guards/
 │    ├── interceptors/
 │    ├── filters/
 │    └── dto/
 ├── prisma/
 └── main.ts
```

- Controladores sin lógica de negocio.
- Services contienen los casos de uso.
- DTOs para entrada y salida.
- Validación server-side obligatoria.

---

## API Design

### Reglas
- Versionado obligatorio: `/api/v1`
- Respuestas normalizadas
- Paginación en todos los listados
- Manejo centralizado de errores

### Formato de respuesta
```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

---

## Autenticación (Mobile-Oriented)

- Access Token de corta duración
- Refresh Token persistente
- Refresh token almacenado en Redis
- Tokens guardados en Secure Storage (mobile)
- Logout invalida refresh token
- Nada de sesiones server-side

---

## Mobile App — Lineamientos

### Estructura
```
app/
 ├── screens/
 ├── components/
 ├── hooks/
 ├── services/   // consumo API
 ├── store/
 ├── utils/
 └── constants/
```

### Reglas
- Toda comunicación vía API
- Estado remoto con React Query
- Estado local/global con Zustand o Redux Toolkit
- Manejo de errores consistente
- Preparado para offline-first

---

## Web App — Lineamientos

- Consume exactamente la misma API
- No contiene lógica de negocio
- Responsive first
- La web es cliente secundario

---

## Performance y escalabilidad

- Redis para cacheo
- Lazy loading
- Indexación correcta en DB
- Evitar N+1 queries
- Logs estructurados

---

## Deploy — MVP

- Backend: Railway / Render
- Base de datos: PostgreSQL managed
- Mobile: Expo EAS
- Web: Vercel

Preparado para migrar a infraestructura escalable.

---

## Resultado esperado

- Código limpio y modular
- Repositorio profesional
- Base sólida para apps reales
- Arquitectura alineada a productos mobile-first

---

## Instrucción final para el IDE

> Generá el proyecto completo siguiendo esta arquitectura, respetando el stack indicado, aplicando buenas prácticas enterprise, clean architecture y TypeScript estricto. No introducir frameworks ni patrones fuera de los definidos en este documento.

