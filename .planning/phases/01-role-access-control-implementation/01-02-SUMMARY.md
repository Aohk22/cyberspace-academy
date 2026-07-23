---
phase: 01-role-access-control-implementation
plan: 02
subsystem: auth
tags: [permissions, role-access-control, can, react-router, vitest]

# Dependency graph
requires:
    - phase: 01-01
      provides: shared `can(user, action)` helper at app/auth/permissions.ts, importable client+server
provides:
    - full D-04 migration: every page-level admin guard + MainLayout staff nav gate now uses can(user,'admin')
    - admin role zod-enums widened to USER_ROLES (lite/pro accepted)
    - IndexRedirect migrated to can(user,'admin')
affects:
    - all admin pages and role-checked routes (now consistently gated through can())

# Tech tracking
tech-stack:
    added: []
    patterns:
        - "Page guards: `if (!can(user, 'admin')) throw redirect(...)` after the existing NoUserContextError null guard"
        - "Render-gated nav: `{user && can(user,'admin') && (...)}` in MainLayout"
        - 'Admin role schemas use `z.enum(USER_ROLES)` from ~/.server/database/types (server-only module eval at load — safe in route modules)'

key-files:
    created: []
    modified:
        - app/pages/admin/AdminUsers.tsx
        - app/pages/admin/AdminDashboard.tsx
        - app/pages/admin/AdminCategories.tsx
        - app/pages/admin/AdminPaths.tsx
        - app/pages/admin/AdminPathDetail.tsx
        - app/pages/admin/AdminUserEdit.tsx
        - app/pages/admin/AdminCreateUser.tsx
        - app/pages/CourseBuilder.tsx
        - app/pages/CourseBuilderLesson.tsx
        - app/layouts/MainLayout.tsx
        - app/pages/IndexRedirect.tsx

key-decisions:
    - "Challenges.tsx was already migrated in Wave 1 (01-01 deviation #1); no canAccessChallenges references remained, so Task 3's Challenges portion was a no-op verification"
    - 'Task 1 (guards) and Task 2 (USER_ROLES enum) edits landed in the same files; both were committed together in b78b2bb since the enum edits were made before the Task 1 commit'

patterns-established:
    - "can(user,'admin') is the single source of truth for every admin gate (loaders, actions, render nav)"

requirements-completed: []

