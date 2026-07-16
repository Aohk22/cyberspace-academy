# Phase 1: Role access control implementation - Pattern Map

**Mapped:** 2026-07-17
**Files analyzed:** 23 (1 new module + 1 new test + 21 modified/cleaned)
**Analogs found:** 23 / 23 (all share the `userContext` + `user.role !== 'staff'` / `canAccessChallenges` patterns)

## File Classification

| New/Modified File                     | Role             | Data Flow                        | Closest Analog                                              | Match Quality                    |
| ------------------------------------- | ---------------- | -------------------------------- | ----------------------------------------------------------- | -------------------------------- |
| `app/auth/permissions.ts` (NEW)       | utility (shared) | request-response (pure fn)       | `app/.server/payment/access.ts` (canAccessChallenges logic) | seed-pattern (generalize)        |
| `app/auth/permissions.test.ts` (NEW)  | test             | batch                            | `app/.server/payment/access.test.ts`                        | exact (vitest style)             |
| `app/context.ts`                      | config/type      | —                                | self (UserContext)                                          | exact                            |
| `app/middleware/auth.ts`              | middleware       | request-response                 | self (effectiveRole logic)                                  | exact                            |
| `app/middleware/admin.ts`             | middleware       | request-response                 | self (staff guard)                                          | exact                            |
| `app/.server/payment/access.ts`       | service          | pure fn                          | self (remove canAccessChallenges)                           | exact                            |
| `app/.server/payment/access.test.ts`  | test             | batch                            | self (remove describe block)                                | exact                            |
| `app/pages/admin/AdminUsers.tsx`      | page             | request-response (loader/action) | self (loader/action guard)                                  | exact                            |
| `app/pages/admin/AdminUserEdit.tsx`   | page             | request-response + form          | self (z.enum + guard)                                       | exact                            |
| `app/pages/admin/AdminCreateUser.tsx` | page             | request-response + form          | AdminUserEdit.tsx                                           | exact                            |
| `app/pages/admin/AdminDashboard.tsx`  | page             | request-response                 | AdminUsers.tsx                                              | exact                            |
| `app/pages/admin/AdminCategories.tsx` | page             | request-response                 | AdminUsers.tsx                                              | exact                            |
| `app/pages/admin/AdminPaths.tsx`      | page             | request-response                 | AdminUsers.tsx                                              | exact                            |
| `app/pages/admin/AdminPathDetail.tsx` | page             | request-response                 | AdminUsers.tsx                                              | exact                            |
| `app/pages/CourseBuilder.tsx`         | page             | request-response                 | self (requireStaffUser helper)                              | exact                            |
| `app/pages/CourseBuilderLesson.tsx`   | page             | request-response                 | CourseBuilder.tsx                                           | exact                            |
| `app/pages/IndexRedirect.tsx`         | page             | request-response                 | self (loader role check)                                    | exact                            |
| `app/pages/Challenges.tsx`            | page             | request-response (loader/action) | self (canAccessChallenges)                                  | exact                            |
| `app/pages/PaymentSuccess.tsx`        | page             | request-response                 | self (session userRole set)                                 | partial (session set, not guard) |
| `app/pages/Login.tsx`                 | page             | request-response (action)        | self (session userRole set)                                 | partial (session set, not guard) |
| `app/types.ts`                        | config/type      | —                                | self (`Role` dead type)                                     | exact (delete)                   |
| `app/.server/auth/register.ts`        | service          | request-response                 | self (role param)                                           | partial (no guard to change)     |
| `app/.server/auth/sessions.ts`        | config           | —                                | self (SessionData has viewAsLearner)                        | exact (no change needed)         |

---

## Pattern Assignments

### `app/auth/permissions.ts` (NEW — shared utility, NO `.server` suffix)

**Analog / seed pattern:** `app/.server/payment/access.ts` (the `canAccessChallenges` + `CHALLENGE_ACCESS` map) AND the effective-role logic in `app/middleware/auth.ts` (lines 25-42).

**Why shared (not `.server`):** `MainLayout.tsx` reads `user.role` in a render body (lines 66, 188, 198). A value imported from `app/.server/` into a component body breaks the RRv7 build (`Server-only module referenced by client`). Place the file at `app/auth/permissions.ts`.

**Effective-role resolution logic to reproduce internally** (`app/middleware/auth.ts` lines 23-42):

```typescript
// authMiddleware computes effective role ONCE; can() must only READ it.
const subscriptionEndsAt = session.get('subscriptionEndsAt') ?? null
let role = userRole
if (
	(role === 'lite' || role === 'pro') &&
	subscriptionEndsAt &&
	new Date(subscriptionEndsAt) < new Date()
) {
	role = 'learner'
}
const viewAsLearner = session.get('viewAsLearner')
const isStaff = role === 'staff'
const effectiveRole = isStaff && viewAsLearner ? 'learner' : role
```

