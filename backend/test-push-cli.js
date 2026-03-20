
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

async function test() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'Ale' }
    });

    if (!user || !user.pushToken) {
      console.log('ERROR: El usuario Ale no tiene pushToken registrado en la DB.');
      return;
    }

    console.log('Enviando push a:', user.pushToken);

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.pushToken,
        title: 'Prueba de Sistema',
        body: 'Confirmación de funcionamiento de notificaciones.',
        data: { test: true },
      }),
    });

    const result = await response.json();
    console.log('RESULTADO EXPO:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