# Coverage metadata (#1602)
coverage:
    - id: D1
      description: "All 8 admin page guards + CourseBuilder/CourseBuilderLesson requireStaffUser migrated from user.role!=='staff' to !can(user,'admin')"
      verification:
          - kind: other
            ref: 'grep -rn ''user.role === ''"''"''staff''"''"''|user.role !== ''"''"''staff''"''"'''' app/layouts app/pages app/middleware (no matches, exit=1)'
            status: pass
          - kind: other
            ref: 'pnpm run typecheck (exit=0)'
            status: pass
      human_judgment: false
    - id: D2
      description: "MainLayout.tsx:188 staff nav gate migrated to {user && can(user,'admin') && (...)}"
      verification:
          - kind: other
            ref: "grep no matches for user.role==='staff' in app/layouts; typecheck exit=0"
            status: pass
      human_judgment: false
    - id: D3
      description: 'AdminUserEdit + AdminCreateUser role enums widened to z.enum(USER_ROLES) (accepts lite/pro)'
      verification:
          - kind: other
            ref: 'grep -rn "z.enum([''learner'', ''staff''])" app/pages/admin (no matches, exit=1)'
            status: pass
          - kind: other
            ref: 'pnpm run typecheck (exit=0)'
            status: pass
      human_judgment: false
    - id: D4
      description: "IndexRedirect loader migrated to can(user,'admin'); canAccessChallenges fully removed from app/pages"
      verification:
          - kind: other
            ref: 'grep -rn canAccessChallenges app/pages (no matches, exit=1); typecheck exit=0'
            status: pass
      human_judgment: false

# Metrics
duration: 20min
completed: 2026-07-16
status: complete
---

# Phase 1 Plan 2: Full D-04 migration of scattered role guards to can(user,'admin') Summary

**Migrated every remaining page-level admin guard (8 admin pages + CourseBuilder/CourseBuilderLesson), the MainLayout staff-nav gate, and IndexRedirect to the shared `can(user,'admin')` helper; widened admin role zod-enums to USER_ROLES so lite/pro are accepted; removed all `user.role !== 'staff'` literals and `canAccessChallenges` references from app/pages + app/layouts.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-16T18:20:00Z
- **Completed:** 2026-07-16T18:40:00Z
- **Tasks:** 3 (Task 1+2 combined commit, Task 3 separate)
- **Files modified:** 11

## Accomplishments

- Replaced `if (user.role !== 'staff')` redirect guards with `if (!can(user, 'admin'))` across AdminUsers (loader+action), AdminDashboard, AdminCategories (loader+action), AdminPaths (loader+action), AdminPathDetail (loader+action), AdminUserEdit (loader+action), AdminCreateUser (loader+action), CourseBuilder (requireStaffUser), CourseBuilderLesson (requireStaffUser) — preserving every NoUserContextError null guard and original redirect target (incl. `/dashboard` for the two create/edit pages).
- Migrated MainLayout.tsx:188 render-gated staff nav from `{user.role === 'staff' && ...}` to `{user && can(user, 'admin') && ...}`.
- Widened `role: z.enum(['learner','staff'])` → `z.enum(USER_ROLES)` in AdminUserEdit and AdminCreateUser update/create schemas (fixes latent bug rejecting lite/pro — T-01-04).
- Migrated IndexRedirect loader from `user?.role === 'staff'` to `can(user, 'admin')` (preserves staff→/admin, else→/dashboard).

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Migrate admin/CourseBuilder guards + MainLayout nav to can() AND widen role enums to USER_ROLES** - `b78b2bb` (feat) — the enum edits were made on the same files before the guard commit, so both landed together.
2. **Task 3: Migrate IndexRedirect loader to can(user,'admin')** - `60700c8` (feat) — Challenges.tsx portion was already done in Wave 1; only IndexRedirect changed.

## Files Created/Modified

- `app/pages/admin/AdminUsers.tsx` - 2 guards → can(user,'admin')
- `app/pages/admin/AdminDashboard.tsx` - guard → can(user,'admin')
- `app/pages/admin/AdminCategories.tsx` - 2 guards → can(user,'admin')
- `app/pages/admin/AdminPaths.tsx` - 2 guards → can(user,'admin')
- `app/pages/admin/AdminPathDetail.tsx` - 2 guards → can(user,'admin')
- `app/pages/admin/AdminUserEdit.tsx` - 2 guards → can(user,'admin') + role enum widened
- `app/pages/admin/AdminCreateUser.tsx` - 2 guards → can(user,'admin') + role enum widened
- `app/pages/CourseBuilder.tsx` - requireStaffUser guard → can(user,'admin')
- `app/pages/CourseBuilderLesson.tsx` - requireStaffUser guard → can(user,'admin')
- `app/layouts/MainLayout.tsx` - staff nav gate → can(user,'admin')
- `app/pages/IndexRedirect.tsx` - loader → can(user,'admin')

## Decisions Made

- Challenges.tsx was already migrated in Wave 1 (01-01 deviation #1), so Task 3's Challenges work was a verification-only no-op.
- Because the USER_ROLES enum edits (Task 2) were applied to the same two files as the guard edits (Task 1) before the first commit, both were committed together in `b78b2bb`. This is an atomic, correct commit covering both tasks' work.

## Deviations from Plan

None - plan executed exactly as written (with the noted Wave-1 pre-migration of Challenges.tsx, which the plan's own context acknowledged).

## Issues Encountered

- **Pre-existing vitest failure unrelated to this plan.** `app/.server/database/utils.test.ts` (2 tests, `getCourseLessonCount`) fails with `Invalid input: expected number, received object`. This file and function (`utils.ts`) were NOT touched by this plan — they are part of the large pre-existing uncommitted working tree from prior phases. `permissions.test.ts` and `access.test.ts` (the plan's relevant suites) both pass. Per the Scope Boundary rule, this out-of-scope failure is logged but not fixed here.

## User Setup Required

None - no external service configuration required.

## Verification Results

- `grep -rn "user.role === 'staff'|user.role !== 'staff'" app/layouts app/pages app/middleware` → no matches (exit 1) ✅
- `grep -rn "canAccessChallenges" app/pages` → no matches (exit 1) ✅
- `grep -rn "z.enum(['learner', 'staff'])" app/pages/admin` → no matches (exit 1) ✅
- `pnpm run typecheck` → exit 0 ✅
- `pnpm run fmt` → clean ✅
- `pnpm exec vitest run` → 3 files passed (permissions.test.ts, access.test.ts, format-course-length.test.ts); 1 file failed (utils.test.ts, pre-existing, out of scope)

## Next Phase Readiness

- `can(user,'admin')` is now the single source of truth for every admin gate across pages, middleware, and the MainLayout nav. No `user.role !== 'staff'` guard literal remains in app/pages, app/middleware, or app/layouts.
- D-04 (full migration) is complete. New routes should import `can` from `~/auth/permissions` rather than re-introducing role literals.

---

_Phase: 01-role-access-control-implementation_
_Completed: 2026-07-16_

## Self-Check: PASSED

- SUMMARY.md created at `.planning/phases/01-role-access-control-implementation/01-02-SUMMARY.md` ✅
- Task commits present: `b78b2bb` (Task 1+2), `60700c8` (Task 3) ✅
- All grep gates clean (no `user.role !== 'staff'`, no `canAccessChallenges`, no narrow role enum) ✅
- `pnpm run typecheck` exit 0, `pnpm run fmt` clean ✅
- Only `app/auth/permissions.ts:10` retains `user.role === 'staff'` — this is the canonical `can()` implementation, not a scattered guard, and is excluded by the acceptance-criteria pattern.
