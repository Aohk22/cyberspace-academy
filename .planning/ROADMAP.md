# Roadmap

## Milestone M1 — Core Platform

| Phase | Name                                    | Status      |
| ----- | --------------------------------------- | ----------- |
| 1     | Core application scaffolding & features | In Progress |

## Phase 1 Summary

Initial build of the CyberSpace Academy learning platform: React Router v7 SSR app with
PostgreSQL (Drizzle), bcrypt auth, PayOS payments, OpenRouter AI tutor, admin tooling,
and course/challenge/learning-path features. Test generation retroactively layered on top.

### Phase 1: Role access control implementation

**Goal:** Establish a single shared `can(user, action)` permission layer and migrate all ~15 scattered role checks to it, unifying the role vocabulary.
**Requirements**: TBD
**Depends on:** Phase 0
**Plans:** 2/2 plans executed

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Build shared `can()` + UserContext.viewAsLearner + authMiddleware/adminMiddleware wiring + tests + access.ts/types.ts cleanup

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 01-02-PLAN.md — Migrate all page call sites (admin guards, CourseBuilder, IndexRedirect, Challenges, admin role enums) to `can()`
