# Feature Specification: Auth & Authorization

**Feature Branch**: `003-auth-authorization`
**Created**: 2026-08-10
**Status**: Draft
**Input**: User description: "Build authentication and authorisation for the Pascca API. JWT access tokens valid 15 minutes and rotating refresh tokens valid 30 days, stored only as hashes. Refresh reuse detection: presenting an already-rotated token revokes the entire token family and forces re-login. httpOnly SameSite cookies for the web clients, bearer tokens for mobile. Authorisation is a seeded role-to-permissions map with a requirePermission('menu:write') preHandler, exactly as specified in Article 14. Implementing role checks as inline conditionals is a constitution violation — a new role must be addable by editing a seed. Endpoints: register, login, refresh, logout, GET /me, PATCH /me. Rate limit all auth routes at five per minute per IP. argon2 password hashing. Invariants to enforce and test: an ADMIN cannot delete their own account; the last active ADMIN cannot be demoted or deactivated; a MODERATOR receives 403 from every menu, gallery, branch, content, user, settings and audit write endpoint. Also build the shared error envelope and the machine-readable error code register in docs/api.md per Article 10, and the AuditLog writer per Article 15. Acceptance: a test asserting the full permission matrix — every role against every admin endpoint — passes, and refresh reuse revokes the family."

## Clarifications

### Session 2026-08-10

- Q: Menu/gallery/branch/content/settings/audit write endpoints don't exist yet (002 built schema only, no API routes) — what hosts the permission-matrix test for those domains? → A: Auth + primitive only. Build auth endpoints, the `requirePermission` preHandler, the seeded role→permission map, and a minimal user-management endpoint set (list/patch-role/patch-active/delete) to host the self-protection invariants. For the domains with no real routes yet, the permission-matrix test mounts test-only example routes proving the guard works generically; real CRUD for those domains ships in its own future feature and inherits the same guard for free.
- Q: "5/min per IP on all auth routes" — one shared bucket across register+login+refresh+logout+me combined, or an independent 5/min bucket per route? → A: One shared bucket. All `/auth/*` routes (register, login, refresh, logout) share a single 5-requests-per-minute-per-IP counter; the 6th request to *any* of them within the window is rejected, not just the 6th to that specific route.
- Q: Does changing password via `PATCH /me` revoke the account's other active sessions, or leave them untouched? → A: Revoke every other refresh-token family for that account; only the session that made the change stays logged in.
- Q: When refresh-token reuse (theft signal) is detected, does the account owner get notified (e.g. email), or is silent logging sufficient? → A: Log/audit only for this feature — no outbound notification; no notification system exists yet in this repo, and a future notifications feature can subscribe to this event later.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Staff sign in and stay signed in (Priority: P1)

A dashboard staff member (ADMIN or MODERATOR) signs in with email and password, gets a short-lived access token plus a rotating refresh token, uses the access token on every dashboard call, and refreshes silently before it expires — no re-entering credentials until they explicitly log out or a session is revoked.

**Why this priority**: Nothing else in the dashboard functions without this — it's the entry gate for every other admin capability, this feature and every one that follows.

**Independent Test**: Seed a staff user; call login with correct and incorrect credentials; call the profile endpoint with the resulting access token; call refresh with the resulting refresh token; call logout; confirm the refresh token no longer works afterward.

**Acceptance Scenarios**:

1. **Given** a seeded ADMIN with known credentials, **When** they log in with the correct email and password, **Then** they receive an access token (~15 minute validity) and a refresh token (~30 day validity), and their last-login timestamp is updated.
2. **Given** a wrong password, **When** login is attempted, **Then** the response is a generic "invalid credentials" failure with no token issued and no hint about which field was wrong.
3. **Given** a valid access token, **When** the caller requests their own profile, **Then** they receive their profile data with no password hash or other credential material present.
4. **Given** an expired or malformed access token, **When** any protected endpoint is called, **Then** the call is rejected as unauthenticated.
5. **Given** a valid, not-yet-used refresh token, **When** it is presented to refresh, **Then** a new access token and a new refresh token are issued, and the presented refresh token stops working for any future refresh.
6. **Given** a valid refresh token, **When** logout is called, **Then** that session is revoked immediately and reusing the same refresh token afterward fails.
7. **Given** an inactive or soft-deleted account, **When** login is attempted with otherwise-correct credentials, **Then** it is rejected — an inactive or deleted account can never obtain tokens.

