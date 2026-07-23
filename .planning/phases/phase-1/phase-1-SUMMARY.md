# Phase 1 — SUMMARY

## Goal

Build the CyberSpace Academy learning platform: authentication, course catalog, lessons
with challenges, learning paths, admin tooling, PayOS payments, and an OpenRouter AI tutor.

## Files Changed (primary logic under test)

- `app/utils/format-course-length.ts` — pure formatting helpers (`formatCourseLength`, `formatLessonLength`)
- `app/.server/payment/access.ts` — subscription gating helpers (`canAccessAI`, `getAIMessageLimit`, `canAccessChallenges`)
- `app/.server/database/utils.ts` — DB query helpers (require live DB — Skip for unit tests)
- `app/.server/auth/login.ts` — credential validation (requires live DB — Skip for unit tests)
- `app/.server/queries/*.ts` — domain queries (require live DB — Skip for unit tests)
- `app/components/**`, `app/pages/**` — UI (E2E candidates, no browser runner installed)

## Implementation Notes

- Queries use raw `sql` + Zod row parsing; Drizzle used for schema/connection only.
- `formatCourseLength` returns e.g. `1.5h` / `2h`; `formatLessonLength` returns e.g. `5 min`.
- Payment access uses `SubscriptionRole` ('learner' | 'lite' | 'pro') with message limits
  and challenge gating.
