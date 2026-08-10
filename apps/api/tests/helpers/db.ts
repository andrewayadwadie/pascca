// Shared test-database access (002-content-schema-seed, T008).
//
// Layers 2 and 3 of this feature's tests (research R13) need a live Postgres. A test that
// quietly skips when DATABASE_URL is absent is worse than one that fails — it looks green while
// proving nothing. This file throws at import time instead of guarding each test with an
// `if (!process.env.DATABASE_URL) return`.
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Database-backed tests need a live Postgres — run " +
      "`docker compose up -d`, then `cp .env.example .env` and fill in DATABASE_URL (or export " +
      "it directly), and re-run. Refusing to skip silently.",
  );
}

export const prisma = new PrismaClient();

/**
 * Truncates every application table — everything in the `public` schema except Prisma's own
 * `_prisma_migrations` bookkeeping table — so each test suite starts from a known-empty
 * database. `CASCADE` is required: tables reference each other (`Branch` -> `BranchHour`,
 * `MenuItem` -> `Category`, ...) and a bare `TRUNCATE` on a partial table list would fail with a
 * foreign-key error. `RESTART IDENTITY` is close to a no-op — every id in this schema is a
 * `cuid()` string, not a Postgres `serial` — but costs nothing and stays correct if a
 * sequence-backed column is ever added later.
 */
export async function resetDatabase(): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;

  if (tables.length === 0) return;

  const quoted = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
