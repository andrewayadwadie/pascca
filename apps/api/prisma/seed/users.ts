// Seed module: User (T029). One ADMIN, one MODERATOR, upserted on `email` (research R6).
//
// Article 29 [NN] names argon2 explicitly, and hashing with the real library — not a placeholder
// string — means the auth feature's first login attempt against a seeded account actually works.
// The plaintext comes from an env var if present, otherwise a clearly-marked development default.
// Article 29's "no PII in logs" applies to this script's stdout too: it prints a one-line warning
// and nothing else — never the password, email, or phone value (research R8).
import argon2 from "argon2";
import type { PrismaClient } from "@prisma/client";

const DEV_DEFAULT_PASSWORD = "pascca-dev-only-not-a-real-credential";

export interface SeededUsers {
  adminId: string;
  moderatorId: string;
}

export async function seedUsers(prisma: PrismaClient): Promise<SeededUsers> {
  const plaintext = process.env.SEED_USER_PASSWORD ?? DEV_DEFAULT_PASSWORD;
  const passwordHash = await argon2.hash(plaintext, { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email: "admin@pascca.local" },
    update: { passwordHash, role: "ADMIN", isActive: true },
    create: {
      email: "admin@pascca.local",
      passwordHash,
      name: "Pascca Admin",
      role: "ADMIN",
      isActive: true,
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@pascca.local" },
    update: { passwordHash, role: "MODERATOR", isActive: true },
    create: {
      email: "moderator@pascca.local",
      passwordHash,
      name: "Pascca Moderator",
      role: "MODERATOR",
      isActive: true,
    },
  });

  console.log(
    "⚠  Seeded 2 users with the development password. Local fixtures only — never seed a shared environment.",
  );

  return { adminId: admin.id, moderatorId: moderator.id };
}
