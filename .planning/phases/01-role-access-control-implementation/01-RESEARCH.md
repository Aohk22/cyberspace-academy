# Phase 1: Role access control implementation - Research

**Researched:** 2026-07-17
**Domain:** Centralized RBAC (`can(user, action)`) + migration of ~15 scattered checks in a React Router v7 SSR app
**Confidence:** HIGH

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Adopt a single `can(user, action)` helper as the unified permission API. (CONTEXT.md locates it in `app/.server/auth/permissions.ts` — **see Critical Finding: this location is invalid for client use; research overrides the path, not the intent.**)
- **D-02:** First `can()` version covers ONLY three actions that already have implicit checks today: `admin` (staff-only), `accessChallenges` (lite/pro), `viewAsLearner` (staff preview). No broad catalog.
- **D-03:** `can()` must be SHARED — usable both in server `.server` code and in client pages via `userContext`. One function. Accepts the full user object (`role`, `isStaff`, `subscriptionEndsAt`) and replicates `auth.ts` effective-role + `viewAsLearner` logic internally.
- **D-04:** Full migration now — replace ALL existing `user.role !== 'staff'` / `canAccessChallenges` / role-enum literals across the ~15 files. Removes the role-vocabulary inconsistency at the same time.

### the agent's Discretion

- Exact internal implementation of `can()` (role-rank ordering, action table shape) — must stay a single shared function covering the three actions.
- How to reconcile stale `Role = 'student' | 'staff'` in `app/types.ts` (D-04 cleanup).
- Naming of `action` literals (string union vs enum) — fit existing conventions.

### Deferred Ideas (OUT OF SCOPE)

- None.

## Summary

This phase establishes a single `can(user, action)` permission function and migrates every ad-hoc role check in the codebase to it. The codebase currently has ~15 call sites: an `admin.ts` middleware guard, 8 admin page guards (repeated `user.role !== 'staff'`), `CourseBuilder`/`CourseBuilderLesson`, `IndexRedirect`, `Challenges` (via `canAccessChallenges`), and `AdminUserEdit`/`AdminCreateUser` role zod-enums. There is also a stale `Role = 'student' | 'staff'` type in `app/types.ts` that conflicts with the authoritative `learner | lite | pro | staff` vocabulary.

The single most important research finding is a **contradiction inside the locked decision**: CONTEXT.md D-01 places `can()` in `app/.server/auth/permissions.ts` but D-03 requires it to be usable client-side (via `userContext` inside render bodies, e.g. `MainLayout.tsx`). In React Router v7, any `app/.server/` file or directory is **server-only** — the build fails with "Server-only module referenced by client" if a client component imports a value from it. `Challenges.tsx` today imports `canAccessChallenges` from `app/.server/payment/access` _only because it calls it inside `loader`/`action`_, which React Router strips from the client bundle. Any usage inside a component render body would break. Therefore `can()` must live in a **shared, non-`.server`** location and be imported by both client pages and `.server` modules.

**Primary recommendation:** Place `can()` in a shared module `app/auth/permissions.ts` (no `.server` suffix), typed against the existing `UserContext` plus a new `viewAsLearner` field. Because `authMiddleware` already computes the _effective_ role (downgrades expired `lite`/`pro` → `learner`, and applies `viewAsLearner` to flip staff → learner), `can()` can be a pure read of that already-resolved object — no DB, no recomputation. Move `CHALLENGE_ACCESS` logic out of `access.ts` into `can()`; keep `canAccessAI`/`getAIMessageLimit` in `access.ts` (still used by `chat/handler.ts`). Delete `canAccessChallenges` and update `access.test.ts`.

## Architectural Responsibility Map

| Capability                                         | Primary Tier                     | Secondary Tier                            | Rationale                                                                                            |
| -------------------------------------------------- | -------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Resolve effective role (downgrade + viewAsLearner) | API / Backend (auth middleware)  | —                                         | `authMiddleware` is the single trusted resolver; `can()` must NOT re-derive, only read.              |
| `can(user, action)` evaluation                     | Shared (importable by both)      | Client render body + Server loader/action | Must run in component bodies (nav, MainLayout) AND server guards; therefore lives outside `.server`. |
| Admin route guard                                  | API / Backend (middleware)       | —                                         | `adminMiddleware` throws redirect; can call `can(user,'admin')`.                                     |
| Challenge submit gate                              | API / Backend (loader/action)    | —                                         | Today gated in `Challenges.tsx` loader/action; migrates to `can(user,'accessChallenges')`.           |
| Staff "view as learner" preview toggle             | API / Backend (ToggleView route) | Client (to reflect UI)                    | Toggle writes session `viewAsLearner`; `can(user,'viewAsLearner')` reads it for UI/guard.            |

