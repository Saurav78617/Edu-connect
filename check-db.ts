import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const user = await prisma.users.findFirst({ select: { city: true, isAvailable: true } });
    console.log("DB connection successful. City and isAvailable columns exist:", user);
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
