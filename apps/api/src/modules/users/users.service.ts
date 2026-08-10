// 003-auth-authorization (T019, T043, T059, Art 7). Business rules only — no `req`/`reply`/status
// codes. Base methods (US1/US4): findByEmailForAuth, createCustomer, getProfile, recordLogin,
// roleOf. Admin methods + self-protection invariants (US2, FR-014/FR-015): listUsers, changeRole,
// changeActiveStatus, deleteUser. updateProfile (US4, FR-017) added last, since password-change
// needs `auth.service.ts` for cross-module session revocation.
import { AppError } from "../../plugins/errors.ts";
import type { User } from "@prisma/client";
import type { UsersRepository } from "./users.repository.ts";
import type { AuditWriter } from "../../lib/audit.ts";
import type { ProfileResponse } from "./users.schema.ts";

export function createUsersService(usersRepository: UsersRepository, auditWriter: AuditWriter) {
  function toProfileResponse(user: User): ProfileResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /** FR-015: the sole remaining active ADMIN cannot be demoted, deactivated, or deleted — by
   *  anyone, including another ADMIN. Checked by counting active ADMINs EXCLUDING the target, so
   *  "the sole one" means exactly zero others remain. */
  async function assertNotLastActiveAdmin(target: User): Promise<void> {
    if (target.role !== "ADMIN" || !target.isActive || target.deletedAt) return; // not currently an active ADMIN — nothing to protect
    const othersRemaining = await usersRepository.countActiveAdmins(target.id);
    if (othersRemaining === 0) {
      throw new AppError(
        "USER_LAST_ADMIN_PROTECTED",
        403,
        "Cannot demote, deactivate, or delete the sole remaining active ADMIN",
      );
    }
  }

  return {
    findByEmailForAuth(email: string): Promise<User | null> {
      return usersRepository.findByEmail(email);
    },

    async createCustomer(data: { email: string; passwordHash: string; name: string; phone?: string }): Promise<User> {
      const user = await usersRepository.create({ ...data, role: "CUSTOMER" });
      await auditWriter.write({
        actorId: null, // self-service registration — no other actor to attribute it to
        action: "CREATE",
        entity: "User",
        entityId: user.id,
        before: null,
        after: user,
      });
      return user;
    },

    async getProfile(userId: string): Promise<ProfileResponse | null> {
      const user = await usersRepository.findById(userId);
      return user ? toProfileResponse(user) : null;
    },

    async recordLogin(userId: string): Promise<void> {
      await usersRepository.update(userId, { lastLoginAt: new Date() });
    },

    async roleOf(userId: string): Promise<"ADMIN" | "MODERATOR" | "CUSTOMER"> {
      const user = await usersRepository.findById(userId);
      if (!user) throw new Error(`roleOf: user ${userId} not found`);
      return user.role;
    },

    /** US2/FR-013: minimal user-management set. */
    async listUsers(params: {
      page: number;
      limit: number;
      role?: "ADMIN" | "MODERATOR" | "CUSTOMER";
      isActive?: boolean;
    }): Promise<{ data: ProfileResponse[]; meta: { page: number; limit: number; total: number } }> {
      const { items, total } = await usersRepository.list(params);
      return { data: items.map(toProfileResponse), meta: { page: params.page, limit: params.limit, total } };
    },

    async changeRole(actorId: string, targetId: string, role: "ADMIN" | "MODERATOR" | "CUSTOMER"): Promise<ProfileResponse> {
      const target = await usersRepository.findById(targetId);
      if (!target || target.deletedAt) throw new AppError("USER_NOT_FOUND", 404, "User not found");

      if (role !== target.role) await assertNotLastActiveAdmin(target);

      const updated = await usersRepository.update(targetId, { role });
      await auditWriter.write({ actorId, action: "UPDATE", entity: "User", entityId: targetId, before: target, after: updated });
      return toProfileResponse(updated);
    },

    async changeActiveStatus(actorId: string, targetId: string, isActive: boolean): Promise<ProfileResponse> {
      const target = await usersRepository.findById(targetId);
      if (!target || target.deletedAt) throw new AppError("USER_NOT_FOUND", 404, "User not found");

      if (!isActive) {
        // FR-014: an ADMIN cannot deactivate their own account, regardless of permission.
        if (actorId === targetId) {
          throw new AppError("USER_SELF_DELETE_FORBIDDEN", 403, "Cannot deactivate your own account");
        }
        await assertNotLastActiveAdmin(target);
      }

      const updated = await usersRepository.update(targetId, { isActive });
      await auditWriter.write({ actorId, action: "UPDATE", entity: "User", entityId: targetId, before: target, after: updated });
      return toProfileResponse(updated);
    },

    async deleteUser(actorId: string, targetId: string): Promise<void> {
      const target = await usersRepository.findById(targetId);
      if (!target || target.deletedAt) throw new AppError("USER_NOT_FOUND", 404, "User not found");

      // FR-014: an ADMIN cannot delete their own account, regardless of permission.
      if (actorId === targetId) {
        throw new AppError("USER_SELF_DELETE_FORBIDDEN", 403, "Cannot delete your own account");
      }
      await assertNotLastActiveAdmin(target);

      const updated = await usersRepository.softDelete(targetId);
      await auditWriter.write({ actorId, action: "DELETE", entity: "User", entityId: targetId, before: target, after: updated });
    },

    /** US4/FR-017. `currentPassword` is verified by the CALLER (route layer has already checked
     *  it via `hash.verifyPassword` before this is invoked) — this method's job is only the
     *  write + audit + knowing whether a password changed (so the route can decide whether to
     *  revoke other sessions, `auth.service.ts`'s job, not this one's). */
    async updateProfile(
      userId: string,
      data: { name?: string; phone?: string; email?: string; passwordHash?: string },
    ): Promise<ProfileResponse> {
      const before = await usersRepository.findById(userId);
      if (!before) throw new AppError("AUTHZ_UNAUTHENTICATED", 401, "Account no longer exists");

      if (data.email && data.email !== before.email) {
        const existing = await usersRepository.findByEmail(data.email);
        if (existing && existing.id !== userId) {
          throw new AppError("AUTH_EMAIL_TAKEN", 409, "Email is already registered");
        }
      }

      const updated = await usersRepository.update(userId, data);
      await auditWriter.write({ actorId: userId, action: "UPDATE", entity: "User", entityId: userId, before, after: updated });
      return toProfileResponse(updated);
    },

    toProfileResponse,
  };
}

export type UsersService = ReturnType<typeof createUsersService>;