## Critical Finding: `.server` boundary (must read before planning)

**Verified (official React Router v7 docs + GitHub issue #14997):** `app/.server/` directories are server-only. The build fails with `Error: Server-only module referenced by client` if a `.server` value is imported into a module that participates in the client graph (any route component default export, layout, or component used in render).

- The React Router v7 compiler automatically strips `loader`, `action`, `middleware`, `headers` exports from client bundles. So a `.server` import used _only_ inside those functions is safe (this is why `Challenges.tsx` importing `canAccessChallenges` works today — it's only called in `loader`/`action`).
- A `.server` import used in a **render body** is NOT stripped → build error. `MainLayout.tsx` (lines 66, 188, 198) reads `user.role` directly in render — this is the canonical client-side `can()` use case and CANNOT come from `app/.server/`.
- `app/utils/` already exists as a shared (non-`.server`) directory and is the natural home. Recommended path: **`app/auth/permissions.ts`** (sibling of `app/.server/auth/`, but without the `.server` suffix). Both `app/.server/auth/*` and client pages import from it.

**Resolution for D-01:** Keep the _intent_ (single `can()` in one `auth/permissions` module) but place it at `app/auth/permissions.ts`, not `app/.server/auth/permissions.ts`. This is the minimal change that satisfies D-03.

## Standard Stack

This is a **refactor with no new dependencies**. The phase reuses existing stack:

| Library                                                               | Version                                                  | Purpose                                                         | Why Standard                                        |
| --------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| react-router v7 (framework mode, `ssr: true`, `future.v8_middleware`) | [VERIFIED: repo `react-router.config.ts` + package.json] | Routing, middleware, `.server` boundary enforcement             | Existing app framework; `.server` rule is built-in  |
| zod v4                                                                | [VERIFIED: AGENTS.md]                                    | Role-enum validation in admin forms                             | Already used; reconcile `['learner','staff']` enums |
| TypeScript `verbatimModuleSyntax: true`                               | [VERIFIED: tsconfig.json]                                | `import type` vs value separation matters for `.server` imports | Affects how `can()` types are imported on client    |
| vitest                                                                | [VERIFIED: `vitest.config.ts`, `app/**/*.test.ts`]       | Unit tests for `can()`                                          | Existing test runner; no new install                |

**Installation:** None required. No packages added.

## Package Legitimacy Audit

**Not applicable** — this phase installs zero external packages; it is a pure code-refactor/migration. No `SLOP`/`SUS` packages possible.

## Architecture Patterns

### System Architecture Diagram

```
                ┌─────────────────────────────────────────┐
                │  authMiddleware (app/middleware/auth.ts)  │
                │  resolves: effectiveRole, isStaff,        │
                │  viewAsLearner, subscriptionEndsAt        │
                │  (downgrade lite/pro→learner on expiry)   │
                └───────────────────┬───────────────────────┘
                                    │ sets userContext
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │  UserContext { id, name, role(effective), isStaff,  │
        │               subscriptionEndsAt, viewAsLearner* }  │
        └───────┬───────────────────────────┬─────────────────┘
                │                           │
   ┌────────────▼───────────┐   ┌───────────▼────────────────┐
   │  Server .server code   │   │  Client components (render) │
   │  - adminMiddleware     │   │  - MainLayout nav           │
   │  - Challenges loader/  │   │  - AdminUserEdit form       │
   │    action gate         │   │  - IndexRedirect            │
   │  - CourseExport        │   │                             │
   └────────────┬───────────┘   └───────────┬────────────────┘
                │                           │
                └─────────┬─────────────────┘
                          ▼
            ┌──────────────────────────────────┐
            │  app/auth/permissions.ts          │  ← SHARED, no .server
            │  can(user, action): boolean       │
            │   action ∈ 'admin' |              │
            │     'accessChallenges' |          │
            │     'viewAsLearner'               │
            └──────────────────────────────────┘
```

### Recommended Project Structure (new/changed files)

```
app/
├── auth/
│   └── permissions.ts        # NEW — shared can() + Action type. NO .server suffix.
├── .server/
│   ├── auth/
│   │   └── (sessions.ts, login.ts, register.ts unchanged)
│   └── payment/
│       └── access.ts         # EDIT — remove canAccessChallenges + CHALLENGE_ACCESS; keep AI fns
├── context.ts                # EDIT — add viewAsLearner: boolean to UserContext
├── middleware/
│   ├── auth.ts               # EDIT — pass viewAsLearner into userContext.set
│   └── admin.ts              # EDIT — use can(user,'admin')
├── types.ts                  # EDIT/DELETE — reconcile Role type (see below)
└── pages/ ...                # EDIT — 12 files migrate guards to can()
```

### Pattern 1: `can()` reads the already-resolved effective user

**What:** Because `authMiddleware` already computes effective role (downgrade + viewAsLearner), `can()` is a pure function of the `UserContext` object — no session, no DB.

**When to use:** Every permission check. Server guards call it from `loader`/`action`/`middleware`; client components call it from render with the `useUserContext()` value.

**Example:**

```typescript
// Source: derived from app/middleware/auth.ts effective-role logic (VERIFIED in repo)
// app/auth/permissions.ts  (NO .server suffix — shared module)
import type { UserContext } from '~/context'

export type Action = 'admin' | 'accessChallenges' | 'viewAsLearner'

export function can(user: UserContext | null, action: Action): boolean {
	if (!user) return false
	switch (action) {
		case 'admin':
			// effective role already applied by authMiddleware; staff stays staff
			// unless viewAsLearner flipped it to 'learner' (which is not admin).
			return user.role === 'staff'
		case 'accessChallenges':
			// lite/pro are NOT downgraded to learner in effective role unless expired;
			// authMiddleware already downgraded expired subs to 'learner'.
			return user.role === 'lite' || user.role === 'pro'
		case 'viewAsLearner':
			return user.viewAsLearner === true
	}
}
```

> Note: `isStaff` mirrors `role === 'staff'` post-resolution, but `viewAsLearner` flips effective role to `'learner'` _without_ clearing `isStaff`. `can(user,'admin')` must use `role === 'staff'` (NOT `isStaff`) so that a staff member previewing as learner loses admin access during preview — matching current `effectiveRole` semantics.

### Anti-Patterns to Avoid

- **Putting `can()` in `app/.server/`:** breaks client build (see Critical Finding). Use `app/auth/permissions.ts`.
- **Re-deriving subscription expiry inside `can()`:** `authMiddleware` already downgraded the role; duplicating the `new Date()` comparison risks drift and double-downgrade bugs. Read `user.role` only.
- **Adding `viewAsLearner` as a `can()` parameter instead of a `UserContext` field:** forces every call site to thread the session flag; instead extend `UserContext` once.
- **Deleting `canAccessAI`/`getAIMessageLimit` from `access.ts`:** still used by `app/.server/chat/handler.ts`. Only remove `canAccessChallenges`.

## Don't Hand-Roll

| Problem                      | Don't Build                          | Use Instead                                        | Why                                                            |
| ---------------------------- | ------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------- |
| Role→boolean access map      | Custom `if/else` per page            | Single `can()` switch over a string-union `Action` | 15 duplicated checks today; one function = one source of truth |
| Subscription downgrade logic | Recompute expiry in `can()`          | Trust `authMiddleware` effective role              | Avoids drift; middleware already mutates DB on expiry          |
| Client/server duplication    | Two copies of `can()` (one per tier) | One shared `app/auth/permissions.ts`               | `.server` boundary forbids sharing; shared location solves it  |

**Key insight:** The hardest part is the module boundary, not the logic. React Router v7's `.server` convention is a build-time hard wall — get the file location right and the rest is mechanical.

## Runtime State Inventory

> Rename/refactor phase — but this is a pure code migration with NO persisted runtime state keyed by the renamed token. The "role" vocabulary lives in the DB `users.role` column, which is **authoritative and unchanged** (`learner/lite/pro/staff`). We are NOT renaming DB roles — only unifying TypeScript vocabulary and centralizing checks.

| Category            | Items Found                                                                                       | Action Required                                   |
| ------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Stored data         | `users.role` column (`varchar(20)`, values `learner/lite/pro/staff`) — authoritative, NOT renamed | None — DB schema untouched                        |
| Live service config | None — no external service stores role strings                                                    | None                                              |
| OS-registered state | None                                                                                              | None                                              |
| Secrets/env vars    | None                                                                                              | None                                              |
| Build artifacts     | None — no compiled artifacts keyed by old `Role` type                                             | None — `app/types.ts` `Role` is compile-time only |

**Nothing found requiring data migration.** The only `Role = 'student' | 'staff'` is a dead TS type (never imported — verified via grep) and is safe to delete/repurpose with no runtime impact.

## Common Pitfalls

### Pitfall 1: `can()` location triggers "Server-only module referenced by client"

**What goes wrong:** Build fails because `can()` (placed in `app/.server/`) is imported in `MainLayout.tsx` render body.
**Why it happens:** RRv7 strips `.server` imports only from `loader`/`action`/`middleware`/`headers`, not from component bodies.
**How to avoid:** Place `can()` in `app/auth/permissions.ts` (no `.server`). Import with `import type { Action }` for types under `verbatimModuleSyntax`.
**Warning signs:** Any import of `permissions` inside a `export default function` component body from a `.server` path.

### Pitfall 2: `viewAsLearner` not available to `can()`

**What goes wrong:** `can(user,'viewAsLearner')` always returns false because `UserContext` doesn't carry the flag.
**Why it happens:** `authMiddleware` reads `viewAsLearner` from session but never forwards it to `context.set(userContext, …)`.
**How to avoid:** Add `viewAsLearner: boolean` to `UserContext` type AND set it in both branches of `authMiddleware` (default `false` in the `getUserById` branch).
**Warning signs:** `user.viewAsLearner` is `undefined` in components.

### Pitfall 3: `can(user,'admin')` uses `isStaff` instead of `role === 'staff'`

**What goes wrong:** Staff previewing as learner (effective role `'learner'`, `isStaff` still `true`) retains admin access during preview.
**Why it happens:** Confusing `isStaff` (never cleared by viewAsLearner) with current effective role.
**How to avoid:** Use `user.role === 'staff'` (effective role already flipped to `'learner'` under preview).
**Warning signs:** Admin nav visible while "view as learner" active.

### Pitfall 4: Breaking `canAccessAI` by over-deleting `access.ts`

**What goes wrong:** `chat/handler.ts` breaks after `access.ts` cleanup.
**Why it happens:** Removing the whole file instead of just `canAccessChallenges` + `CHALLENGE_ACCESS`.
**How to avoid:** Remove only `canAccessChallenges`, `CHALLENGE_ACCESS`; keep `canAccessAI`, `getAIMessageLimit`, `AI_MESSAGE_LIMITS`, `SubscriptionRole`.
**Warning signs:** `typecheck` errors referencing `canAccessAI` in `chat/handler.ts`.

### Pitfall 5: Forgetting to update `access.test.ts`

**What goes wrong:** Test imports `canAccessChallenges` which no longer exists → typecheck fails (blocking per AGENTS.md).
**Why it happens:** Test not migrated alongside source.
**How to avoid:** Rewrite `access.test.ts` (or move to `permissions.test.ts`) to cover `can()` for the three actions; delete the `canAccessChallenges` describe block.
**Warning signs:** `pnpm run typecheck` fails on `app/.server/payment/access.test.ts`.

## Code Examples

### Migrating an admin page guard (server-side, in loader/action)

```typescript
// BEFORE (app/pages/admin/AdminUsers.tsx:37)
if (user.role !== 'staff') throw redirect('/')

// AFTER
import { can } from '~/auth/permissions'
if (!can(user, 'admin')) throw redirect('/')
```

### Migrating a client render-body check (MainLayout)

```typescript
// BEFORE (MainLayout.tsx:188)
{user.role === 'staff' && (<staff nav>)}

// AFTER
import { can } from '~/auth/permissions'
{user && can(user, 'admin') && (<staff nav>)}
```

> This import is safe ONLY because `permissions.ts` is NOT in `.server/`.

### Migrating Challenges gate

```typescript
// BEFORE (Challenges.tsx:82,103)
import { canAccessChallenges } from '~/.server/payment/access'
const canSubmit = canAccessChallenges(user.role)
if (!canAccessChallenges(user.role)) return { error: '...' }

// AFTER
import { can } from '~/auth/permissions'
const canSubmit = can(user, 'accessChallenges')
if (!can(user, 'accessChallenges'))
	return { error: 'Upgrade to Lite or Pro to submit flags.' }
```

### Extending UserContext (context.ts)

```typescript
export type UserContext = {
	id: number
	name: string
	role: string
	isStaff: boolean
	subscriptionEndsAt: string | null
	viewAsLearner: boolean // NEW — required for can(user,'viewAsLearner')
}
```

## State of the Art

| Old Approach                                               | Current Approach                                               | When Changed                                                   | Impact                                     |
| ---------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------ | ------------------------ |
| Scattered `user.role !== 'staff'` literals (15 sites)      | Single `can(user, action)`                                     | This phase                                                     | One source of truth; easier future actions |
| `canAccessChallenges(role: string)` in `payment/access.ts` | `can(user,'accessChallenges')` in shared `auth/permissions.ts` | This phase                                                     | Challenge logic moves to permission layer  |
| `Role = 'student'                                          | 'staff'` stale type                                            | Deleted / reconciled to `UserRole = learner\|lite\|pro\|staff` | This phase                                 | Removes vocabulary drift |

**Deprecated/outdated:**

- `app/types.ts` `Role = 'student' | 'staff'`: dead type (never imported). Replace usages with `UserRole` from `app/.server/database/types.ts` or delete the file. `[ASSUMED]` that no test imports it — verified by grep (no importers found), confidence HIGH that deletion is safe.
- Admin form `z.enum(['learner','staff'])`: excludes `lite`/`pro`, a latent bug. While D-04 says "reconcile," note this enum should become `z.enum(['learner','lite','pro','staff'])` or `z.enum(USER_ROLES)` to match schema. Flag to planner as a recommended fix inside D-04.

## Assumptions Log

| #   | Claim                                                                                                               | Section                                    | Risk if Wrong                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| A1  | `app/types.ts` `Role` is never imported anywhere (dead code)                                                        | Runtime State Inventory / State of the Art | LOW — grep found zero importers; deletion safe                 |
| A2  | `authMiddleware` is the only place effective role is computed and all 15 sites read `userContext` (not raw session) | Architecture Patterns                      | LOW — verified: all guard sites use `context.get(userContext)` |
| A3  | `viewAsLearner` should be added to `UserContext` (vs. passed separately to `can()`)                                 | Pattern 1 / Pitfall 2                      | LOW — either design works; adding to context is cleaner        |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Exact `can()` return for `null` user?**
    - What we know: Most guards today assume a resolved non-null user (middleware redirects if unauthenticated).
    - What's unclear: Should `can(null, action)` throw or return `false`?
    - Recommendation: Return `false` (defensive). Admin pages already guard null via `NoUserContextError` in loaders; `can()` returning false is a safe default.

2. **Should `accessChallenges` equal "not learner"?**
    - What we know: `CHALLENGE_ACCESS` grants `lite`/`pro` only; `learner` (incl. downgraded/expired) denied.
    - What's unclear: Whether `staff` should access challenges (current `CHALLENGE_ACCESS` map has no `staff` key → `?? false` → denied).
    - Recommendation: Preserve current behavior — `staff` denied challenges unless they also hold a sub. `can(user,'accessChallenges')` = `lite|pro` only. Confirm with user if staff should get free challenge access.

3. **`MainLayout` `canUseAI = user.role !== 'learner'` (line 66) — in scope?**
    - What we know: D-02 lists only `admin`, `accessChallenges`, `viewAsLearner`. AI access is governed by `canAccessAI` in `access.ts`, separate from this phase.
    - What's unclear: Leave `canUseAI` as-is or also route through `can()`?
    - Recommendation: OUT OF SCOPE per D-02. Leave `canUseAI` untouched to avoid scope creep (but note it reads effective role correctly already).

## Validation Architecture

> `.planning/config.json` absent → `nyquist_validation` treated as enabled.

### Test Framework

| Property           | Value                                                           |
| ------------------ | --------------------------------------------------------------- |
| Framework          | vitest (config: `vitest.config.ts`, include `app/**/*.test.ts`) |
| Config file        | `vitest.config.ts` (exists)                                     |
| Quick run command  | `pnpm exec vitest run app/auth/permissions.test.ts`             |
| Full suite command | `pnpm exec vitest run`                                          |

### Phase Requirements → Test Map

| Req ID | Behavior                                           | Test Type          | Automated Command                         | File Exists?  |
| ------ | -------------------------------------------------- | ------------------ | ----------------------------------------- | ------------- |
| D-01   | `can()` exists, single shared function             | unit               | `vitest run app/auth/permissions.test.ts` | ❌ Wave 0     |
| D-02   | `admin`/`accessChallenges`/`viewAsLearner` correct | unit               | `vitest run app/auth/permissions.test.ts` | ❌ Wave 0     |
| D-03   | usable client+server (import path compiles)        | typecheck          | `pnpm run typecheck`                      | ✅ (existing) |
| D-04   | all 15 sites migrated; typecheck clean             | typecheck + manual | `pnpm run typecheck`                      | ✅ (existing) |

### Sampling Rate

- **Per task commit:** `pnpm run typecheck` (AGENTS.md mandates before commit) + `vitest run app/auth/permissions.test.ts`
- **Per wave merge:** `pnpm exec vitest run` + `pnpm run typecheck` + `pnpm run fmt`
- **Phase gate:** typecheck + fmt + full vitest green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `app/auth/permissions.test.ts` — covers D-01/D-02 (admin/accessChallenges/viewAsLearner, including viewAsLearner preview flip)
- [ ] Migrate `app/.server/payment/access.test.ts` — remove `canAccessChallenges` describe block (or delete file if only that was tested)
- [ ] `UserContext.viewAsLearner` added to `context.ts` + set in `authMiddleware` both branches

## Security Domain

> `security_enforcement` not set to false → enabled.

### Applicable ASVS Categories

| ASVS Category         | Applies        | Standard Control                                                                                                               |
| --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| V2 Authentication     | no (unchanged) | session cookies (existing)                                                                                                     |
| V3 Session Management | no (unchanged) | existing                                                                                                                       |
| V4 Access Control     | **yes**        | `can(user, action)` centralized ABAC-lite check replaces scattered literals — improves consistency, reduces missing-guard bugs |
| V5 Input Validation   | yes            | admin role `z.enum` must include `lite`/`pro` (reconcile in D-04)                                                              |
| V6 Cryptography       | no             | n/a                                                                                                                            |

### Known Threat Patterns for this stack

| Pattern                                                               | STRIDE                 | Standard Mitigation                                                       |
| --------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| Missing/Bypassed admin guard (forgotten `!== 'staff'` at a new route) | Elevation of Privilege | Central `can(user,'admin')` — single chokepoint; new routes import it     |
| Inconsistent effective-role handling (one site forgets downgrade)     | Tampering/Elevation    | `can()` reads only middleware-resolved effective role; no site re-derives |
| Role enum narrower than DB (admin form rejects valid `lite`/`pro`)    | Integrity              | Reconcile `z.enum` to `USER_ROLES` in D-04                                |

## Sources

### Primary (HIGH confidence)

- React Router v7 official docs — Server Modules / `.server` directories: https://reactrouter.com/api/framework-conventions/server-modules (verified: `.server` build fails if imported by client)
- React Router GitHub issue #14997 "Server-only module referenced by client" (verified: client render-body import of `.server` value breaks build)
- Repo files (verified by direct read): `app/middleware/auth.ts`, `app/middleware/admin.ts`, `app/context.ts`, `app/.server/payment/access.ts`, `app/.server/database/types.ts`, `app/types.ts`, `react-router.config.ts`, `vitest.config.ts`, `tsconfig.json`

### Secondary (MEDIUM confidence)

- Repo grep audit of all 15 call sites (verified via `rg`): confirmed scope and exact lines.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - existing stack, no new deps, verified in repo
- Architecture: HIGH - `.server` boundary behavior verified against official docs + repo; `can()` design derived directly from existing `authMiddleware` logic
- Pitfalls: HIGH - each pitfall traced to a concrete repo line or documented RRv7 behavior

**Research date:** 2026-07-17
**Valid until:** 2026-08-16 (stable framework behavior; 30-day validity)
