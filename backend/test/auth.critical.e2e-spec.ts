import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Tests Críticos — Auth (E2E)
 * Spec: test/critical-tests.spec.md → US-001 a US-004
 *
 * Quality Gate: npm run test:critical
 */
describe('Auth — Tests Críticos (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ts = Date.now();
  const clientUser = {
    username: `test_cli_${ts}`,
    password: 'TestPass123!',
    nombre: 'Test',
    apellido: 'Cliente',
    dni: `${ts}`.slice(-8),
    role: 'CLIENTE',
  };

  let clientToken: string;
  let clientRefreshToken: string;
  let clientUserId: string;

  // ── Setup / Teardown ───────────────────

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user
      .deleteMany({ where: { username: { startsWith: 'test_' } } })
      .catch(() => null);
    await app.close();
  });

  // ── US-001: Registro ───────────────────

  describe('US-001 · POST /auth/register', () => {
    it('✅ datos válidos → 201 con access_token, refresh_token, user.role', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(clientUser)
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');
      expect(res.body.user.role).toBe('CLIENTE');

      clientToken = res.body.access_token;
      clientRefreshToken = res.body.refresh_token;
      clientUserId = res.body.user.id;
    });

    it('❌ username duplicado → 409', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(clientUser)
        .expect(409);
    });

    it('❌ campos faltantes → 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'incompleto' })
        .expect(400);
    });

    it('❌ role inválido → 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...clientUser, username: `test_bad_${ts}`, role: 'SUPERADMIN' })
        .expect(400);
    });
  });

  // ── US-002: Login ───────────────────────

  describe('US-002 · POST /auth/login', () => {
    it('✅ credenciales correctas → 200 con tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: clientUser.username, password: clientUser.password })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');
      expect(res.body.user.username).toBe(clientUser.username);

      // Renovar tokens para tests siguientes
      clientToken = res.body.access_token;
      clientRefreshToken = res.body.refresh_token;
      clientUserId = res.body.user.id;
    });

    it('❌ contraseña incorrecta → 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: clientUser.username, password: 'WrongPass999' })
        .expect(401);
    });

    it('❌ usuario inexistente → 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'usuario_xyz_no_existe', password: 'cualquier' })
        .expect(401);
    });

    it('❌ ruta protegida sin Bearer → 401', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });

  // ── US-003: Refresh Token ───────────────

  describe('US-003 · POST /auth/refresh', () => {
    it('✅ refresh_token válido → 200 con tokens distintos (rotación real)', async () => {
      const prevAccess = clientToken;
      const prevRefresh = clientRefreshToken;

      // Delay: los JWT se firman con precisión de segundos (iat).
      // Sin delay, el nuevo token puede ser idéntico si se firma en el mismo segundo.
      await new Promise((r) => setTimeout(r, 1100));

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ userId: clientUserId, refreshToken: clientRefreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');
      // Los tokens deben ser distintos — rotación real
      expect(res.body.access_token).not.toBe(prevAccess);
      expect(res.body.refresh_token).not.toBe(prevRefresh);

      clientToken = res.body.access_token;
      clientRefreshToken = res.body.refresh_token;
    });

    it('❌ userId inexistente → 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          userId: '00000000-0000-0000-0000-000000000000',
          refreshToken: clientRefreshToken,
        })
        .expect(401);
    });
  });

  // ── US-004: Logout ─────────────────────

  describe('US-004 · POST /auth/logout', () => {
    it('✅ Bearer válido → 200', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);
    });

    it('❌ refresh_token invalidado después del logout → 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ userId: clientUserId, refreshToken: clientRefreshToken })
        .expect(401);
    });

    it('❌ sin Bearer → 401', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });
});
