const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);
  
  await prisma.user.upsert({
    where: { email: 'cliente1@mail.com' },
    update: {},
    create: {
      email: 'cliente1@mail.com',
      password: hash,
      role: 'CLIENTE',
      profile: {
        create: {
          nombre: 'Cliente',
          apellido: 'Uno',
          telefono: '+5491112345678'
        }
      }
    }
  });

  await prisma.user.upsert({
    where: { email: 'chofer@remis.com' },
    update: {},
    create: {
      email: 'chofer@remis.com',
      password: hash,
      role: 'CHOFER',
      profile: {
        create: {
          nombre: 'Chofer',
          apellido: 'Test',
          telefono: '+5491112345679'
        }
      },
      driverDocs: {
        create: {
          licencia: 'LIC-123456',
          vehicleModel: 'Fiat Cronos',
          vehiclePlate: 'AD123ZZ',
          status: 'APPROVED'
        }
      }
    }
  });
  console.log('Seed exitoso');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
