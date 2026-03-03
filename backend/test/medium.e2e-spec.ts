import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const ioClient = require('socket.io-client');
const createSocket = (url: string, opts: Record<string, unknown>) =>
  ioClient(url, opts) as {
    on: (ev: string, fn: (...a: any[]) => void) => void;
    once: (ev: string, fn: (...a: any[]) => void) => void;
    emit: (ev: string, data?: any, callback?: Function) => void;
    disconnect: () => void;
  };

const wsListenAndEmit = <T>(
  socket: ReturnType<typeof createSocket>,
  listenEvent: string,
  emitAction: () => void,
): Promise<T> => {
  return new Promise((resolve) => {
    socket.once(listenEvent, (data: T) => resolve(data));
    emitAction();
  });
};

const timestamp = Date.now();

describe('Pruebas de Riesgo Medio (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientToken = '';
  let driverToken = '';
  let clientId = '';
  let driverId = '';
  let clienteSocket: ReturnType<typeof createSocket>;
  let choferSocket: ReturnType<typeof createSocket>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.enableCors();
    await app.init();
    await app.listen(0);

    prisma = app.get<PrismaService>(PrismaService);

    // Limpiar restos de corridas anteriores
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

    await prisma.driverDocument
      .deleteMany({
        where: { user: { username: { startsWith: 'test_' } } },
      })
      .catch(() => null);

    await prisma.profile
      .deleteMany({
        where: { user: { username: { startsWith: 'test_' } } },
      })
      .catch(() => null);

    await prisma.user
      .deleteMany({
        where: { username: { startsWith: 'test_' } },
      })
      .catch(() => null);

    // Registrar Usuario Cliente
    const resClient = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: `test_medium_c_${timestamp}`,
        password: 'Password123!',
        role: 'CLIENTE',
        nombre: 'ClienteTest',
        apellido: 'Medium',
        dni: String(Math.floor(10000000 + Math.random() * 90000000)), // 8 dígitos numéricos
      });
    if (resClient.status !== 201) {
      console.log('Error Cliente:', resClient.body);
    }
    expect(resClient.status).toBe(201);
    clientToken = resClient.body.access_token;
    clientId = resClient.body.user.id;

    // Registrar Usuario Chofer
    const resDriver = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: `test_medium_d_${timestamp}`,
        password: 'Password123!',
        role: 'CHOFER',
        nombre: 'ChoferTest',
        apellido: 'Medium',
        dni: String(Math.floor(10000000 + Math.random() * 90000000)), // 8 dígitos numéricos
        licenciaUrl: `LIC${String(timestamp).slice(-6)}`,
        cedulaUrl: `CED${String(timestamp).slice(-6)}`,
        habilitacionUrl: `HAB-${String(timestamp).slice(-6)}`,
        vehiclePlate: `NVM${String(timestamp).slice(-3)}`,
        maxPassengers: 4,
        vehicleModel: 'Fiat Cronos',
        vehicleColor: 'Rojo',
      });
    if (resDriver.status !== 201) {
      console.log('Error Chofer:', resDriver.body);
    }
    expect(resDriver.status).toBe(201);
    driverToken = resDriver.body.access_token;
    driverId = resDriver.body.user.id;

    // Conectar WS
    const serverAddress = app.getHttpServer().address() as any;
    const url = `http://127.0.0.1:${serverAddress.port}`;
    clienteSocket = createSocket(url, { auth: { token: clientToken } });
    choferSocket = createSocket(url, { auth: { token: driverToken } });

    await new Promise<void>((resolve) => {
      let conn = 0;
      const check = () => ++conn === 2 && resolve();
      clienteSocket.on('connect', check);
      choferSocket.on('connect', check);
    });
  });

  afterAll(async () => {
    clienteSocket.disconnect();
    choferSocket.disconnect();
    await app.close();
  });

  describe('US-007: Perfiles de Usuario', () => {
    it('debe obtener el perfil del cliente exitosamente (GET /users/profile)', async () => {
      const resp = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(resp.body.id).toBeDefined();
      expect(resp.body.username).toBe(`test_medium_c_${timestamp}`);
      expect(resp.body.profile.nombre).toBe('ClienteTest');
      expect(resp.body.profile.themePreference).toBe('EXECUTIVE'); // default
    });

    it('debe fallar la actualización si envía un campo no permitido (PUT /users/profile)', async () => {
      const resp = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ role: 'ADMIN' }) // campo no whitelisted
        .expect(400);

      expect(resp.body.message).toEqual(
        expect.arrayContaining(['property role should not exist']),
      );
    });

    it('debe actualizar el perfil correctamente (PUT /users/profile)', async () => {
      const resp = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          nombre: 'Cliente',
          direccion: 'Av Siempreviva 123',
          themePreference: 'CLASSIC',
        })
        .expect(200);

      expect(resp.body.nombre).toBe('Cliente');
      expect(resp.body.direccion).toBe('Av Siempreviva 123');
      expect(resp.body.themePreference).toBe('CLASSIC');
    });
  });

  describe('US-008: Documentos del Chofer y Verificación', () => {
    it('debe obtener los documentos actuales del chofer (GET /users/driver/documents)', async () => {
      const resp = await request(app.getHttpServer())
        .get('/users/driver/documents')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(resp.body.licenciaUrl).toBeDefined();
      expect(resp.body.maxPassengers).toBe(4);
      expect(resp.body.isVerified).toBe(true); // Se autoverifica al registro actualmente
    });

    it('no debe permitir a un CLIENTE intentar acceder a los documentos (GET /users/driver/documents)', async () => {
      await request(app.getHttpServer())
        .get('/users/driver/documents')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403); // Forbidden (Rol)
    });

    it('debe permitir al chofer subir o actualizar sus documentos (POST /users/driver/documents)', async () => {
      const resp = await request(app.getHttpServer())
        .post('/users/driver/documents')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          maxPassengers: 6,
          licenciaUrl: `https://fake.com/doc-${timestamp}.png`,
        })
        .expect(201);

      expect(resp.body.maxPassengers).toBe(6);
      expect(resp.body.licenciaUrl).toContain('fake.com/doc');
    });
  });

  describe('US-009: Sistema de Reseñas y Ratings', () => {
    let testRideId = '';

    beforeAll(async () => {
      // Inyectar un viaje COMPLETADO para que el cliente o el chofer puedan calificar
      const ride = await prisma.rideRequest.create({
        data: {
          clientId,
          originAddress: 'A',
          destAddress: 'B',
          status: 'COMPLETED',
          offers: {
            create: {
              driverId,
              estimatedMinutes: 10,
              quotedPrice: 500,
              status: 'ACCEPTED',
            },
          },
        },
        include: { offers: true },
      });

      testRideId = ride.id;
      const offerId = (ride as any).offers[0].id;
      await prisma.rideRequest.update({
        where: { id: testRideId },
        data: { selectedOfferId: offerId },
      });
    });

    it('debe permitir al cliente calificar al chofer con ACK de WebSocket', async () => {
      // Usaremos Socket.io client con un pattern .emit(evento, datos, (ack) => {})
      const resp: any = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject('Timeout ACK Socket'), 2000);
        clienteSocket.emit(
          'rate_ride',
          {
            rideId: testRideId,
            fromUserId: clientId, // bypass ValidationPipe local requirement
            toUserId: driverId,
            score: 5,
            comment: 'Viaje excelente',
          },
          (ack) => {
            clearTimeout(timeout);
            resolve(ack);
          },
        );
      });

      expect(resp).toBeDefined();
      expect(resp.rideId).toBe(testRideId);
      expect(resp.score).toBe(5);
      expect(resp.toUserId).toBe(driverId);
    });

    it('debe fallar si el cliente intenta calificar al chofer por segunda vez', async () => {
      const resp: any = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject('Timeout ACK Socket 2'), 2000);
        clienteSocket.emit(
          'rate_ride',
          {
            rideId: testRideId,
            fromUserId: clientId,
            toUserId: driverId,
            score: 4,
            comment: 'Doble calificacion ilegal',
          },
          (ack) => {
            clearTimeout(timeout);
            resolve(ack);
          },
        );
      });

      // NestJS WS Exception / BadRequest devuelve error o status
      expect(resp).toBeDefined();
      const hasError =
        resp.status === 'error' ||
        resp.message ||
        resp.name === 'BadRequestException';
      expect(hasError).toBeTruthy();
    });
  });
});
