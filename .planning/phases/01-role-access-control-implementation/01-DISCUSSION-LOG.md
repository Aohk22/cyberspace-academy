# Phase 1: Role access control implementation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 1-role-access-control-implementation
**Areas discussed:** Central permission layer

---

## Central permission layer

| Option                           | Description                                                                                           | Selected |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| can(user, action) helper         | Single `can(user, action)` function in `app/.server/auth/permissions.ts` replacing scattered literals | ✓        |
| Consolidated per-feature helpers | Keep per-feature helpers but consolidate into one module                                              |          |
| Role→action map + can()          | Declarative role→action record plus can() lookup                                                      |          |

**User's choice:** can(user, action) helper
**Notes:** Recommended option. User wants a single shared, type-safe, testable permission function.

| Option                       | Description                                                                           | Selected |
| ---------------------------- | ------------------------------------------------------------------------------------- | -------- |
| Migrate existing checks only | Cover admin, accessChallenges, viewAsLearner — the actions with implicit checks today | ✓        |
| Broad predefined catalog     | Define all plausible actions upfront                                                  |          |
| Agent's discretion           | Planner infers the action set                                                         |          |

**User's choice:** Migrate existing checks only
**Notes:** Start minimal, grow as needed.

| Option                           | Description                                                               | Selected |
| -------------------------------- | ------------------------------------------------------------------------- | -------- |
| Shared — works in pages + server | can() takes full user object, usable both client (userContext) and server | ✓        |
| Server-only, thin client mirror  | Keep can() server-only, thin client mirror                                |          |
| Agent's discretion               | Decide the boundary                                                       |          |

**User's choice:** Shared — works in pages + server
**Notes:** auth.ts already computes effectiveRole + viewAsLearner into userContext.

| Option                           | Description                                                 | Selected |
| -------------------------------- | ----------------------------------------------------------- | -------- |
| Full migration now               | Replace all ~15 scattered literals with can() in this phase | ✓        |
| Establish layer, defer migration | Leave existing literals (debt noted)                        |          |
| Agent's discretion               | Decide migration scope                                      |          |

**User's choice:** Full migration now
**Notes:** Removes the role-vocabulary inconsistency (types.ts `'student'|'staff'` vs schema `learner/lite/pro/staff`).

---

## the agent's Discretion

- Internal implementation of `can()` (role-rank ordering, action table shape).
- How to reconcile the stale `Role = 'student' | 'staff'` type in `app/types.ts` to match schema vocabulary.
- Naming of the `action` literals (string union vs enum).

## Deferred Ideas

None — discussion stayed within phase scope.