**Seed logic to generalize** (`app/.server/payment/access.ts` lines 9-25):

```typescript
const CHALLENGE_ACCESS: Record<SubscriptionRole, boolean> = {
	learner: false,
	lite: true,
	pro: true,
}
export function canAccessChallenges(role: string): boolean {
	return CHALLENGE_ACCESS[role as SubscriptionRole] ?? false
}
```

**Target shape (copied from RESEARCH.md Pattern 1 + above):**

```typescript
// app/auth/permissions.ts  — NO .server suffix
import type { UserContext } from '~/context'
// If verbatimModuleSyntax import of a value type is needed elsewhere: `import type { Action }`

export type Action = 'admin' | 'accessChallenges' | 'viewAsLearner'

export function can(user: UserContext | null, action: Action): boolean {
	if (!user) return false
	switch (action) {
		case 'admin':
			// Use effective role (NOT isStaff) so staff previewing as learner lose admin.
			return user.role === 'staff'
		case 'accessChallenges':
			return user.role === 'lite' || user.role === 'pro'
		case 'viewAsLearner':
			return user.viewAsLearner === true
	}
}
```

> CRITICAL (Pitfall 3): `can(user,'admin')` MUST use `user.role === 'staff'`, never `user.isStaff`. `viewAsLearner` flips effective `role` to `'learner'` without clearing `isStaff`.

---

### `app/auth/permissions.test.ts` (NEW — test)

**Analog:** `app/.server/payment/access.test.ts` (vitest `describe/it/expect`, AAA comment style).

**Imports + structure pattern** (`access.test.ts` lines 1-6):

```typescript
import { describe, it, expect } from 'vitest'
import {
	canAccessAI,
	getAIMessageLimit,
	canAccessChallenges,
} from '~/.server/payment/access'
```

**Target:** import `can`, `Action` from `~/auth/permissions`. Cover D-02: `admin` (staff true / learner+viewAsLearner false), `accessChallenges` (lite/pro true, learner false), `viewAsLearner` (true only when flag set). Copy the comment style (`// Arrange / Act / Assert`).

---

### `app/context.ts` (EDIT — add `viewAsLearner`)

**Current** (`context.ts` lines 3-9):

```typescript
export type UserContext = {
	id: number
	name: string
	role: string
	isStaff: boolean
	subscriptionEndsAt: string | null
}
```

**Target:** add `viewAsLearner: boolean` as the last field (matches existing flat field style).

---

### `app/middleware/auth.ts` (EDIT — set `viewAsLearner` in both branches)

**Both `context.set(userContext, {...})` blocks** must include `viewAsLearner`.

- Branch 1 (session has role) — lines 36-42: add `viewAsLearner,` (the `const viewAsLearner = session.get('viewAsLearner')` already exists at line 33).
- Branch 2 (DB lookup) — lines 67-73: add `viewAsLearner: false,` (default, since this branch does not read the session flag).

**Current branch-1 set** (lines 36-42):

```typescript
context.set(userContext, {
	id: Number(userId),
	name: userName,
	role: effectiveRole,
	isStaff,
	subscriptionEndsAt,
})
```

**Current branch-2 set** (lines 67-73):

```typescript
context.set(userContext, {
	id: user.id,
	name: user.name,
	role,
	isStaff: role === 'staff',
	subscriptionEndsAt: subscriptionEndsAt?.toISOString() ?? null,
})
```

---

### `app/middleware/admin.ts` (EDIT — replace guard with `can()`)

**Current** (lines 8-11):

```typescript
const user = context.get(userContext)
if (!user || user.role !== 'staff') {
	throw redirect('/dashboard')
}
```

**Target:**

```typescript
import { can } from '~/auth/permissions'
// ...
const user = context.get(userContext)
if (!can(user, 'admin')) {
	throw redirect('/dashboard')
}
```

> `can(user, 'admin')` already returns `false` for null user (defensive), so the `!user ||` is absorbed.

---

### `app/.server/payment/access.ts` (EDIT — remove `canAccessChallenges` + `CHALLENGE_ACCESS`)

**Lines to DELETE:** 9-13 (`CHALLENGE_ACCESS`) and 24-26 (`canAccessChallenges`).
**KEEP:** `SubscriptionRole` (line 1), `AI_MESSAGE_LIMITS` (3-7), `canAccessAI` (15-18), `getAIMessageLimit` (20-22) — still used by `app/.server/chat/handler.ts`.

---

### `app/.server/payment/access.test.ts` (EDIT — remove `canAccessChallenges` describe)

