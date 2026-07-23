# Testing Patterns

**Analysis Date:** 2026-07-15

## Test Framework

**Runner:**

- No test framework detected
- No test runner configured (`jest`, `vitest`, `mocha`, `ava`, `playwright`, `cypress` — none found)
- No test configuration files: `jest.config.*`, `vitest.config.*`, `.jest*`, `.vitest*` — none found

**Run Commands:**

```bash
# No test scripts exist in package.json
# The only verification scripts are:
pnpm run typecheck   # react-router typegen && tsc
pnpm run fmt         # prettier . --write
```

**Assertion Library:**

- Not applicable — no test framework installed

## Test File Organization

**Test Files:**

- Zero test files found in the entire repository
- No `*.test.*` or `*.spec.*` files exist anywhere
- No `__tests__` directories exist
- No `coverage/` directory (listed in `.prettierignore` but does not exist)
- `.prettierignore` references `coverage` but no coverage tool is configured

**Naming:**

- No test naming convention established

## Test Structure

**Current State:**

- The project has zero test coverage across all layers (components, pages, server queries, utilities, middleware, routes)

## Mocking

**Framework:**

- Not applicable — no test infrastructure

**Current Mocking Strategy:**

- No mocking patterns established. The `@payos/node` and `@payos/payos-checkout` payment SDKs, `bcrypt`, `drizzle-orm`, and `pg` database client are used directly without test wrappers.

## Fixtures and Factories

**Seed Data:**

- The only test-like data lives in `scripts/seed.ts`, which inserts sample database records for development/demo purposes
- Seed data covers: users, categories, courses, modules, lessons, reviews, challenges, tags, learning paths
- Seed script uses hardcoded arrays of objects, not factories

**Location:**

- `scripts/seed.ts` — development database seed (not used for automated testing)

## Coverage

**Requirements:**

- None enforced
- No coverage tool (istanbul, c8, vitest --coverage) installed
- No coverage thresholds set

**View Coverage:**

```bash
# No coverage command available
```

## Test Types

**Unit Tests:**

- Not present
- No pattern established

**Integration Tests:**

- Not present
- No pattern established

**E2E Tests:**

- Not present
- No framework installed (Playwright, Cypress, Puppeteer — none detected)

## Potential Testing Patterns (Not Yet Established)

Based on codebase structure, the following testing patterns would align with the existing codebase conventions if tests were introduced:

**Component Tests:**

- Components are pure React with props — well-suited for React Testing Library
- Co-located test file pattern would fit: `ComponentName.test.tsx` next to `ComponentName.tsx`

**Query/Object Tests:**

- Named export functions in `app/.server/queries/` take typed params and return typed data — testable with mocked DB
- Utility functions in `app/utils/` are pure functions — directly testable

**Route Tests:**

- React Router v7 `loader`/`action` patterns are well-defined and testable via `createRequestHandler` or integration tests

## Dependencies Relevant to Testing

**Installed packages that could support testing:**

- `@types/react` v19.2.7 (provides types for testing libraries)
- `@types/react-dom` v19.2.3 (provides types for DOM testing)
- `typescript` v5.9.2 (type-checking foundation)
- `vite` v7.1.7 (test runner compatibility via vitest)

**Packages NOT installed (commonly used for testing React apps):**

- `vitest` — Vite-native test runner
- `@testing-library/react` — React component testing
- `@testing-library/jest-dom` — DOM matchers
- `@testing-library/user-event` — User interaction simulation
- `playwright` or `cypress` — E2E testing

## CI/CD

- No test steps in CI pipeline
- Only docs deployment (MkDocs to GitHub Pages) is configured in CI
- No test or typecheck check runs in CI

---

_Testing analysis: 2026-07-15_
