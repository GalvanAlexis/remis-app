const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function clean() {
  // 1. Obtener IDs de usuarios test
  const testUsers = await p.user.findMany({
    where: { username: { startsWith: 'test_' } },
    select: { id: true },
  });
  const testIds = testUsers.map((u) => u.id);

  if (testIds.length === 0) {
    console.log('No test users found');
    await p.$disconnect();
    return;
  }

  console.log('Found test users:', testIds.length);

  // 2. Obtener IDs de rides de usuarios test
  const testRides = await p.rideRequest.findMany({
    where: { clientId: { in: testIds } },
    select: { id: true },
  });
  const rideIds = testRides.map((r) => r.id);

  // 3. Borrar en orden FK
  if (rideIds.length > 0) {
    await p.rating.deleteMany({ where: { rideId: { in: rideIds } } });
  }

  // Borrar offers de choferes test o viajes test
  await p.offer.deleteMany({
    where: {
      OR: [{ driverId: { in: testIds } }, { rideRequestId: { in: rideIds } }],
    },
  });

  // Borrar rides
  await p.rideRequest.deleteMany({ where: { clientId: { in: testIds } } });

  // Borrar docs/profile de usuarios test
  await p.driverDocument
    .deleteMany({ where: { userId: { in: testIds } } })
    .catch(() => null);
  await p.profile
    .deleteMany({ where: { userId: { in: testIds } } })
    .catch(() => null);
  await p.refreshToken
    .deleteMany({ where: { userId: { in: testIds } } })
    .catch(() => null);

  // Borrar usuarios
  const r = await p.user.deleteMany({ where: { id: { in: testIds } } });
  console.log('Cleaned', r.count, 'test users');
  await p.$disconnect();
}

clean().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
