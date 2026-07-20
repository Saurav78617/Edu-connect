import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const mentorCount = await prisma.users.count({ where: { role: 'MENTOR' } });
    console.log("Mentor count:", mentorCount);
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
