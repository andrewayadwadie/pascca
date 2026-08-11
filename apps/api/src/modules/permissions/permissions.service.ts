// 003-auth-authorization (T040, research R6). Business rules only. The grant map is loaded once
// into MODULE-LEVEL state (not per-factory-instance state) — Node/ESM module instances are
// already process-wide singletons, so this is the natural way to guarantee "loaded once at
// boot" holds even if `createPermissionsService` is ever accidentally constructed more than
// once (each construction reads the same shared cache rather than racing to build its own).
// There is no live-editing UI for `RolePermission` in this feature (spec.md Assumptions) — the
// only way the underlying table changes is a re-seed with the process stopped, so there is no
// running-server window where this cache could go stale.
import type { Role } from "@prisma/client";
import type { PermissionsRepository } from "./permissions.repository.ts";

let cache: Map<Role, Set<string>> | null = null;

export function createPermissionsService(permissionsRepository: PermissionsRepository) {
  return {
    /** Called once at boot (app.ts's composition, before any request is served). Idempotent — a
     *  second call is a no-op if the cache is already populated. */
    async load(): Promise<void> {
      if (cache) return;
      const grants = await permissionsRepository.findAll();
      const map = new Map<Role, Set<string>>();
      for (const grant of grants) {
        const set = map.get(grant.role) ?? new Set<string>();
        set.add(grant.permission);
        map.set(grant.role, set);
      }
      cache = map;
    },

    hasPermission(role: Role, permission: string): boolean {
      if (!cache) throw new Error("permissions.service.load() was never called before a permission check");
      return cache.get(role)?.has(permission) ?? false;
    },

    listAll(): Record<Role, string[]> {
      if (!cache) throw new Error("permissions.service.load() was never called before listAll()");
      const result = {} as Record<Role, string[]>;
      for (const [role, permissions] of cache.entries()) {
        result[role] = [...permissions].sort();
      }
      return result;
    },
  };
}

export type PermissionsService = ReturnType<typeof createPermissionsService>;

/** Test-only escape hatch — `resetDatabase()` between test files truncates `RolePermission`,
 *  and a subsequent re-seed needs the next `load()` to actually re-read, not reuse a stale
 *  in-memory snapshot from a previous test file's app instance. */
export function __resetPermissionsCacheForTests(): void {
  cache = null;
}
