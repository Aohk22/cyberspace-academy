# Phase 1: Role access control implementation - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish a single, centralized permission layer for the CyberSpace Academy app and migrate all existing scattered, ad-hoc role checks to it. The phase delivers the `can(user, action)` helper plus the cleanup of every `user.role !== 'staff'` / `canAccessChallenges` / role-enum literal currently duplicated across ~15 pages and server routes.

Scope is limited to **role-based access control mechanics** — not new capabilities (no new admin screens, no new subscription tiers, no new user-management features beyond what exists today).

</domain>

<decisions>
## Implementation Decisions

### Central permission layer
- **D-01:** Adopt a single `can(user, action)` helper function as the unified permission API. Located in a new `app/.server/auth/permissions.ts`. It replaces scattered `user.role !== 'staff'` literals and the existing `canAccessChallenges(role)` helper.
- **D-02:** The first version of `can()` covers **only the actions that already have implicit checks today**: `admin` (staff-only), `accessChallenges` (lite/pro), and `viewAsLearner` (staff preview switch). No broad upfront catalog — grow the action set as new checks appear.
- **D-03:** `can()` must be **shared** — usable both in server `.server` code and in client pages via the `userContext` (which already carries `role`, `isStaff`, `subscriptionEndsAt` from `auth.ts`). One function, no client/server duplication. It should accept the full user object (not just a role string), so it can replicate `auth.ts` effective-role + `viewAsLearner` logic internally.
- **D-04:** **Full migration now** — replace ALL existing ad-hoc checks across the ~15 files (admin pages, CourseBuilder, IndexRedirect, PaymentSuccess, Challenges, AdminUserEdit/AdminCreateUser role enums, etc.) with `can()` calls in this phase. Removes the role-vocabulary inconsistency at the same time.

### the agent's Discretion
- Exact internal implementation of `can()` (role-rank ordering, action table shape) — as long as it stays a single shared function and covers the three actions above.
- How to handle the stale `Role = 'student' | 'staff'` type in `app/types.ts` (should be reconciled to match the schema's `learner/lite/pro/staff` vocabulary as part of D-04's cleanup).
- Naming of the `action` literals (string union vs enum) — pick what fits existing conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing permission / auth code (read first)
- `app/.server/payment/access.ts` — existing `canAccessChallenges(role)` helper; the seed pattern to generalize into `can()`.
- `app/middleware/auth.ts` — computes `effectiveRole` + `viewAsLearner` into `userContext`; `can()` must replicate this logic.
- `app/middleware/admin.ts` — current `user.role !== 'staff'` admin guard (to be replaced by `can(user,'admin')`).
- `app/context.ts` — `UserContext` type (`id`, `name`, `role`, `isStaff`, `subscriptionEndsAt`) passed to `can()`.
- `app/.server/database/schema.ts` — `users.role` column (`varchar(20)`, default `'learner'`) and `subscriptionEndsAt` timestamp. Authoritative role vocabulary: `learner | lite | pro | staff`.
- `app/types.ts` — **stale** `Role = 'student' | 'staff'`; must be reconciled (see D-04).

### Files with scattered checks to migrate (from codebase scout)
- `app/pages/admin/AdminUsers.tsx`, `AdminUserEdit.tsx` (role enum `learner|staff`), `AdminCreateUser.tsx`, `AdminDashboard.tsx`, `AdminCategories.tsx`, `AdminPaths.tsx`, `AdminPathDetail.tsx`
- `app/pages/CourseBuilder.tsx`, `CourseBuilderLesson.tsx`, `IndexRedirect.tsx`, `Challenges.tsx`, `PaymentSuccess.tsx`, `Login.tsx`
- `app/.server/auth/register.ts`, `app/.server/auth/sessions.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `canAccessChallenges(role)` in `app/.server/payment/access.ts` — direct precedent; generalize its role→boolean logic into `can()`.
- `userContext` (React context from `app/context.ts`) — already provides the user object to every page; `can()` consumes it directly.

### Established Patterns
- Session-cookie auth with `authMiddleware` resolving effective role + subscription downgrade (`lite`/`pro` → `learner` on expiry) and `viewAsLearner` staff preview. `can()` must preserve this exact behavior.
- Server-side queries use raw `sql` tagged templates + Zod row parsing (per AGENTS.md) — `can()` is pure logic, no DB needed.

### Integration Points
- Every admin page currently imports nothing shared for auth — they each re-check `user.role !== 'staff'`. They become `can(user, 'admin')` call sites.
- `authMiddleware` is the single place role is resolved; `can()` should be importable there too if needed.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly chose the recommended option at every decision point: `can(user, action)` shape, migrate-existing-checks-only scope, shared client+server usability, and full migration now.
- `viewAsLearner` (staff previewing as learner) must remain supported — it is one of the three initial `can()` actions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-role-access-control-implementation*
*Context gathered: 2026-07-17*
