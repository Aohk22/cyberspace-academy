# Codebase Concerns

**Analysis Date:** 2026-07-15

## Tech Debt

### Hardcoded plan prices at $0 (payment non-functional)

- **Issue:** All plan prices are hardcoded to `0` in `app/routes/payment.ts` (lines 11-14), with an explicit TODO comment `// TODO: set VND prices`. This means:
  - Every "checkout" creates a PayOS payment link for 0 VND — the payment flow is a no-op
  - Users can never actually purchase Lite or Pro plans through the UI
  - The entire subscription/payment integration is effectively untestable end-to-end
- **Files:** `app/routes/payment.ts`
- **Impact:** Payment system is cosmetic only — critical revenue feature is non-functional
- **Fix approach:** Replace `PLAN_PRICES` with real VND values (e.g., `Lite: 99000`, `Pro: 199000`) and test the full PayOS checkout + webhook flow

### No tests or linting configured

- **Issue:** As documented in `AGENTS.md`: "There are no test or lint scripts." Verification relies only on `typecheck` + `fmt`.
- **Files:** `package.json` (scripts section)
- **Impact:** Regressions are only caught at runtime in dev. No CI pipeline enforces quality gates.
- **Fix approach:** Add vitest config and at least smoke tests for critical paths. Add eslint or biome for static analysis.

### Inconsistent database query approach

- **Issue:** Codebase mixes two query styles arbitrarily within the same files:
  - Raw SQL via Drizzle's `sql` tagged template (e.g., `app/.server/database/utils.ts`, `app/.server/queries/*.ts`)
  - Drizzle query builder (e.g., `app/.server/database/utils.ts` uses `db.select().from(users).where(eq(...))` for some queries)
  - No consistent pattern — some functions in the same file use both styles
- **Files:** `app/.server/database/utils.ts`, `app/.server/queries/*.ts`
- **Impact:** Maintenance confusion; developers must context-switch between two styles
- **Fix approach:** Document and enforce one pattern. Given AGENTS.md says "Drizzle for schema only — queries use raw sql tagged template", the Drizzle query builder calls should be migrated.

### Debug `console.log` left in production code

- **Issue:** `console.log(res)` is left in `getDashboardData()` — dumps raw query results to stdout on every dashboard load.
- **Files:** `app/.server/queries/dashboard.ts` (line 54)
- **Impact:** Log pollution in production; potential PII leakage if user data is in rows
- **Fix approach:** Remove the `console.log` call

### Stale/unused app/types.ts

- **Issue:** `app/types.ts` defines `Role = 'student' | 'staff'` but the actual roles used across the app are `'learner' | 'staff' | 'lite' | 'pro'`. The type `'student'` doesn't exist anywhere in the schema or logic.
- **Files:** `app/types.ts`
- **Impact:** Dead code that misleads developers about the role system
- **Fix approach:** Either use the file or remove it. If kept, align it with `USER_ROLES` from `app/.server/database/types.ts`.

### Invalid seed bcrypt hashes for two users

- **Issue:** In `scripts/seed.ts`, users 2 and 3 have literal strings `hashed_password_2` and `hashed_password_3` as their password field, not valid bcrypt hashes. Login attempts with any password will fail `bcrypt.compare()` and return "User doesn't exist."
- **Files:** `scripts/seed.ts` (lines 41, 47)
- **Impact:** Seed users 2 (bob@example.com) and 3 (carol@example.com) cannot log in
- **Fix approach:** Use `bcrypt.hashSync('password', 10)` or copy the valid hash from user 1

### Missing `onDelete: 'cascade'` on critical foreign keys

- **Issue:** Several tables have foreign keys to `users` without `onDelete: 'cascade'`, including:
  - `reviews.user_id`, `reviews.course_id`
  - `users_to_lessons.user_id`, `users_to_lessons.lesson_id`
  - `users_to_courses.user_id`, `users_to_courses.course_id`
  - `chat_messages.user_id`
  - `challenge_submissions` (only has cascade on `questionId`, not on `userId`)
- **Files:** `app/.server/database/schema.ts`
- **Impact:** Deleting a user or course can orphan records and fail with FK constraint violations
- **Fix approach:** Add `{ onDelete: 'cascade' }` to all FK references where cascade semantics are correct

### Login error message enables email enumeration

