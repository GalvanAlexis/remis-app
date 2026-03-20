import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = 'blado'; // Normalizado
  const password = '12345678';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log(`Configurando usuario: ${username}`);

  const user = await prisma.user.upsert({
    where: { username },
    update: { password: hashedPassword },
    create: {
      username,
      password: hashedPassword,
      role: 'CLIENTE',
      profile: {
        create: {
          nombre: 'Blado',
          apellido: 'Test',
          dni: '99999999',
          themePreference: 'EXECUTIVE'
        }
      }
    }
  });
  
  console.log(`Usuario ${user.username} listo con password: ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
