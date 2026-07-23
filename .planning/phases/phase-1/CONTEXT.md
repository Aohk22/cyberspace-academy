# Phase 1 — CONTEXT

## Acceptance Criteria

1. Course length and lesson length format correctly for whole and fractional values.
2. Subscription gating:
    - `learner` cannot use AI (limit 0) and cannot access challenges.
    - `lite` can use AI (limit 20) and can access challenges.
    - `pro` can use AI (unlimited) and can access challenges.
    - Unknown role defaults to learner behavior (no AI, no challenges).
3. Auth and queries run against PostgreSQL and parse rows via Zod.

## Decisions

- Pure helpers kept framework-free so they are unit-testable without a DB or DOM.
- E2E coverage deferred until a browser runner (Playwright) is installed.