- **Issue:** `app/.server/auth/login.ts` returns `"User doesn't exist."` when email is not found, but a different error for wrong password (implicitly — the generic error is the same string). The `Login.tsx` action returns `{ error: "User doesn't exist." }` for invalid credentials, but the actual validation in `validateCredentials` returns `null` for both missing user AND wrong password — so the error is always the same. **However**, the forgot-password flow has the same pattern and DOES distinguish.
- **Files:** `app/pages/Login.tsx` (line 55), `app/.server/auth/login.ts`
- **Impact:** Low severity for login since the error is actually the same string, but the pattern is risky
- **Fix approach:** Use generic "Invalid email or password" for all login failures

### Forgot password leaks user existence

- **Issue:** `app/pages/ForgotPassword.tsx` (lines 23-26) returns `"No account found with that email address."` vs a success message. This allows attackers to probe which emails are registered.
- **Files:** `app/pages/ForgotPassword.tsx`
- **Impact:** Email enumeration vulnerability — moderate severity
- **Fix approach:** Always return the same generic message regardless of whether the email exists

### Password reset token exposed in URL

- **Issue:** `app/pages/ForgotPassword.tsx` passes the reset token as a URL query parameter (`/reset-password?token=...`). Tokens in URLs are:
  - Logged in browser history
  - Sent in Referer headers to external sites
  - Visible on screen if user shares their screen
- **Files:** `app/pages/ForgotPassword.tsx` (line 37), `app/pages/ResetPassword.tsx` (line 27)
- **Impact:** Token could be intercepted via Referer header or browser history
- **Fix approach:** Use POST-based token submission instead of URL query params

### Social login buttons are non-functional

- **Issue:** Both Login.tsx and Register.tsx have Google and GitHub social login buttons, but they have no `onClick` handlers, no backend endpoints, and no OAuth configuration. They're purely cosmetic.
- **Files:** `app/pages/Login.tsx` (lines 253-273), `app/pages/Register.tsx` (lines 218-231)
- **Impact:** Misleading UI suggesting a feature that doesn't exist
- **Fix approach:** Either implement OAuth or remove the buttons

### Hardcoded OpenRouter model with no configuration

- **Issue:** `app/.server/chat/handler.ts` hardcodes the AI model as `google/gemini-2.0-flash-lite-001` with no environment variable or config to change it.
- **Files:** `app/.server/chat/handler.ts` (line 100)
- **Impact:** Cannot change AI model without code deployment
- **Fix approach:** Read model name from `OPENROUTER_MODEL` env var with fallback

## Known Bugs

### `DrizzleQueryError` import is incorrect

- **Issue:** `app/.server/auth/login.ts` (line 2) imports `DrizzleQueryError` from `drizzle-orm`, but this class is not exported by drizzle-orm. The import resolves to `undefined`, so the `catch (e)` block's `instanceof DrizzleQueryError` check always fails, and every DB error is re-thrown as unhandled.
- **Files:** `app/.server/auth/login.ts`
- **Trigger:** Any database error during login (e.g., connection failure) will crash the request instead of returning null
- **Workaround:** None — this will cause 500 errors on DB failures during login
- **Fix approach:** Remove the `DrizzleQueryError` import and catch block, or use the correct error class (`PostgresError`, `DatabaseError` from `pg`)

### Register error can return stale error on duplicate email

- **Issue:** `app/.server/auth/register.ts` (line 24-27) catches `DrizzleQueryError` but in newer versions of drizzle/pg, the error may be thrown as `PostgresError` from the `pg` driver. If the error class changes, duplicate email registrations will crash instead of returning `null`.
- **Files:** `app/.server/auth/register.ts`
- **Trigger:** Registration with duplicate email under certain Drizzle versions
- **Workaround:** None if it crashes
- **Fix approach:** Check for the unique constraint violation by inspecting `e.code` property rather than using instanceof

### `getCourseLessonCount` returns NaN on empty courses

- **Issue:** `app/.server/database/utils.ts` line 162: `SELECT COUNT(l.id)` returns a single column, but `z.number().parse(result.rows[0])` tries to parse an object like `{ count: "0" }` as a number — this will throw a Zod error instead of returning 0.
- **Files:** `app/.server/database/utils.ts` (line 170)
- **Trigger:** Courses with no lessons
- **Workaround:** Only called on courses that presumably have lessons
- **Fix approach:** Use `z.object({ count: z.coerce.number() }).parse(result.rows[0]).count` or alias the column

### Password reset success message uses wrong Tailwind class

