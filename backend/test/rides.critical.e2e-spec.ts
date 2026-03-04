import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';

// socket.io-client: usar require para compatibilidad con nodenext moduleResolution
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const ioClient = require('socket.io-client');
const createSocket = (url: string, opts: Record<string, unknown>) =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  ioClient(url, opts) as {
    on: (ev: string, fn: (...a: any[]) => void) => void;
    once: (ev: string, fn: (...a: any[]) => void) => void;
    emit: (ev: string, data?: any) => void;
    disconnect: () => void;
  };

/**
 * Tests Críticos — Rides Flujo Completo (E2E)
 * Spec: test/critical-tests.spec.md → US-005 y US-006
 *
 * Quality Gate: npm run test:critical
 */
describe('Rides — Flujo Completo (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let serverAddress: string;

  const ts = Date.now();

  const clienteData = {
    username: `test_cli_rides_${ts}`,
    password: 'TestPass123!',
    nombre: 'Cliente',
    apellido: 'Test',
    dni: `${ts}`.slice(-8),
    role: 'CLIENTE',
  };

  const choferData = {
    username: `test_cho_rides_${ts}`,
    password: 'TestPass123!',
    nombre: 'Chofer',
    apellido: 'Test',
    dni: `${ts + 11}`.slice(-8),
    role: 'CHOFER',
    licenciaUrl: 'LIC1234',
    cedulaUrl: 'CED5678',
    habilitacionUrl: 'HAB-9012',
    vehicleModel: 'Toyota Corolla',
    vehiclePlate: 'ABC123',
    vehicleColor: 'Blanco',
    maxPassengers: 4,
  };

  let clienteToken: string;
  let choferToken: string;
  let clienteUserId: string;

  let clienteSocket: ReturnType<typeof createSocket>;
  let choferSocket: ReturnType<typeof createSocket>;

  let createdRideId: string;
  let createdOfferId: string;

  // ── Setup / Teardown ───────────────────

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    // Puerto aleatorio — necesario para que WS funcione sin colisión con dev server
    await app.listen(0);

    prisma = app.get(PrismaService);
    const port = (app.getHttpServer().address() as { port: number }).port;
    serverAddress = `http://localhost:${port}`;

    // Limpiar restos de corridas anteriores antes de arrancar
    // Rating → Offer → RideRequest → User (con cascade automático en Profile/DriverDocument)
    await prisma.rating
      .deleteMany({
        where: {
          OR: [
            { fromUser: { username: { startsWith: 'test_' } } },
            { toUser: { username: { startsWith: 'test_' } } },
          ],
        },
      })
      .catch(() => null);

    await prisma.offer
      .deleteMany({
        where: {
          OR: [
            { driver: { username: { startsWith: 'test_' } } },
            { rideRequest: { client: { username: { startsWith: 'test_' } } } },
          ],
        },
      })
      .catch(() => null);

    await prisma.rideRequest
      .deleteMany({
        where: { client: { username: { startsWith: 'test_' } } },
      })
      .catch(() => null);

    await prisma.user
      .deleteMany({
        where: { username: { startsWith: 'test_' } },
      })
      .catch(() => null);

    // Registrar cliente
    const clienteRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(clienteData);
    expect(clienteRes.status).toBe(201);
    clienteToken = clienteRes.body.access_token;
    clienteUserId = clienteRes.body.user.id;

    // Registrar chofer
    const choferRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(choferData);
    expect(choferRes.status).toBe(201);
    choferToken = choferRes.body.access_token;

    // Conectar sockets autenticados
    clienteSocket = createSocket(serverAddress, {
      auth: { token: clienteToken },
      transports: ['websocket'],
      forceNew: true,
    });
    choferSocket = createSocket(serverAddress, {
      auth: { token: choferToken },
      transports: ['websocket'],
      forceNew: true,
    });

    // Esperar conexión de ambos sockets
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const t = setTimeout(
          () => reject(new Error('Timeout socket cliente')),
          6000,
        );
        clienteSocket.on('connect', () => {
          clearTimeout(t);
          resolve();
        });
        clienteSocket.on('connect_error', (e: Error) => {
          clearTimeout(t);
          reject(e);
        });
      }),
      new Promise<void>((resolve, reject) => {
        const t = setTimeout(
          () => reject(new Error('Timeout socket chofer')),
          6000,
        );
        choferSocket.on('connect', () => {
          clearTimeout(t);
          resolve();
        });
        choferSocket.on('connect_error', (e: Error) => {
          clearTimeout(t);
          reject(e);
        });
      }),
    ]);
  });

  afterAll(async () => {
    clienteSocket?.disconnect();
    choferSocket?.disconnect();
    await new Promise((r) => setTimeout(r, 500));

    // Cleanup ordenado respetando FK:
    // Rating → Offer → RideRequest → User (con cascade automático en Profile/DriverDocument)
    await prisma.rating
      .deleteMany({
        where: {
          OR: [
            { fromUser: { username: { startsWith: 'test_' } } },
            { toUser: { username: { startsWith: 'test_' } } },
          ],
        },
      })
      .catch(() => null);

    await prisma.offer
      .deleteMany({
        where: {
          OR: [
            { driver: { username: { startsWith: 'test_' } } },
            { rideRequest: { client: { username: { startsWith: 'test_' } } } },
          ],
        },
      })
      .catch(() => null);

    await prisma.rideRequest
      .deleteMany({
        where: { client: { username: { startsWith: 'test_' } } },
      })
      .catch(() => null);

    await prisma.user
      .deleteMany({ where: { username: { startsWith: 'test_' } } })
      .catch(() => null);

    await app.close();
  });

  // Helper: escuchar un evento en un socket y emitir en otro (o el mismo)
  function wsListenAndEmit(
    listenSocket: typeof clienteSocket,
    emitSocket: typeof choferSocket,
    emitEvent: string,
    emitData: object,
    waitEvent: string,
    ms = 8000,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(new Error(`[WS timeout ${ms}ms] esperando '${waitEvent}'`)),
        ms,
      );
      listenSocket.once(waitEvent, (data: any) => {
        clearTimeout(timer);
        resolve(data);
      });
      emitSocket.emit(emitEvent, emitData);
    });
  }

  // ── US-005: Historial y Pendientes ─────

  describe('US-005 · REST /rides', () => {
    it('❌ GET /rides/history sin token → 401', async () => {
      await request(app.getHttpServer()).get('/rides/history').expect(401);
    });

    it('✅ GET /rides/history con CLIENTE → 200 con data:Array', async () => {
      const res = await request(app.getHttpServer())
        .get('/rides/history')
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('❌ GET /rides/pending con CLIENTE → 403', async () => {
      await request(app.getHttpServer())
        .get('/rides/pending')
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(403);
    });

    it('✅ GET /rides/pending con CHOFER → 200 con Array', async () => {
      const res = await request(app.getHttpServer())
        .get('/rides/pending')
        .set('Authorization', `Bearer ${choferToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── US-006: Flujo completo WS ──────────

  describe('US-006 · WebSocket — Flujo completo de viaje', () => {
    it('1️⃣  request_ride → chofer recibe new_ride_request con status PENDING', async () => {
      /**
       * El gateway hace: this.server.emit('new_ride_request', ride)
       * → broadcast global, por lo que el chofer lo recibe sin estar en ninguna room.
       * El cliente queda automáticamente en la room ride_${id} (client.join).
       * El chofer también necesita unirse a la room para los pasos siguientes.
       */
      const ride = await wsListenAndEmit(
        choferSocket,
        clienteSocket,
        'request_ride',
        {
          clientId: clienteUserId,
          originAddress: 'Av. Corrientes 1234',
          destAddress: 'Av. Santa Fe 5678',
        },
        'new_ride_request',
      );

      expect(ride).toHaveProperty('id');
      expect(ride.status).toBe('PENDING');
      createdRideId = ride.id;

      // Unirse EXPLÍCITAMENTE a la room del viaje y esperar para evitar race conditions
      // (aunque el gateway lo hace, a veces la latencia causa que no estén listos para el paso 2)
      clienteSocket.emit('join_room', { roomId: `ride_${createdRideId}` });
      choferSocket.emit('join_room', { roomId: `ride_${createdRideId}` });
      await new Promise((r) => setTimeout(r, 1000));
    });

    it('2️⃣  send_offer → cliente recibe new_offer con precio 1500', async () => {
      /**
       * El gateway hace: this.server.to(ride_${id}).emit('new_offer', offer)
       * → el cliente ya está en la room (se unió automáticamente al hacer request_ride)
       */
      const offer = await wsListenAndEmit(
        clienteSocket,
        choferSocket,
        'send_offer',
        {
          rideRequestId: createdRideId,
          quotedPrice: 1500,
          estimatedMinutes: 5,
        },
        'new_offer',
      );

      expect(offer).toHaveProperty('id');
      createdOfferId = offer.id; // capturar ANTES de assertions opcionales
      expect(Number(offer.quotedPrice)).toBe(1500);
    });

    it('3️⃣  accept_offer → cliente recibe ride_matched con status MATCHED', async () => {
      /**
       * El gateway hace: this.server.to(ride_${id}).emit('ride_matched', ride)
       * → el cliente ya está en la room
       */
      const matched = await wsListenAndEmit(
        clienteSocket,
        clienteSocket,
        'accept_offer',
        { rideId: createdRideId, offerId: createdOfferId },
        'ride_matched',
      );

      expect(matched).toHaveProperty('id');
      expect(matched.status).toBe('MATCHED');
    });

    it('4️⃣  driver_arrived → cliente recibe driver_at_location con status AT_LOCATION', async () => {
      /**
       * El gateway hace: this.server.to(ride_${id}).emit('driver_at_location', { ride })
       * → el cliente debe estar en la room
       */
      const arrived = await wsListenAndEmit(
        clienteSocket,
        choferSocket,
        'driver_arrived',
        { rideId: createdRideId },
        'driver_at_location',
      );

      expect(arrived).toHaveProperty('ride');
      expect(arrived.ride.status).toBe('AT_LOCATION');

      // Delay: esperar que la DB persista AT_LOCATION antes de que start_ride lo consulte
      await new Promise((r) => setTimeout(r, 800));

      // Verificar directamente en DB que el estado es AT_LOCATION
      const dbRide = await prisma.rideRequest.findUnique({
        where: { id: createdRideId },
      });
      expect(dbRide?.status).toBe('AT_LOCATION');
    });

    it('5️⃣  start_ride → chofer recibe ride_started con status IN_PROGRESS', async () => {
      /**
       * El gateway hace: this.server.to(ride_${id}).emit('ride_started', ride)
       * El chofer está en la room (join_room hecho en paso 1️⃣).
       */
      const started = await wsListenAndEmit(
        choferSocket,
        choferSocket,
        'start_ride',
        { rideId: createdRideId },
        'ride_started',
      );

      expect(started).toHaveProperty('id');
      expect(started.status).toBe('IN_PROGRESS');
    });

    it('6️⃣  finish_ride → chofer recibe ride_completed con status COMPLETED', async () => {
      /**
       * El gateway hace: this.server.to(ride_${id}).emit('ride_completed', ride)
       * Escuchamos en choferSocket (está en la room).
       */
      const completed = await wsListenAndEmit(
        choferSocket,
        choferSocket,
        'finish_ride',
        { rideId: createdRideId },
        'ride_completed',
      );

      expect(completed).toHaveProperty('id');
      expect(completed.status).toBe('COMPLETED');
    });

    it('7️⃣  historial del cliente muestra el viaje COMPLETED', async () => {
      const res = await request(app.getHttpServer())
        .get('/rides/history')
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(200);

      const found = res.body.data.find((r: any) => r.id === createdRideId);
      expect(found).toBeDefined();
      expect(found.status).toBe('COMPLETED');
    });
  });
});