**Lines to DELETE:** 5 (import of `canAccessChallenges`), 68-88 (the `describe('canAccessChallenges', ...)` block).
**KEEP:** `canAccessAI` (8-44) and `getAIMessageLimit` (46-66) describes. The file otherwise remains valid. (Alternatively rename to `permissions.test.ts` per RESEARCH Wave 0 — either is fine; minimal edit = delete the block.)

---

### `app/pages/admin/AdminUsers.tsx` (EDIT — migrate 2 guards + 1 render check)

**Loader/action guard pattern** (lines 33-39 and 69-75):

```typescript
const user = context.get(userContext)
if (user === null) {
	throw new NoUserContextError('User context resolved to null.')
}
if (user.role !== 'staff') {
	throw redirect('/')
}
```

**Target (both sites):**

```typescript
import { can } from '~/auth/permissions'
// ...
const user = context.get(userContext)
if (user === null) {
	throw new NoUserContextError('User context resolved to null.')
}
if (!can(user, 'admin')) {
	throw redirect('/')
}
```

**Render-body nit** (line 168 `u.role === 'staff'`) — this is a _display_ label on a fetched row, NOT a permission gate. Leave as-is (it colors a badge). Do NOT change display logic.

---

### `app/pages/admin/AdminUserEdit.tsx` (EDIT — guards + role enum)

**Guards** (lines 47-53, 65-72): same `if (user.role !== 'staff') throw redirect('/')` → `if (!can(user,'admin'))`.
**Role enum reconciliation** (line 43):

```typescript
role: z.enum(['learner', 'staff']),
```

**Target (D-04 cleanup — fix latent bug excluding lite/pro):**

```typescript
import { USER_ROLES } from '~/.server/database/types'
// ...
role: z.enum(USER_ROLES),
```

`USER_ROLES = ['learner', 'staff', 'lite', 'pro'] as const` at `app/.server/database/types.ts:25`.

---

### `app/pages/admin/AdminCreateUser.tsx` (EDIT — guards + role enum)

**Guards** (lines 29-37, 47-55): same migration to `can(user,'admin')`.
**Role enum** (line 44): `role: z.enum(['learner', 'staff'])` → `z.enum(USER_ROLES)` (mirror AdminUserEdit).

---

### `app/pages/admin/AdminDashboard.tsx` (EDIT — guard)

**Guard** (line 125-128): `if (user.role !== 'staff') throw redirect('/')` → `if (!can(user,'admin'))`. (Display-only `u.role === 'staff'` at line 435 stays.)

---

### `app/pages/admin/AdminCategories.tsx` (EDIT — guards)

**Guards** (lines 34-37, 54-57): `if (user.role !== 'staff')` → `if (!can(user,'admin'))`.

---

### `app/pages/admin/AdminPaths.tsx` (EDIT — guards)

**Guards** (lines 47-50, 74-77): `if (user.role !== 'staff')` → `if (!can(user,'admin'))`.

---

### `app/pages/admin/AdminPathDetail.tsx` (EDIT — guards)

**Guards** (lines 46-49, 94-97): `if (user.role !== 'staff')` → `if (!can(user,'admin'))`.

---

### `app/pages/CourseBuilder.tsx` (EDIT — `requireStaffUser` helper)

**Guard helper** (lines 148-159):

```typescript
async function requireStaffUser(context: Route.LoaderArgs['context']) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (user.role !== 'staff') {
		throw redirect('/')
	}
	return user
}
```

**Target:** change only line 154 `if (user.role !== 'staff')` → `if (!can(user, 'admin'))` (add `import { can } from '~/auth/permissions'`).

---

### `app/pages/CourseBuilderLesson.tsx` (EDIT — guard)

**Guard** (lines 103-106): `if (user.role !== 'staff') throw redirect('/')` → `if (!can(user,'admin'))`.

---

### `app/pages/IndexRedirect.tsx` (EDIT — loader role check)

**Current** (lines 5-11):

```typescript
export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user?.role === 'staff') {
		throw redirect('/admin')
	}
	throw redirect('/dashboard')
}
```

**Target:**

```typescript
import { can } from '~/auth/permissions'
// ...
if (can(user, 'admin')) {
	throw redirect('/admin')
}
throw redirect('/dashboard')
```

---

### `app/pages/Challenges.tsx` (EDIT — migrate to `can()`)

**Imports** (line 28): replace `import { canAccessChallenges } from '~/.server/payment/access'` with `import { can } from '~/auth/permissions'`.

**Loader** (line 82): `const canSubmit = canAccessChallenges(user.role)` → `const canSubmit = can(user, 'accessChallenges')`.

**Action** (lines 102-105):