- **Issue:** `app/pages/Login.tsx` line 112: The reset success banner uses `text-primary` (matching the background `bg-primary`) — white text on white-ish background may be invisible depending on theme.
- **Files:** `app/pages/Login.tsx` (line 112)
- **Trigger:** Viewing login page after successful password reset
- **Workaround:** None, but the banner is still in the DOM
- **Fix approach:** Change to appropriate contrasting text color

## Security Considerations

### Missing CSRF protection

- **Issue:** All state-changing actions (login, register, payment, profile updates, admin operations) use cookie-based session auth without CSRF tokens. Standard `sameSite: 'lax'` mitigates top-level CSRF but doesn't protect against subdomain attacks or POST-based CSRF.
- **Files:** All route actions (`app/routes/*`, `app/pages/**/route.tsx` equivalents with `action` exports)
- **Current mitigation:** `sameSite: 'lax'` on session cookie provides partial protection
- **Recommendations:** Add CSRF token validation for all state-changing POST requests, especially payment webhook and admin operations

### No rate limiting on auth endpoints

- **Issue:** Login (`app/pages/Login.tsx`), register (`app/pages/Register.tsx`), and forgot-password (`app/pages/ForgotPassword.tsx`) have no rate limiting or brute-force protection.
- **Files:** `app/pages/Login.tsx`, `app/pages/Register.tsx`, `app/pages/ForgotPassword.tsx`
- **Current mitigation:** None
- **Recommendations:** Add rate limiting via middleware or a package like `express-rate-limit` (or build into react-router middleware). Minimum: 5 attempts per minute per IP on login.

### No security headers

- **Issue:** No HSTS, CSP, X-Frame-Options, or X-Content-Type-Options headers are set anywhere in the application.
- **Files:** `app/root.tsx` (no headers), `vercel.json` (no headers config)
- **Current mitigation:** None
- **Recommendations:** Set security headers via Vercel config (`vercel.json` headers) or React Router `headers` export

### No connection pool limits

- **Issue:** `app/.server/database/connection.ts` creates a PG Pool with no `max` connection limit. Under load, the pool could exhaust database connections.
- **Files:** `app/.server/database/connection.ts` (line 11-13)
- **Current mitigation:** None (default Pool max depends on pg version, typically 10)
- **Recommendations:** Set an explicit `max: 20` (or appropriate for the database tier) on the Pool

## Performance Bottlenecks

### Drizzle SQL logger enabled

- **Issue:** `app/.server/database/connection.ts` sets `logger: true` on the Drizzle client. This logs every single SQL query to stdout in all environments.
- **Files:** `app/.server/database/connection.ts` (line 25)
- **Cause:** Always-on during development, likely left on by accident
- **Improvement path:** Conditionally enable logger based on `APP_ENV` or `NODE_ENV`

### N+1 queries in course detail loading

- **Issue:** `getCourseDetailData()` in `app/.server/queries/course-detail.ts` runs 4 separate queries sequentially:
  1. Enrollment check
  2. Full course/module/lesson data
  3. Review stats (AVG rating + COUNT)
  4. Student count
- **Files:** `app/.server/queries/course-detail.ts`
- **Cause:** Sequential queries 3 and 4 could be combined into one, or at least run in parallel via `Promise.all`
- **Improvement path:** Combine review stats query into a single query, or use `Promise.all` for independent queries

### Excessive client-side aggregation in learning-paths

- **Issue:** `getLearningPaths()` in `app/.server/queries/learning-paths.ts` runs 4+ separate SQL queries and does heavy client-side aggregation using Maps and loops. This data could be fetched in 1-2 efficient queries.
- **Files:** `app/.server/queries/learning-paths.ts`
- **Cause:** Complex data shape requirement mapped with multiple round-trips
- **Improvement path:** Consolidate queries — use PostgreSQL window functions or CTEs to fetch aggregated data in fewer round-trips

### Admin user list has no pagination

- **Issue:** `app/pages/admin/AdminUsers.tsx` loads ALL users with no pagination. As user count grows, this will become slow and memory-intensive.
- **Files:** `app/pages/admin/AdminUsers.tsx` (loader function)
- **Cause:** No LIMIT/OFFSET or cursor-based pagination implemented
- **Improvement path:** Add LIMIT/OFFSET with page parameter

## Fragile Areas

### CourseBuilder.tsx — 813 lines (largest file)

