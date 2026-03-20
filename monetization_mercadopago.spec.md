# OpenSpec: Monetización y suscripciones vía Mercado Pago

## 1. Visión General
Este sistema permite a los choferes acceder a beneficios "Premium" (prioridad en viajes, menores comisiones, etc.) mediante una suscripción mensual procesada por **Mercado Pago**. Se prioriza la simplicidad y seguridad usando **Checkout Pro**.

## 2. Definición Técnica (SDD)

### 2.1 Modelo de Datos (Prisma)
Se utilizarán los campos existentes en `DriverDocument` y se agregará un modelo de registro de pagos:

```prisma
// En DriverDocument (Existente)
// isPremium    Boolean   @default(false)
// premiumUntil DateTime?

model Payment {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  mpPaymentId       String   @unique // ID devuelto por Mercado Pago
  amount            Float
  status            String   // approved, pending, rejected
  externalReference String   // UUID generado internamente para tracking
  createdAt         DateTime @default(now())

  @@map("payments")
}
```

### 2.2 Flujo de suscripción
1. **Solicitud de Pago (Backend):** El chofer solicita suscribirse. El backend genera una `preference` en Mercado Pago con una `external_reference` única.
2. **Checkout (Mobile):** La app recibe el `init_point` y lo abre en el navegador del dispositivo (`Linking.openURL`).
3. **Notificación (Webhook):** Mercado Pago envía un POST al endpoint `/api/payments/webhook`.
4. **Validación:** El backend valida la firma del webhook, consulta el estado del pago en la API de MP.
5. **Activación:** 
   - Si el pago es `approved`:
     - Se actualiza `isPremium = true` en `DriverDocument`.
     - Se extiende `premiumUntil` (+30 días desde la fecha actual).
     - Se registra el `Payment`.

### 2.3 Seguridad y Sandbox
- **Ambiente:** Uso de `PROD_ACCESS_TOKEN` para producción y `TEST_ACCESS_TOKEN` para desarrollo.
- **Webhooks:** Implementación de validación HMAC para asegurar que la petición provenga de Mercado Pago.

## 3. UX/UI 45+ Friendly
- **Claridad:** Pantalla con beneficios claros en lista (Checkmarks grandes).
- **Confianza:** Uso de logos oficiales de Mercado Pago.
- **Sin Fricción:** No se piden datos de tarjeta dentro de la app; se delega todo al portal de Mercado Pago que el usuario ya conoce.

## 4. Tareas de Mantenimiento
- **CRON Job:** Un proceso diario revisará los `premiumUntil`. Si la fecha es < hoy, se setea `isPremium = false`.
