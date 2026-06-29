import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("Dropping old stock column...");
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Variant" DROP COLUMN "stock";`);
    console.log("Migration complete.");
  } catch (error) {
    console.error("Migration error:", error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
