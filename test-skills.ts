import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const mentors = await prisma.users.findMany({ where: { role: 'MENTOR' } });
    for (const m of mentors) {
      try {
        JSON.parse(m.skills || "[]");
      } catch (e) {
        console.error(`Error parsing skills for mentor ${m.id} (${m.email}):`, m.skills);
      }
    }
    console.log("Done checking", mentors.length, "mentors");
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
