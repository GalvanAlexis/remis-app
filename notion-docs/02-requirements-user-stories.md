# 🎯 REMIS APP - Requirements & User Stories

## Roles de Usuario

### 👤 Cliente (Usuario Final)

Usuario que necesita transporte local. Puede ser registrado o invitado (guest).

### 🚗 Chofer (Conductor)

Conductor profesional con vehículo habilitado para transporte de pasajeros.

---

## User Stories - Cliente

### US-C01: Solicitar viaje como invitado

**Como** cliente no registrado  
**Quiero** solicitar un viaje ingresando origen y destino  
**Para** obtener transporte sin necesidad de crear una cuenta

**Criterios de aceptación:**

- Puedo ingresar dirección de origen (texto + número)
- Puedo ingresar dirección de destino (texto + número)
- El sistema envía mi solicitud a choferes online disponibles
- **Limitación**: Solo 10 solicitudes por hora para usuarios no registrados

### US-C02: Registrarse como cliente

**Como** usuario  
**Quiero** registrarme con mis datos personales  
**Para** acceder a beneficios adicionales y mayor información de los choferes

**Datos requeridos:**

- Apellido
- Nombre
- DNI
- Dirección
- Teléfono
- Email
- Contraseña

**Criterios de aceptación:**

- El sistema valida que el email no esté registrado
- El sistema valida formato de DNI
- La contraseña debe tener mínimo 8 caracteres
- Recibo confirmación de registro exitoso

### US-C03: Ver ofertas de choferes

**Como** cliente  
**Quiero** ver una lista de ofertas de choferes disponibles  
**Para** elegir la mejor opción según precio y tiempo

**Información visible:**

- Foto del chofer
- Nombre del chofer
- Rating promedio
- Cantidad de viajes completados
- Tiempo estimado de llegada
- Precio cotizado
- (Solo registrados) Datos completos: DNI, patente, teléfono

**Criterios de aceptación:**

- Las ofertas se actualizan en tiempo real (WebSocket)
- Puedo ordenar por precio o por tiempo
- Puedo filtrar por rating mínimo
- Veo badge "Cliente Preferencial" si el chofer acepta solo registrados

### US-C04: Aceptar oferta de chofer

**Como** cliente  
**Quiero** seleccionar y confirmar una oferta  
**Para** asegurar mi viaje con el chofer elegido

**Criterios de aceptación:**

- Al tocar "Aceptar" veo modal de confirmación
- El modal muestra resumen: origen, destino, precio, chofer
- Al confirmar, el viaje cambia a estado "Matched"
- Recibo notificación push de confirmación
- Las demás ofertas se descartan automáticamente
- Veo pantalla de "Viaje Confirmado" con datos del chofer

### US-C05: Seguir viaje en curso

**Como** cliente  
**Quiero** ver el estado actual del viaje  
**Para** saber cuándo llegará el chofer y seguir el trayecto

**Criterios de aceptación:**

- Veo ubicación en tiempo real del chofer en el mapa
- Veo tiempo estimado de llegada actualizado
- Recibo notificación cuando el chofer está cerca (2 min)
- Veo botón "Contactar chofer" (llamada telefónica)
- Puedo cancelar el viaje (solo antes de que inicie)

### US-C06: Calificar chofer post-viaje

**Como** cliente  
**Quiero** puntuar y comentar sobre el servicio  
**Para** ayudar a otros usuarios y al chofer a mejorar

**Criterios de aceptación:**

- Al finalizar viaje, recibo prompt para calificar
- Puedo calificar de 1 a 5 estrellas
- Puedo agregar comentario opcional
- La calificación es obligatoria para ver mi historial
- No puedo modificar la calificación después de enviarla

### US-C07: Ver historial de viajes

**Como** cliente registrado  
**Quiero** ver mis viajes anteriores  
**Para** consultar detalles de servicios pasados

**Criterios de aceptación:**

- Veo lista de viajes ordenados por fecha (más reciente primero)
- Cada viaje muestra: fecha, origen, destino, chofer, precio, rating
- Puedo filtrar por rango de fechas
- Puedo buscar por nombre de chofer
- La paginación carga 20 viajes a la vez

---

## User Stories - Chofer

### US-D01: Registrarse como chofer

**Como** conductor con habilitaciones  
**Quiero** registrarme con mi documentación  
**Para** ofrecer servicios de transporte en la plataforma

**Datos requeridos:**