```typescript
if (!canAccessChallenges(user.role)) {
	return { error: 'Upgrade to Lite or Pro to submit flags.' }
}
```

→

```typescript
if (!can(user, 'accessChallenges')) {
	return { error: 'Upgrade to Lite or Pro to submit flags.' }
```

---

### `app/pages/PaymentSuccess.tsx` (PARTIAL — session set, not a guard)

**Lines 82-93** set `session.set('userRole', ...)` based on plan role. This is a _session write_, not a permission check — **no `can()` change required**. Noted here so the planner does not mistakenly migrate it. Leave as-is.

---

### `app/pages/Login.tsx` (PARTIAL — session set, not a guard)

**Line 58** `session.set('userRole', user.role)`. Session write only — **no change required**. Left as-is.

---

### `app/types.ts` (EDIT/DELETE — stale `Role` type)

**Current** (entire file):

```typescript
export type Role = 'student' | 'staff'
```

**Action:** Delete the file (verified via grep: zero importers). Per RESEARCH A1, safe dead-code removal reconciling role vocabulary to `learner|lite|pro|staff` (authoritative in `app/.server/database/types.ts` `USER_ROLES`/`UserRole`). If deletion is disallowed by tooling, replace contents with a re-export or leave empty — but deletion is preferred.

---

### `app/.server/auth/register.ts` (NO CHANGE to guards)

`register(name, email, password, role?: string)` (line 7-12) only forwards `role` into an `INSERT`. It performs no permission check. **No `can()` migration needed.** Listed for completeness so planner confirms it is out of scope (D-04 cleanup of role vocabulary may optionally widen `role?: string` but that is optional).

---

### `app/.server/auth/sessions.ts` (NO CHANGE)

`SessionData` already includes `viewAsLearner: boolean` (line 9). `authMiddleware` reads it; `ToggleView.ts` (route) writes it. The `UserContext.viewAsLearner` addition (context.ts) is the only missing link. Leave sessions.ts untouched.

---

## Shared Patterns

### Authentication / effective-role source of truth

**Source:** `app/middleware/auth.ts` (lines 23-42)
**Apply to:** ALL — `can()` must read only the already-resolved `userContext` (effective role + `viewAsLearner`), never re-derive subscription downgrade or `viewAsLearner`.

```typescript
const viewAsLearner = session.get('viewAsLearner')
const isStaff = role === 'staff'
const effectiveRole = isStaff && viewAsLearner ? 'learner' : role
```

### Role-vocabulary canonical source

**Source:** `app/.server/database/types.ts` (line 25)
**Apply to:** `AdminUserEdit.tsx`, `AdminCreateUser.tsx` role enums, and any new role literal.

```typescript
export const USER_ROLES = ['learner', 'staff', 'lite', 'pro'] as const
export type UserRole = (typeof USER_ROLES)[number]
```

### Null-user guard convention

**Source:** every admin page loader/action (e.g. `AdminUsers.tsx` lines 33-36)
**Apply to:** all migrated guards keep the existing `NoUserContextError` for null, then `can()` for the role check. `can()` also defensively returns `false` for null.

```typescript
const user = context.get(userContext)
if (user === null)
	throw new NoUserContextError('User context resolved to null.')
if (!can(user, 'admin')) throw redirect('/')
```

### Test framework convention

**Source:** `app/.server/payment/access.test.ts` (vitest `describe/it/expect` + Arrange/Act/Assert comments)
**Apply to:** `app/auth/permissions.test.ts`.

### Error / redirect convention

**Source:** `react-router` `redirect(...)` for guards, `NoUserContextError` for null (from `~/error`).
**Apply to:** all guard migrations — preserve existing redirect target per file (`/`, `/dashboard`, `/admin` as appropriate).

---

## No Analog Found

None — every target file has a direct in-repo analog (the scattered checks themselves are the analog patterns to replace). The only genuinely NEW artifact is `app/auth/permissions.ts`, whose seed is `canAccessChallenges`/`CHALLENGE_ACCESS` in `access.ts` plus the effective-role block in `auth.ts`. No external pattern needed.

---

## Metadata

**Analog search scope:** `app/middleware/`, `app/`, `app/.server/payment/`, `app/.server/auth/`, `app/.server/database/`, `app/pages/admin/`, `app/pages/` (Challenges, CourseBuilder, CourseBuilderLesson, IndexRedirect, PaymentSuccess, Login), `app/layouts/`
**Files scanned:** 23
**Pattern extraction date:** 2026-07-17
**Key constraint verified:** RRv7 `.server/` boundary — `can()` MUST live at `app/auth/permissions.ts` (no `.server`) to be importable from `MainLayout.tsx` render body.
