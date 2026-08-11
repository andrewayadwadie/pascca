// 003-auth-authorization (T045, Art 15 [NN]). One helper every module's mutations call — actor,
// entity, entity id, before/after diff. `passwordHash` is stripped from both sides of a `User`
// diff before it's written: an audit trail that itself leaked password hashes would violate the
// exact principle it exists to serve.
import type { Prisma, PrismaClient } from "@prisma/client";

function redact<T extends Record<string, unknown>>(value: T | null): Record<string, unknown> | null {
  if (!value) return null;
  const rest: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (key !== "passwordHash") rest[key] = value[key];
  }
  return rest;
}

export function createAuditWriter(prisma: PrismaClient) {
  return {
    async write(params: {
      actorId: string | null;
      action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
      entity: string;
      entityId: string;
      before: Record<string, unknown> | null;
      after: Record<string, unknown> | null;
    }): Promise<void> {
      await prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          diff: { before: redact(params.before), after: redact(params.after) } as Prisma.InputJsonValue,
        },
      });
    },
  };
}

export type AuditWriter = ReturnType<typeof createAuditWriter>;
