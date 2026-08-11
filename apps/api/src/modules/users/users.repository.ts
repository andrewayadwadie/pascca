// 003-auth-authorization (T018, Art 7). Prisma only — no business rules. Every invariant
// (self-protection, last-active-ADMIN, email uniqueness messaging) lives in `users.service.ts`,
// never here.
import type { Prisma, PrismaClient, Role, User } from "@prisma/client";

export function createUsersRepository(prisma: PrismaClient) {
  return {
    findByEmail(email: string): Promise<User | null> {
      return prisma.user.findUnique({ where: { email } });
    },

    findById(id: string): Promise<User | null> {
      return prisma.user.findUnique({ where: { id } });
    },

    create(data: { email: string; passwordHash: string; name: string; phone?: string; role: Role }): Promise<User> {
      return prisma.user.create({ data });
    },

    update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
      return prisma.user.update({ where: { id }, data });
    },

    async list(params: {
      page: number;
      limit: number;
      role?: Role;
      isActive?: boolean;
    }): Promise<{ items: User[]; total: number }> {
      const where: Prisma.UserWhereInput = {
        deletedAt: null,
        ...(params.role ? { role: params.role } : {}),
        ...(params.isActive === undefined ? {} : { isActive: params.isActive }),
      };
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (params.page - 1) * params.limit,
          take: params.limit,
          orderBy: { createdAt: "asc" },
        }),
        prisma.user.count({ where }),
      ]);
      return { items, total };
    },

    /** Sole active-ADMIN checks (FR-015) read this — count excludes the row being acted on. */
    countActiveAdmins(excludingId?: string): Promise<number> {
      return prisma.user.count({
        where: {
          role: "ADMIN",
          isActive: true,
          deletedAt: null,
          ...(excludingId ? { id: { not: excludingId } } : {}),
        },
      });
    },

    softDelete(id: string): Promise<User> {
      return prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    },
  };
}

export type UsersRepository = ReturnType<typeof createUsersRepository>;