- Datos personales (nombre, apellido, DNI, teléfono, email)
- Foto de DNI (frente y dorso)
- Foto de Licencia de Conducir
- Foto de Cédula Verde/Azul del vehículo
- Foto de Habilitaciones de transporte
- Cantidad máxima de pasajeros
- Marca, modelo y patente del vehículo
- Foto del vehículo

**Criterios de aceptación:**

- El sistema valida formato de imágenes (JPG, PNG)
- El sistema valida tamaño máximo (5MB por archivo)
- Recibo confirmación de "Documentación en revisión"
- No puedo activarme como chofer hasta aprobación
- Recibo notificación push cuando mi cuenta es aprobada/rechazada

### US-D02: Activar/desactivar disponibilidad

**Como** chofer verificado  
**Quiero** tener un toggle ON/OFF  
**Para** controlar cuándo recibo solicitudes de viaje

**Criterios de aceptación:**

- El switch es visible y accesible en la pantalla principal
- Al activar (ON), el sistema me marca como disponible y comienzo a recibir solicitudes
- Al desactivar (OFF), dejo de recibir solicitudes

### US-D03: Configurar preferencias de clientes

**Como** chofer  
**Quiero** elegir si acepto clientes no registrados  
**Para** reducir riesgos en horarios o zonas complicadas

**Criterios de aceptación:**

- Veo switch "Aceptar clientes sin registro"
- Por defecto está activado (acepto todos)
- Cuando desactivo, solo recibo solicitudes de usuarios registrados
- El filtro se aplica en el backend (no confiar en frontend)

### US-D04: Recibir solicitudes de viaje

**Como** chofer online  
**Quiero** recibir notificaciones de solicitudes cercanas  
**Para** ofertar mis servicios

**Información visible:**

- Origen del viaje (dirección)
- Destino del viaje (dirección)
- Si el cliente está registrado (badge)
- (Si cliente registrado y lo solicita) Datos del cliente

**Criterios de aceptación:**

- Recibo notificación push + sonido
- Veo card con la información en lista
- Puedo ver múltiples solicitudes simultáneas
- Tengo 3 minutos para ofertar antes de que expire

### US-D05: Ofertar precio y tiempo

**Como** chofer  
**Quiero** enviar una oferta con mi precio y tiempo estimado  
**Para** competir por el viaje

**Criterios de aceptación:**

- Toco en la card de solicitud
- Veo modal con formulario de oferta
- Ingreso tiempo estimado de llegada (minutos)
- Ingreso precio del viaje ($)
- El sistema calcula distancia automáticamente
- Al enviar, la oferta llega en tiempo real al cliente
- Puedo enviar ofertas a múltiples solicitudes

### US-D06: Recibir confirmación de viaje

**Como** chofer  
**Quiero** recibir notificación cuando un cliente acepta mi oferta  
**Para** comenzar el servicio

**Criterios de aceptación:**

- Recibo notificación push inmediata
- Mi estado cambia automáticamente a OFF (no disponible)
- Veo pantalla de "Viaje Confirmado"
- Veo datos completos del cliente (si está registrado)
- Veo botón "Iniciar viaje"
- Veo botón "Contactar cliente"

### US-D07: Gestionar viaje activo

**Como** chofer  
**Quiero** controlar los estados del viaje  
**Para** mantener actualizado al cliente

**Estados del viaje:**

1. **Matched**: Viaje confirmado, yendo hacia el origen
2. **In Progress**: Cliente a bordo, en trayecto al destino
3. **Completed**: Viaje finalizado

**Criterios de aceptación:**

- Toco "Iniciar viaje" cuando recojo al cliente → estado "In Progress"
- Toco "Finalizar viaje" al llegar al destino → estado "Completed"
- El cliente recibe notificación en cada cambio de estado
- Al finalizar, mi estado vuelve a OFF (debo reactivarme manualmente)

### US-D08: Calificar cliente post-viaje

**Como** chofer  
**Quiero** puntuar al cliente  
**Para** construir un sistema de confianza mutua

**Criterios de aceptación:**

- Al finalizar viaje, recibo prompt para calificar
- Puedo calificar de 1 a 5 estrellas
- Puedo agregar comentario opcional
- La calificación es opcional
- Los clientes no registrados no pueden ser calificados
- Veo rating promedio del cliente antes de ofertar (si tiene)

### US-D09: Ver estadísticas personales