---

### User Story 2 - Authorization enforced by a seeded permission map (Priority: P1)

Every staff-only action is protected by one reusable permission check, driven entirely by seeded data. A MODERATOR calling an action outside their granted scope is rejected; adding a role or changing what it can do is a seed edit, never a code change to a route handler.

**Why this priority**: This is the actual security boundary every other admin feature will rely on being correct — get it wrong here and every future dashboard feature inherits the flaw.

**Independent Test**: Seed the role→permission grants; call a representative set of permission-gated actions as each role; assert the exact allow/deny outcome for each; confirm a denied call never leaks partial data.

**Acceptance Scenarios**:

1. **Given** the seeded role→permission map, **When** every permission named in the constitution's permission table is checked for ADMIN, **Then** ADMIN is granted every one of them.
2. **Given** the same map, **When** MODERATOR attempts an action requiring any of: menu, category, gallery, branch, or general content writes; testimonial, team, or post writes; user management (beyond their own profile); settings writes; or audit reads, **Then** every one of those attempts is rejected as forbidden.
3. **Given** the same map, **When** MODERATOR attempts reservation read/create/update or message read/update, **Then** the action is permitted.
4. **Given** no credentials at all, **When** a permission-gated action is attempted, **Then** it is rejected as unauthenticated — distinctly, not as forbidden (missing identity and insufficient permission are different failures with different codes).
5. **Given** a new role added to the seed with a chosen subset of permissions, **When** a user holding that role attempts an action, **Then** access follows exactly what the seed grants, with zero changes to any route or handler code.

---

### User Story 3 - Refresh token theft is contained automatically (Priority: P2)

If a refresh token that has already been used once (rotated, replaced) is presented again, the system treats that as evidence of theft: it immediately invalidates every token in that session's family, forcing the legitimate owner to log in again everywhere that family was active.

**Why this priority**: Without this, a single leaked refresh token grants an attacker indefinite silent access. This is the specific mitigation the constitution requires for refresh rotation.

**Independent Test**: Log in, refresh once (token A rotates to token B), then replay token A. Confirm token B — and any other token in the same family — is also rejected afterward, and the legitimate user must log in fresh.

**Acceptance Scenarios**:

1. **Given** a refresh token that has already been rotated once, **When** it is presented again, **Then** the request is rejected and every token sharing its session family is revoked immediately, not just the one presented.
2. **Given** a family was just revoked by reuse detection, **When** the newest, legitimately-issued token in that family is then presented, **Then** it is also rejected — the user must log in again from scratch.
3. **Given** reuse is detected, **When** the event occurs, **Then** it is recorded in a form an operator can review later, without exposing any credential value — no outbound notification (email or otherwise) is sent to the account owner by this feature.

---

### User Story 4 - Customer self-service account (Priority: P3)

A site visitor creates their own account, signs in, and views or updates their own profile — laying groundwork for future customer-facing features without granting any dashboard access.

**Why this priority**: Useful, but nothing else in this phase depends on it; getting staff sign-in and the permission boundary right (User Stories 1–2) matters more right now.

**Independent Test**: Register with a new email; confirm a customer-level account with no dashboard permissions is created and can sign in.

**Acceptance Scenarios**:

1. **Given** a new, unused email, **When** registration is submitted, **Then** a customer-level account is created, the password is stored only as a salted hash, and tokens are issued exactly as they are on login.
2. **Given** an email already in use, **When** registration is attempted, **Then** it is rejected without creating an account and without revealing which existing account owns the email.
3. **Given** a signed-in customer, **When** they update their own name or phone through their profile, **Then** the change is saved and visible on the next profile read; their role and active status cannot be changed through this action.
4. **Given** a signed-in customer, **When** they attempt any staff-only action, **Then** they are rejected as forbidden — the same treatment a MODERATOR gets for an out-of-scope action.

