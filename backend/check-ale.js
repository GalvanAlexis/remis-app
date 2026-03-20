
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'Ale' },
      include: { profile: true }
    });
    console.log('--- DB CHECK ---');
    console.log(JSON.stringify(user?.profile, null, 2));
    console.log('----------------');
  } catch (e) {
    console.error('DB Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
check();
