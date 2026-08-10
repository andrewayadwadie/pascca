// Seed entry point (T037). Thin on purpose — `prisma/seed/index.ts` does the work; this file's
// only job is to run it, print a counts-only summary, and exit non-zero on failure.
//
// Article 29 [NN] applies to this script's stdout exactly as it applies to the API's logger: no
// phone number, email, password, or staffNotes value is ever printed here — counts and slugs
// only (contracts/seed-dataset.md).
import { PrismaClient } from "@prisma/client";
import { runSeed } from "./seed/index";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const counts = await runSeed(prisma);

  console.log("Seed complete:");
  for (const [model, count] of Object.entries(counts)) {
    console.log(`  ${model}: ${count}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
