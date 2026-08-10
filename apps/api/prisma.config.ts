// Prisma 6 config (research R12). `package.json#prisma.seed` is deprecated in the installed
// version (6.19.3 — verified during T003: `prisma.config.ts` + `--config` are supported, and the
// CLI auto-discovers this file from the working directory with no `--config` flag needed).
//
// This file does NOT load `.env` itself. `DATABASE_URL` is already in `process.env` by the time
// this file is evaluated, because every `db:*` script in package.json invokes `node
// --env-file-if-exists=../../.env` (or `tsx`'s equivalent) *before* the Prisma CLI — the same
// pattern apps/api/src/server.ts uses for the app runtime (contracts/db-commands.md).
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --env-file-if-exists=../../.env prisma/seed.ts",
  },
});
