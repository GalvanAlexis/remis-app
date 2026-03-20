import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = 'testmaestro@mail.com';
  const hashedPassword = await bcrypt.hash('TestPass123!', 10);
  
  // Upsert para no arriesgar con el delete si falla
  const user = await prisma.user.upsert({
    where: { username },
    update: { password: hashedPassword },
    create: {
      username,
      password: hashedPassword,
      nombre: 'Test',
      apellido: 'Maestro',
      dni: '12345678',
      role: 'CLIENTE',
    },
  });
  
  console.log(`Usuario ${user.username} (re)configurado con contraseña: TestPass123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
