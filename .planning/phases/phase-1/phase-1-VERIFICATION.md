# Phase 1 — VERIFICATION

## Manual Verification (developer)
- `formatCourseLength`: 3600 → `1h`, 5400 → `1.5h`, 0 → `0h`.
- `formatLessonLength`: 60 → `1 min`, 59 → `1 min` (ceil), 300 → `5 min`.
- `canAccessAI('learner')` → false, `canAccessAI('pro')` → true.
- `getAIMessageLimit('lite')` → 20, `getAIMessageLimit('bogus')` → 0.
- `canAccessChallenges('learner')` → false, `canAccessChallenges('pro')` → true.

## Automated Tests
- Unit tests added for `format-course-length.ts` and `payment/access.ts` (see test files).
- E2E: BLOCKED — no browser test runner installed in the project.
