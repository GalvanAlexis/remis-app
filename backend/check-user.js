require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const username = 'Blado';
  console.log('Buscando usuario:', username);
  
  try {
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
      const allUsers = await prisma.user.findMany({ take: 20, select: { username: true } });
      console.log('Usuarios existentes en DB:', allUsers.map(u => u.username));
    } else {
      console.log('Usuario encontrado:', JSON.stringify(user, null, 2));
    }
  } catch (err) {
    console.error('Error al consultar la DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
