---
phase: 01-role-access-control-implementation
plan: 01
subsystem: auth
tags: [permissions, role-access-control, middleware, react-router, vitest]

# Dependency graph
requires:
  - phase: phase-1
    provides: existing authMiddleware effective-role + viewAsLearner logic, UserContext type, access.ts helpers
provides:
  - shared `can(user, action)` permission helper usable from client and server
  - `viewAsLearner` on UserContext populated by authMiddleware
  - adminMiddleware migrated to can()
  - trimmed access.ts (AI fns only) and deleted dead app/types.ts
affects:
  - 01-02 (Wave 2 page migrations to can())
  - all admin pages and role-checked routes

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single shared permission helper in app/auth/permissions.ts (NO .server suffix) — importable from client render bodies and .server modules"
    - "authMiddleware is the ONLY place effective role is computed; can() reads it, never re-derives"
    - "can(null, action) defensive null guard absorbs the previous `!user ||` short-circuit in guards"

key-files:
  created:
    - app/auth/permissions.ts
    - app/auth/permissions.test.ts
  modified:
    - app/context.ts
    - app/middleware/auth.ts
    - app/middleware/admin.ts
    - app/.server/payment/access.ts
    - app/.server/payment/access.test.ts
    - app/pages/Challenges.tsx

key-decisions:
  - "can() uses effective role (user.role === 'staff') NOT isStaff, so staff previewing as learner lose admin (preserves auth.ts semantics — Pitfall 3)"
  - "accessChallenges = lite|pro only; staff denied unless they hold a sub (preserves CHALLENGE_ACCESS behavior)"
  - "Location app/auth/permissions.ts (no .server) chosen deliberately per RESEARCH Critical Finding — a .server import in a client render body breaks the RRv7 build"

patterns-established:
  - "Permission checks funnel through can(user, action); scattered literals become call sites"

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Shared can() helper at app/auth/permissions.ts covering admin/accessChallenges/viewAsLearner + null guard"
    verification:
      - kind: unit
        ref: "app/auth/permissions.test.ts#can - admin/admin/accessChallenges/viewAsLearner/defensive null handling"
        status: pass
    human_judgment: false
  - id: D2
    description: "can() importable client+server (no .server suffix) and typecheck green"
    verification:
      - kind: other
        ref: "pnpm run typecheck (no errors)"
        status: pass
    human_judgment: false
  - id: D3
    description: "UserContext carries viewAsLearner, populated by authMiddleware in both branches"
    verification:
      - kind: other
        ref: "pnpm run typecheck (no missing-property errors)"
        status: pass
    human_judgment: false
  - id: D4
    description: "adminMiddleware uses can(user,'admin'); access.ts/access.test.ts trimmed; app/types.ts deleted"
    verification:
      - kind: unit
        ref: "app/.server/payment/access.test.ts#canAccessAI/getAIMessageLimit"
        status: pass
      - kind: other
        ref: "pnpm run typecheck (no canAccessChallenges/CHALLENGE_ACCESS/Role references)"
        status: pass
    human_judgment: false

# Metrics
duration: 40min
completed: 2026-07-17
status: complete
---

# Phase 1 Plan 1: Shared can() permission helper + access pipeline cleanup Summary

**Shared `can(user, action)` permission helper (app/auth/permissions.ts, no `.server` suffix, importable client+server) with admin/accessChallenges/viewAsLearner actions + null guard, wired into adminMiddleware, plus trimmed access.ts and deleted dead `app/types.ts`.**

## Performance

- **Duration:** 40 min (incl. environment recovery — see Issues)
- **Started:** 2026-07-17T00:54:00Z
- **Completed:** 2026-07-17T01:32:00Z
- **Tasks:** 4 (+ 1 auto-fix commit)
- **Files modified:** 7 (2 created, 5 modified/deleted)

## Accomplishments

- Built shared `can(user, action)` helper covering the three existing implicit actions (admin, accessChallenges, viewAsLearner) with defensive null handling — single source of truth for Wave 2 migrations.
- Added `viewAsLearner: boolean` to `UserContext` and populated it in both `authMiddleware` branches.
- Migrated `adminMiddleware` guard from `user.role !== 'staff'` to `can(user, 'admin')`, preserving staff-preview-as-learner semantics.
- Trimmed `access.ts` to AI functions only (removed `CHALLENGE_ACCESS`/`canAccessChallenges`); deleted stale `Role = 'student' | 'staff'` in `app/types.ts` (zero importers).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared can() helper + test (D-01, D-02, D-03)** - `9bb05ce` (feat)
2. **Task 2: Add viewAsLearner to UserContext + set in authMiddleware (D-03)** - `e9696d6` (feat)
3. **Task 3: Migrate adminMiddleware guard to can() (D-04)** - `003d457` (feat)
4. **Task 4: Trim access.ts + access.test.ts, delete dead app/types.ts (D-04)** - `b56bd66` (feat)

