import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const mentors = await prisma.users.findMany({
      where: { role: 'MENTOR', isAvailable: 1 },
      select: { id: true }
    });
    console.log("Mentors found:", mentors.length);
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
