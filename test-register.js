import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const user = await prisma.users.create({
      data: {
        name: "Test User",
        email: "test899@example.com",
        passwordHash: "hash123",
        role: "STUDENT",
        skills: "[]",
        experienceYears: null,
        hourlyRate: null,
        bio: "",
        city: null,
        verificationToken: "token123",
        emailVerified: false
      }
    });
    console.log("Success:", user);
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