**Auto-fix commit (deviation):** `a9ced20` (fix) — migrated `Challenges.tsx` broken import.

## Files Created/Modified

- `app/auth/permissions.ts` - Shared `can()` + `Action` type (no `.server` suffix)
- `app/auth/permissions.test.ts` - 12 vitest cases (admin/accessChallenges/viewAsLearner + null)
- `app/context.ts` - Added `viewAsLearner: boolean` to UserContext
- `app/middleware/auth.ts` - Populate `viewAsLearner` in both `context.set` branches
- `app/middleware/admin.ts` - Guard now `if (!can(user, 'admin'))`
- `app/.server/payment/access.ts` - Removed `CHALLENGE_ACCESS` + `canAccessChallenges`; kept AI fns
- `app/.server/payment/access.test.ts` - Removed `canAccessChallenges` describe + import
- `app/types.ts` - Deleted (stale `Role = 'student' | 'staff'`)
- `app/pages/Challenges.tsx` - Migrated 2 call sites to `can(user, 'accessChallenges')` (deviation fix)

## Decisions Made

- Used `user.role === 'staff'` (effective role) not `isStaff` in `can(user,'admin')` — staff previewing as learner (role flipped to 'learner') correctly lose admin. Preserves `auth.ts` effective-role semantics (Pitfall 3).
- `accessChallenges` = lite|pro only; staff denied unless they hold a sub — preserves current `CHALLENGE_ACCESS` behavior.
- Placed helper at `app/auth/permissions.ts` (NO `.server` suffix) per RESEARCH Critical Finding: a `.server` import into a client render body breaks the RRv7 build wall ("Server-only module referenced by client").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migrated `app/pages/Challenges.tsx` broken import after removing `canAccessChallenges`**

- **Found during:** Task 4 (trim access.ts)
- **Issue:** Deleting `canAccessChallenges` left `app/pages/Challenges.tsx` importing a now-nonexistent export → typecheck error `TS2305: Module has no exported member 'canAccessChallenges'`.
- **Fix:** Replaced both call sites with `can(user, 'accessChallenges')` and switched import to `can` from `~/auth/permissions` (D-04 migration scope covers all call sites; this is exactly the Wave-2-style cleanup triggered early by the deletion).
- **Files modified:** `app/pages/Challenges.tsx`
- **Verification:** typecheck clean, both vitest suites green, `grep` for `canAccessChallenges` returns no matches.
- **Committed in:** `a9ced20`

**2. [Rule 1 - Bug] Coerced `session.get('viewAsLearner')` to boolean in authMiddleware**

- **Found during:** Task 2 (typecheck)
- **Issue:** `session.get('viewAsLearner')` is `boolean | undefined`, not assignable to the new `viewAsLearner: boolean` field → typecheck error `TS2322`.
- **Fix:** Changed to `const viewAsLearner = session.get('viewAsLearner') === true` so the field is always boolean.
- **Files modified:** `app/middleware/auth.ts`
- **Verification:** typecheck clean.
- **Committed in:** `e9696d6`

---

**Total deviations:** 2 auto-fixed (1 blocking import, 1 type bug). Both necessary for correctness/build.
**Impact on plan:** Both within D-04 cleanup scope; no scope creep. The Challenges.tsx fix is required for the deletion to not break the build.

## Issues Encountered

- **`/tmp` disk-full (`ENOSPC`) during vitest runs.** Root cause: ~632 leaked esbuild native `.so` temp files (~10GB) in `/tmp` from prior interrupted tsc/vitest runs. Resolved by deleting `/tmp/*.so` (regenerable cache), freeing `/tmp`. Not a code issue.
- **`pnpm run typecheck` extremely slow (~280s+) in this environment** due to low free RAM (652MB) and react-router typegen. Verified green by running in background and inspecting output; no code errors surfaced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Shared `can()` foundation is committed and green; Wave 2 (plan 01-02) can now migrate the remaining ~13 scattered `user.role !== 'staff'` / role-enum literals to `can()` call sites.
- `viewAsLearner` is now available on `UserContext` for any page that needs the staff-preview switch.

---

_Phase: 01-role-access-control-implementation_
_Completed: 2026-07-17_
