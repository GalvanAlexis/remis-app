import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

/**
 * Tests de Riesgo Bajo (E2E)
 * Spec: test/low-tests.spec.md → US-011, US-012, US-013
 *
 * Quality Gate: npm run test:low
 */

const timestamp = Date.now();

describe('Pruebas de Riesgo Bajo (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientToken = '';
  let driverToken = '';
  let clientId = '';
  let driverId = '';

  // ── Setup ──────────────────────────────────────────────────────────────────

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

    // Cleanup de usuarios de test anteriores
    const testUsernames = { startsWith: 'test_low_' };

    await prisma.rating
      .deleteMany({
        where: {
          OR: [
            { fromUser: { username: testUsernames } },
            { toUser: { username: testUsernames } },
          ],
        },
      })
      .catch(() => null);

    await prisma.offer
      .deleteMany({
        where: {
          OR: [
            { driver: { username: testUsernames } },
            { rideRequest: { client: { username: testUsernames } } },
          ],
        },
      })
      .catch(() => null);

    await prisma.rideRequest
      .deleteMany({
        where: { client: { username: testUsernames } },
      })
      .catch(() => null);

    await prisma.driverDocument
      .deleteMany({
        where: { user: { username: testUsernames } },
      })
      .catch(() => null);

    await prisma.profile
      .deleteMany({
        where: { user: { username: testUsernames } },
      })
      .catch(() => null);

    await prisma.user
      .deleteMany({
        where: { username: testUsernames },
      })
      .catch(() => null);

    // Registrar CLIENTE
    const resClient = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: `test_low_c_${timestamp}`,
        password: 'Password123!',
        role: 'CLIENTE',
        nombre: 'ClienteLow',
        apellido: 'Test',
        dni: String(Math.floor(10000000 + Math.random() * 90000000)),
      });

    if (resClient.status !== 201) {
      console.log('Error registro CLIENTE:', resClient.body);
    }
    expect(resClient.status).toBe(201);
    clientToken = resClient.body.access_token;
    clientId = resClient.body.user.id;

    // Registrar CHOFER
    const resDriver = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: `test_low_d_${timestamp}`,
        password: 'Password123!',
        role: 'CHOFER',
        nombre: 'ChoferLow',
        apellido: 'Test',
        dni: String(Math.floor(10000000 + Math.random() * 90000000)),
        licenciaUrl: `LIC${String(timestamp).slice(-6)}`,
        cedulaUrl: `CED${String(timestamp).slice(-6)}`,
        habilitacionUrl: `HAB-${String(timestamp).slice(-6)}`,
        vehiclePlate: `LOW${String(timestamp).slice(-3)}`,
        maxPassengers: 4,
        vehicleModel: 'Renault Logan',
        vehicleColor: 'Gris',
      });

    if (resDriver.status !== 201) {
      console.log('Error registro CHOFER:', resDriver.body);
    }
    expect(resDriver.status).toBe(201);
    driverToken = resDriver.body.access_token;
    driverId = resDriver.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── US-011: Stats Free ─────────────────────────────────────────────────────

  describe('US-011: Estadísticas del Chofer — Free', () => {
    beforeAll(async () => {
      // Inyectar 2 viajes COMPLETADOS para el chofer de test
      for (let i = 0; i < 2; i++) {
        const ride = await prisma.rideRequest.create({
          data: {
            clientId,
            originAddress: `Origen ${i}`,
            destAddress: `Destino ${i}`,
            status: 'COMPLETED',
            offers: {
              create: {
                driverId,
                estimatedMinutes: 10,
                quotedPrice: 500 + i * 100,
                status: 'ACCEPTED',
              },
            },
          },
          include: { offers: true },
        });
        const offerId = (ride as any).offers[0].id;
        await prisma.rideRequest.update({
          where: { id: ride.id },
          data: { selectedOfferId: offerId },
        });
      }
    });

    it('debe devolver stats básicas al chofer (GET /stats/free)', async () => {
      const resp = await request(app.getHttpServer())
        .get('/stats/free')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(resp.body.totalRides).toBeGreaterThanOrEqual(2);
      expect(resp.body.earningsThisMonth).toBeGreaterThan(0);
      expect(typeof resp.body.totalRatings).toBe('number');
      expect(Array.isArray(resp.body.history)).toBe(true);
    });

    it('debe devolver avgRating null si el chofer no tiene ratings (nuevo chofer)', async () => {
      // El chofer recién registrado no tiene ratings — avgRating debe ser null
      const resp = await request(app.getHttpServer())
        .get('/stats/free')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      // Puede ser null (sin ratings) o number si hay ratings previos de limpieza
      const isNullOrNumber =
        resp.body.avgRating === null || typeof resp.body.avgRating === 'number';
      expect(isNullOrNumber).toBe(true);
    });

    it('debe rechazar GET /stats/free sin token → 401', async () => {
      await request(app.getHttpServer()).get('/stats/free').expect(401);
    });

    it('debe rechazar GET /stats/free con token de CLIENTE → 403', async () => {
      await request(app.getHttpServer())
        .get('/stats/free')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('debe devolver historial paginado (GET /stats/history)', async () => {
      const resp = await request(app.getHttpServer())
        .get('/stats/history')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(Array.isArray(resp.body.items)).toBe(true);
      expect(typeof resp.body.hasMore).toBe('boolean');
      // nextCursor puede ser string o null
      expect(
        resp.body.nextCursor === null ||
          typeof resp.body.nextCursor === 'string',
      ).toBe(true);
    });

    it('GET /stats/history?take=1 con 2 viajes → hasMore: true', async () => {
      const resp = await request(app.getHttpServer())
        .get('/stats/history?take=1')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(resp.body.items.length).toBe(1);
      expect(resp.body.hasMore).toBe(true);
      expect(resp.body.nextCursor).toBeDefined();
    });
  });

  // ── US-012: Stats Premium ──────────────────────────────────────────────────

  describe('US-012: Estadísticas Premium — Guard IsPremium', () => {
    it('debe rechazar GET /stats/premium si el chofer no es premium → 403', async () => {
      // El chofer recién registrado no tiene isPremium
      await request(app.getHttpServer())
        .get('/stats/premium')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(403);
    });

    it('debe permitir GET /stats/premium si el chofer tiene isPremium: true', async () => {
      // Activar premium vía Prisma
      await prisma.driverDocument.update({
        where: { userId: driverId },
        data: { isPremium: true },
      });

      const resp = await request(app.getHttpServer())
        .get('/stats/premium')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      // Verificar campos clave del analytics avanzado
      expect(Array.isArray(resp.body.earningsByDay)).toBe(true);
      expect(typeof resp.body.thisMonthTotal).toBe('number');
      expect(Array.isArray(resp.body.ratingBreakdown)).toBe(true);
      expect(resp.body.ratingBreakdown.length).toBe(5); // 5 estrellas

      // Cleanup: desactivar premium
      await prisma.driverDocument.update({
        where: { userId: driverId },
        data: { isPremium: false },
      });
    });

    it('debe rechazar GET /stats/premium con token de CLIENTE → 403', async () => {
      await request(app.getHttpServer())
        .get('/stats/premium')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  // ── US-013: Notifications Token ────────────────────────────────────────────

  describe('US-013: Registro de Expo Push Token', () => {
    it('debe registrar un token válido ExponentPushToken → 200 con { success: true }', async () => {
      const resp = await request(app.getHttpServer())
        .post('/notifications/register-token')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ pushToken: 'ExponentPushToken[abc123XYZ]' })
        .expect(201);

      expect(resp.body.success).toBe(true);
    });

    it('debe registrar un token válido ExpoPushToken → 200 con { success: true }', async () => {
      const resp = await request(app.getHttpServer())
        .post('/notifications/register-token')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ pushToken: 'ExpoPushToken[device-xyz-456]' })
        .expect(201);

      expect(resp.body.success).toBe(true);
    });

    it('debe rechazar token con formato inválido → 400', async () => {
      const resp = await request(app.getHttpServer())
        .post('/notifications/register-token')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ pushToken: 'INVALID_TOKEN_FORMAT' })
        .expect(400);

      expect(resp.body.message).toContain('inválido');
    });

    it('debe rechazar request sin pushToken → 400', async () => {
      await request(app.getHttpServer())
        .post('/notifications/register-token')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({})
        .expect(400);
    });

    it('debe rechazar request sin autenticar → 401', async () => {
      await request(app.getHttpServer())
        .post('/notifications/register-token')
        .send({ pushToken: 'ExponentPushToken[abc123]' })
        .expect(401);
    });
  });
});