---

### Edge Cases

- Sixth request within one minute to *any combination* of auth routes from the same IP (e.g. 3 login attempts + 3 refresh calls), regardless of whether credentials are correct: rejected as rate-limited — the budget is shared, not per-route.
- Two requests race to refresh using the same refresh token at nearly the same moment: exactly one succeeds; the other is treated as reuse. The system must not crash, must not issue two divergent "next" tokens, and the loser's failure must be handled the same way any reuse failure is.
- Someone attempts to deactivate, soft-delete, or demote the sole remaining active ADMIN — including another ADMIN attempting it — and it is rejected regardless of who requests it.
- An ADMIN attempts to delete or deactivate their own account: rejected even though they otherwise hold full user-management permission — self-targeting is blocked structurally, not by choice.
- A user is deactivated or soft-deleted while they hold a still-unexpired access token: their very next request is rejected — deactivation takes effect immediately, not only at the next login.
- A password change is requested: the caller's current password must be supplied and verified first; on success, every other session belonging to that account is revoked — the session making the change is the only one still logged in afterward.
- An already-expired refresh token (not a reused one) is presented: rejected as invalid/expired, without triggering family-wide revocation — only a token that was already rotated-and-replaced counts as reuse.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let a visitor register a new account with email, password, and name; the account MUST always be created at the lowest (customer) privilege level — no endpoint in this feature can create or promote a staff account.
- **FR-002**: System MUST hash every password with argon2id before storage; the plaintext password MUST never be persisted or logged.
- **FR-003**: System MUST issue access tokens valid for 15 minutes, carrying enough identity/role information to authorize a request without a database round trip for the role check itself.
- **FR-004**: System MUST re-verify, on every authenticated request (not only at login), that the calling account is still active and not soft-deleted — a deactivation or deletion MUST take effect on the very next request, independent of the access token's remaining lifetime.
- **FR-005**: System MUST issue refresh tokens valid for 30 days, persisted only as a hash, never in retrievable plaintext form.
- **FR-006**: System MUST rotate the refresh token on every successful refresh: the presented token becomes permanently unusable and a new token is issued in the same session family.
- **FR-007**: System MUST detect refresh-token reuse — a token already marked rotated/replaced being presented again — and MUST respond by revoking every token in that session family, not only the reused one.
- **FR-008**: System MUST let a caller log out, revoking the specific session/family presented; other sessions for the same account remain valid (logging out "everywhere" is a separate capability, out of scope here — see Assumptions).
- **FR-009**: For web clients, the refresh token MUST be delivered only as an httpOnly, SameSite, secure cookie — never exposed in a response body reachable by client-side script. The access token MUST be returned in the response body for the web client to hold and send as a bearer credential.
- **FR-010**: For mobile clients, both the access and refresh tokens MUST be returned in the response body; secure on-device storage is the mobile client's responsibility.
- **FR-011**: System MUST provide one reusable authorization check (a single named capability, e.g. `requirePermission('menu:write')`) that every permission-gated action goes through; the grant it checks against MUST come entirely from seeded data — no route or handler may compare a role directly (`if (user.role === 'ADMIN')` and equivalents are forbidden).
- **FR-012**: The seeded role→permission data MUST cover every permission named in the constitution's permission table, for every role the system defines; adding a role or changing what it can do MUST require editing only the seed, never any route or handler code.
- **FR-013**: System MUST provide a minimal set of user-management actions (list users, change a user's role, change a user's active status, delete a user) sufficient to host and test the self-protection invariants (FR-014, FR-015) and the `user:*` row of the permission table. Real, full-featured CRUD for the other Tier 1 domains named in the permission table (menu, gallery, branch, general content, testimonials, team, posts, settings, audit) is **not** built by this feature — each ships in its own future feature and reuses the same authorization check (FR-011) for free. This feature's permission-matrix test proves the check itself is correct for every permission string, using test-only example routes for the domains that don't have real endpoints yet.
- **FR-014**: System MUST reject any attempt by an ADMIN to delete or deactivate their own account, regardless of their permissions.
- **FR-015**: System MUST reject any attempt — by anyone, including another ADMIN — to demote, deactivate, or delete the sole remaining active ADMIN account.
- **FR-016**: System MUST let an authenticated caller read their own profile, excluding password hash and any field the constitution restricts from leaving via a non-internal endpoint.
- **FR-017**: System MUST let an authenticated caller update their own name, phone, email, and password (current password required to change the password); role and active status MUST NOT be changeable through this action, by anyone, for any account. A successful password change MUST revoke every other active session (every other refresh-token family) belonging to that account — only the session that performed the change remains logged in.
- **FR-018**: System MUST rate-limit all `/auth/*` routes (register, login, refresh, logout) to a single shared budget of 5 requests per minute per IP address — one combined counter across all of them, not an independent 5/minute allowance per route — independent of whether individual requests succeed or fail.
- **FR-019**: Every response from this feature's endpoints MUST use the shared enveloped shape (success/data/meta on success; success=false/error{code,message,details} on failure).
- **FR-020**: Every distinct failure mode this feature introduces MUST have a permanent, machine-readable code registered in the shared error-code register before the feature is considered done; clients are expected to switch on that code, never on the message text.
- **FR-021**: Every create, update, or delete this feature performs on a user account MUST write an audit record (actor, entity, entity id, before/after diff). Refresh-token issuance, rotation, and revocation do not additionally require a separate audit record — the refresh-token history itself is the append-only record of that activity.
- **FR-022**: No password, token value, or other credential MUST ever appear in a log line produced by this feature.

