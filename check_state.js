const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany({
      where: { email: 'iffabricionotexist@gmail.com' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('--- LATEST USERS ---');
    console.log(JSON.stringify(users, null, 2));

    const sessions = await prisma.session.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('--- ENV CHECK ---');
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
  } catch (e) {

    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
