# Phase 1 — VERIFICATION

## Manual Verification (developer)
- `formatCourseLength`: 3600 → `1h`, 5400 → `1.5h`, 0 → `0h`.
- `formatLessonLength`: 60 → `1 min`, 59 → `1 min` (ceil), 300 → `5 min`.
- `canAccessAI('learner')` → false, `canAccessAI('pro')` → true.
- `getAIMessageLimit('lite')` → 20, `getAIMessageLimit('bogus')` → 0.
- `canAccessChallenges('learner')` → false, `canAccessChallenges('pro')` → true.

## Automated Tests
- Unit tests added for `format-course-length.ts` and `payment/access.ts` (see test files).
- DB logic unit tests added in `app/.server/database/utils.test.ts` (mocked `db` + `bcrypt`).
- E2E: BLOCKED — no browser test runner installed in the project.

## Bugs Discovered (by tests, not yet fixed)
1. `getCourseLessonCount` (`database/utils.ts:170`) parses `result.rows[0]` (the row
   object `{ count: 12 }`) with `z.number()` instead of `result.rows[0].count`. Returns a
   ZodError at runtime. Test `returns the numeric count from the first row` is RED.
2. `getCourse` (`database/utils.ts:63`) calls `z.safeParse(courseSchema, result)` where
   `result` is the whole `{ rows: [...] }` object, not `result.rows[0]`. Always returns
   null for valid data. Test `returns the course when the row is valid` is RED.
