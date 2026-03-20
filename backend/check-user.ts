import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const username = 'Blado';
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username },
        { username: username.toLowerCase() }
      ]
    },
    include: { profile: true }
  });
  
  if (!user) {
    console.log(`Usuario "${username}" no encontrado.`);
    const allUsers = await prisma.user.findMany({ take: 10, select: { username: true } });
    console.log('Usuarios existentes (primeros 10):', allUsers.map(u => u.username));
  } else {
    console.log('Usuario encontrado:', JSON.stringify(user, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