### Always-On Requirements

These come from the constitution and apply to every feature. State how this feature satisfies
each, or `N/A` with a reason — do not delete the rows.

- **AR-001** (Art 3): No marketing/site content is introduced by this feature — N/A. (The role→permission grant added here is security configuration, not visitor-facing content; it is still seed-editable data per AR-005/FR-012, just not part of the three-tier content model.)
- **AR-002** (Art 4): Every capability is a `/api/v1` endpoint a mobile client could call with zero backend changes — `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me`, `PATCH /me`, plus the minimal user-management set from FR-013. Access-token bearer usage is identical for web and mobile; only refresh-token transport differs (cookie vs. body), and that difference is at the transport layer, not a capability gap.
- **AR-003** (Art 21): This is a backend-only feature; there is no UI surface to translate. Error `message` text is not the contract (AR-004/FR-020) — clients render user-facing, bilingual copy from the returned `code`, which is locale-independent by construction. N/A beyond that guarantee.
- **AR-004** (Art 10): Starter failure modes this feature registers (final codes and exact wording finalized in `docs/api.md` during implementation): invalid credentials, account inactive/deleted, email already registered, access token expired/invalid, refresh token expired/invalid, refresh reuse detected, rate limited, unauthenticated, forbidden, cannot self-delete/self-deactivate, last-active-ADMIN protected.
- **AR-005** (Art 14): Fully addressed — this feature *is* the seeded role→permission map and the `requirePermission` preHandler every other feature will depend on (FR-011, FR-012). MODERATOR and CUSTOMER see no dashboard-only controls at all (nothing rendered, not disabled) once the admin dashboard consumes this API; enforcement itself lives at the API layer, which is the real gate.
- **AR-006** (Art 15): User create/update/delete writes an `AuditLog` diff (FR-021). Refresh tokens are append-only session history (existing schema comment: "no updatedAt, no deletedAt") and are not additionally audit-logged. No `ReservationEvent` involvement — this feature touches no reservation.
- **AR-007** (Art 28): No UI surface in this feature — N/A. (Consuming clients' accessibility obligations are that client's feature, not this one's.)

### Key Entities *(include if feature involves data)*

- **User** *(existing, from 002-content-schema-seed)*: identity record — email, password hash, role, active flag, soft-delete timestamp, last-login timestamp. This feature is the first to actually read/write it through live login, registration, and profile actions; `isActive`/`deletedAt` become load-bearing for FR-004's live authorization re-check.
- **RefreshToken** *(existing, from 002-content-schema-seed)*: one row per issued session, holding only a token hash, its session-family id, expiry, and rotation/revocation state. This feature is the first to give it real read/write logic (issue, rotate, revoke, detect reuse via family id).
- **Role→Permission grant** *(new)*: a data-backed association between a role and a permission string (e.g. ADMIN↔`menu:write`). This *is* the "seeded map" the constitution requires — the only way to add a role or change what it can do is to edit the seed that populates this data, never a code path that compares a role directly.
- **AuditLog** *(existing, from 002-content-schema-seed)*: this feature is the first to actually write to it — one entry per user create/update/delete, with actor, entity, entity id, and a before/after diff.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A staff member can complete sign-in and successfully reach their first authenticated action in under 2 seconds end-to-end under normal conditions.
- **SC-002**: 100% of the constitution's permission table — every role crossed with every permission it lists — is asserted by an automated test, and every assertion passes.
- **SC-003**: A stolen-then-reused refresh token is detected and its entire session family is invalidated within the same request that detects the reuse — no window in which both the thief and the legitimate owner hold working tokens after detection.
- **SC-004**: Across the full test suite, zero responses from this feature ever expose a raw internal error, an unregistered error code, or a password hash.
- **SC-005**: An account deactivated by an administrator loses API access within its very next request, regardless of how much validity remains on any token it's holding.
- **SC-006**: The sole active ADMIN account cannot be locked out of ADMIN-only capability by any ordering of demote/deactivate/delete attempts, including attempts from itself or from another ADMIN — verified by testing an exhaustive set of such orderings.

## Assumptions

- `POST /auth/register` is public and always creates a customer-level account; ADMIN and MODERATOR accounts are provisioned only through the existing seed (`apps/api/prisma/seed/users.ts`) or a future dedicated staff-invitation feature — nothing in this feature can create or promote a staff account.
- "Logout" revokes only the single session/family presented. A separate "log out of every device" action was not requested and is out of scope.
- Password reset, forgot-password, and email-verification flows are not in the requested endpoint list and are out of scope for this feature.
- No outbound notification (email or otherwise) is sent on refresh-token-reuse detection; this feature only logs/audits the event. No notification system exists yet in this repo to send through.
- Real CRUD endpoints for menu, gallery, branch, general content, testimonials, team, posts, settings, and audit are **not** built by this feature (per the Clarifications entry above); this feature only proves its authorization check works for every permission string those future features will use.
- Access tokens are JSON Web Tokens; refresh tokens are opaque random values (not JWTs) — matching the existing `RefreshToken.tokenHash` unique column already present in the schema from 002-content-schema-seed.
- Rate limiting is per IP address, not per account, matching the constitution's literal wording ("5/min on ... all /auth/*").
- No dashboard UI is built to edit the role→permission grant in this feature; it is seed-only for now, consistent with the scope decision in Clarifications.

## Constitution Impact *(mandatory)*

**Articles this feature is governed by**: 1, 4, 8, 9, 10, 11, 14, 15, 21, 29, 30, 31

**Non-negotiable [NN] articles touched**: 9 (adds `/api/v1` endpoints, breaks none), 10 (error envelope + code register), 14 (this feature *is* the permission system), 15 (AuditLog writer), 21 (confirmed N/A at this layer — see AR-003), 29 (this feature *is* the security baseline: argon2, refresh rotation + reuse detection, cookie/bearer split, rate limiting)

**Out of scope by Article 1**: confirmed — no ordering, payment, loyalty, or delivery-tracking work, not even scaffolding or a stubbed table.

**Amendment needed?**: No.