**Como** chofer  
**Quiero** ver mis métricas  
**Para** monitorear mi desempeño

**Métricas visibles:**

- Rating promedio
- Total de viajes completados
- Total de ingresos (suma de precios)
- Viajes hoy / semana / mes
- Mejores horarios (más viajes)

**Criterios de aceptación:**

- Veo dashboard en mi perfil
- Los datos se actualizan en tiempo real
- Puedo ver desglose por período (día, semana, mes)

---

## User Stories - Sistema

### US-S01: Distribución de solicitudes

**Como** sistema  
**Quiero** enviar solicitudes a todos los choferes disponibles  
**Para** maximizar la probabilidad de conseguir un viaje

**Criterios de aceptación:**

- Filtro por estado online=true
- Filtro por preferencia de cliente (registrado/no registrado)
- Se emite la solicitud vía WebSocket a todos los choferes que cumplan los filtros

### US-S02: Rate limiting

**Como** sistema  
**Quiero** limitar peticiones por usuario  
**Para** prevenir abuso y garantizar disponibilidad

**Límites:**

- Global: 100 req/min por IP
- Auth: 5 req/min por IP
- Ride requests (no registrados): 10 req/hour
- Ride requests (registrados): ilimitado
- Offers: 30 req/hour por chofer

### US-S03: Limpieza automática

**Como** sistema  
**Quiero** limpiar solicitudes huérfanas  
**Para** mantener la base de datos optimizada

**Criterios de aceptación:**

- Job cron ejecuta cada 5 minutos
- Cancela rides en estado PENDING con más de 10 minutos
- Cancela offers en estado PENDING con más de 5 minutos
- Envía notificación al cliente si su solicitud expiró

---

## Flujos Completos

### Flujo 1: Cliente Invitado solicita viaje

```
1. Cliente abre app (sin login)
2. Toca botón "Solicitar Viaje"
3. Ingresa origen y destino
4. Toca "Buscar Choferes"
5. Sistema busca choferes online cercanos (10km)
6. Sistema emite evento Socket "new_ride_request" a choferes filtrados
7. Choferes reciben notificación push
8. Chofer1 envía oferta: $500, 5 min
9. Chofer2 envía oferta: $450, 8 min
10. Cliente ve ambas ofertas en tiempo real
11. Cliente selecciona oferta de Chofer2
12. Sistema confirma viaje, cambia estado a MATCHED
13. Sistema emite evento "offer_accepted" a Chofer2
14. Chofer2 recibe notificación y pasa a OFF automáticamente
15. Cliente ve pantalla "Viaje Confirmado"
```

### Flujo 2: Chofer completa viaje y califica

```
1. Chofer tiene viaje confirmado
2. Llega al origen y toca "Iniciar Viaje"
3. Estado cambia a IN_PROGRESS
4. Cliente recibe notificación "Tu viaje ha comenzado"
5. Chofer conduce al destino
6. Al llegar, toca "Finalizar Viaje"
7. Estado cambia a COMPLETED
8. Ambos reciben prompt para calificar
9. Cliente califica 5 estrellas + "Excelente servicio"
10. Chofer califica 5 estrellas + "Cliente puntual"
11. Ratings se guardan en DB
12. Se actualizan ratings promedio de ambos usuarios
13. Chofer vuelve a estado OFF (puede reactivarse)
```

---

## Reglas de Negocio

### RN-01: Verificación de choferes

- Todo chofer debe tener documentación aprobada antes de activarse
- El estado de verificación es: PENDING → APPROVED/REJECTED
- Choferes rechazados pueden apelar (futuro backoffice)

### RN-02: Cancelaciones

- Cliente puede cancelar mientras estado = MATCHED
- Chofer NO puede cancelar después de aceptar (penalización futura)
- Cancelaciones automáticas por timeout (10 min sin ofertas)

### RN-03: Ratings

- Solo usuarios participantes del viaje pueden calificar
- Ratings van de 1 a 5 estrellas (enteros)
- Rating promedio se calcula automáticamente
- Los ratings son públicos

### RN-04: Privacidad

- Clientes no registrados solo ven: nombre, foto, rating del chofer
- Clientes registrados ven: todo lo anterior + DNI, patente, teléfono
- Choferes ven datos completos solo de clientes registrados

### RN-05: Restricciones de solicitudes

- Si no hay choferes online disponibles, cliente ve mensaje "Sin choferes disponibles"
- El sistema no permite solicitudes con origen/destino idénticos
