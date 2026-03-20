# OpenSpec: Sistema de Calificación Bilateral (US-R01)

## 1. Visión General
El objetivo es implementar un sistema de confianza mutua donde tanto el **Cliente** como el **Chofer** puedan calificarse tras finalizar un viaje. Esto fomenta la seguridad y la calidad del servicio en la plataforma Remis.

## 2. Definición Técnica de la Verdad (SDD)

### 2.1 Modelo de Datos (Prisma)
Se requiere una migración del modelo `Rating` para permitir la bilateralidad:

```prisma
model Rating {
  id          String      @id @default(uuid())
  rideId      String      // Quitamos @unique para permitir 2 entradas (uno de cada parte)
  ride        RideRequest @relation(fields: [rideId], references: [id])

  fromUserId  String      // ID de quien califica
  fromUser    User        @relation("RaterRatings", fields: [fromUserId], references: [id])

  toUserId    String      // ID del calificado
  toUser      User        @relation("RateeRatings", fields: [toUserId], references: [id])

  score       Int         // 1 a 5 estrellas
  comment     String?     // Feedabck opcional
  createdAt   DateTime    @default(now())

  @@unique([rideId, fromUserId]) // Un usuario solo puede calificar una vez cada viaje
  @@map("ratings")
}
```

### 2.2 Lógica de Negocio (Backend)
- **Activación**: Solo se permite calificar viajes con `status: COMPLETED`.
- **Visibilidad Diferida (Prevención de Represalias)**:
  - Una calificación recibida **no será visible** para el destinatario hasta que:
    1. El destinatario también haya calificado el viaje.
    2. O hayan pasado 48 horas desde la finalización del viaje.
- **Cálculo de Reputación**: El promedio de calificación de un usuario debe recalcularse (o consultarse dinámicamente) filtrando solo aquellas calificaciones que ya cumplieron el criterio de visibilidad.

### 2.3 Experiencia de Usuario (Frontend Mobile)
- **Trigger**: Al detectar el cambio de estado a `COMPLETED` (vía WebSocket), se despliega un Modal de Calificación.
- **Micro-interacciones**: Animación de estrellas al seleccionar (escala 1.2x).
- **Accesibilidad (45+ Friendly)**:
  - Estrellas con área de toque mínima de **48x48px**.
  - Texto de contraste alto (mínimo WCAG AA).
  - Feedback visual claro de "Enviado con éxito".

## 3. Requisitos No Funcionales
- **Performance**: El guardado de calificaciones no debe bloquear el flujo de inicio de un nuevo viaje para el chofer.
- **Integridad**: Validar que `fromUserId` y `toUserId` pertenezcan efectivamente al `rideId` referenciado.

## 4. Próxima Implementación Recomendada
1. Migración Prisma y actualización del cliente Prisma.
2. Refactor de `rides.service.ts` (`rateRide`).
3. Creación del componente `RatingStars.tsx` en mobile.