- **Files:** `app/pages/CourseBuilder.tsx`
- **Why fragile:** The largest file in the codebase, handling course CRUD, module management, lesson editing, challenge questions, and cascading deletes. Complex data flow with manual ID mapping and multiple DB operations. Easy to introduce ordering bugs or orphaned records.
- **Safe modification:** Add tests first. Break into smaller modules (course CRUD, module CRUD, lesson CRUD, challenge management).
- **Test coverage:** Zero — no tests exist

### ChallengeSystem.tsx — 736 lines

- **Files:** `app/pages/Challenges.tsx`
- **Why fragile:** Very large page component with inline filtering, flag submission, category/difficulty filtering, animated UI, and complex state interactions. No separation between data fetching and UI rendering.
- **Safe modification:** Extract filtering logic into custom hooks and challenge list into a separate component.
- **Test coverage:** Zero

### learning-paths.ts query layer — 291 lines

- **Files:** `app/.server/queries/learning-paths.ts`
- **Why fragile:** Complex multi-query aggregation with 4+ separate SQL queries and client-side Map merging. Schema changes to `path_courses`, `path_challenges`, `user_challenges`, or `users_to_courses` could break silently.
- **Safe modification:** Add integration tests for query results before refactoring.
- **Test coverage:** Zero

### PaymentWebhook idempotency and race conditions

- **Files:** `app/routes/PaymentWebhook.ts`
- **Why fragile:** Webhook handler checks `order.status === 'PAID'` but doesn't use `SELECT ... FOR UPDATE` or optimistic locking. Duplicate webhook deliveries (common with PayOS) could race and double-process.
- **Safe modification:** Add `SELECT ... FOR UPDATE` in the transaction, or use a unique constraint on a webhook event ID column.
- **Test coverage:** No webhook integration tests

## Scaling Limits

### Auth session is in-memory cookie only

- **Issue:** Session data is stored entirely in a signed cookie (`__session`). Max cookie size (~4KB) limits how much data can be stored. The `SessionData` type currently fits, but adding more fields could exceed limits. No server-side session store.
- **Current capacity:** ~200 bytes used out of ~4KB limit
- **Limit:** Adding large session data (e.g., permission arrays, user settings) could exceed cookie size
- **Scaling path:** Migrate to server-side session store (Redis, DB) with a session ID cookie

### No connection pooling for serverless

- **Issue:** The app is configured for Vercel (`vercel.json`), but `pg.Pool` is designed for long-lived server processes, not serverless functions. Each serverless invocation may create new connections.
- **Current capacity:** Default Pool of 10 connections
- **Limit:** Under concurrent serverless load, connections will be exhausted
- **Scaling path:** Use `@neondatabase/serverless` or `pg-Promise` with serverless connection management

## Dependencies at Risk

### @payos/node — Vietnamese-only payment provider

- **Risk:** PayOS is a Vietnamese payment gateway. International users cannot use the payment system. If PayOS changes their API, the app breaks without a fallback.
- **Impact:** Entire payment/subscription flow is vendor-locked
- **Migration plan:** Abstract payment provider behind an interface and support multiple providers

### No TypeScript CI enforcement

- **Risk:** While `tsc` is available as a script, there is no CI pipeline enforcing type checking. PRs with type errors can be merged.
- **Impact:** Type errors can accumulate
- **Fix approach:** Add a GitHub Actions workflow that runs `pnpm run typecheck`

## Missing Critical Features

### Email sending not implemented

- **Problem:** Forgot password flow generates a reset token and link, but has no email sending integration. The link is shown directly in the UI with comment "In production this would be emailed."
- **Blocks:** Password reset workflow is only usable in dev mode; production deployment requires Resend/SendGrid/SMTP integration

### No audit logging

- **Problem:** No logging of admin actions (user creation, deletion, role changes). No audit trail for security events.
- **Blocks:** Compliance with security best practices; cannot detect or investigate admin abuse

### No content moderation for reviews

- **Problem:** Reviews are inserted directly without any moderation, sanitization, or abuse detection
- **Blocks:** Platform could be used to post inappropriate content

## Test Coverage Gaps

- **All areas:** Zero test coverage across the entire codebase
- **Critical gaps:** Auth flows (login, register, password reset), payment webhook, query logic, course builder CRUD
- **Risk:** Any refactor or dependency update risks breaking core flows without detection
- **Priority:** High

---

*Concerns audit: 2026-07-15*
