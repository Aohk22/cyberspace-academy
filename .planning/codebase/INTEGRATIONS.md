# External Integrations

**Analysis Date:** 2026-07-15

## APIs & External Services

**AI/Language Model:**
- **OpenRouter API** — Powers the AI Tutor chat feature (`app/.server/chat/handler.ts`)
  - SDK/Client: Direct `fetch()` to `https://openrouter.ai/api/v1/chat/completions`
  - Model: `google/gemini-2.0-flash-lite-001`
  - Auth: `Authorization: Bearer <OPENROUTER_API_KEY>` header
  - Max tokens: 1024 per request
  - System prompt: Guides the AI as "CyberSpace Academy AI tutor"
  - Rate limiting: Daily message caps (Learner=0, Lite=20, Pro=unlimited) tracked in DB table `chat_messages`

**Payments:**
- **PayOS** — Vietnamese payment gateway for subscription upgrades (`app/.server/payment/provider.ts`)
  - SDK/Client: `@payos/node` v2.0
  - Auth: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` env vars
  - Operations used:
    - `paymentRequests.create()` — Create checkout links
    - `paymentRequests.get()` — Query payment status
    - `paymentRequests.cancel()` — Cancel payment links
    - `webhooks.verify()` — Verify webhook signatures
  - Client-side checkout: `@payos/payos-checkout` v1.0 installed but unused in application code (redirects to PayOS hosted page instead)
  - Webhook endpoint: `POST /payment-webhook` (`app/routes/PaymentWebhook.ts`)
  - Plans: Lite, Pro (prices currently set to 0 — TODO in `app/routes/payment.ts`)

## Data Storage

**Databases:**
- **PostgreSQL** — Primary data store
  - Connection: `DATABASE_URL` env var (connection string)
  - Client: `pg` v8.20 (`Pool` with connection pooling)
  - ORM: Drizzle ORM 0.45 for schema definition + raw `sql` tagged template queries
  - Schema: `cyberspace` (pgSchema in Drizzle, `search_path` set per connection)
  - Migrations: Drizzle Kit (`drizzle.config.ts` — schema `./app/.server/database/schema.ts`, output `./drizzle/out/{env}`)
  - Tables: users, courses, modules, lessons, categories, reviews, users_to_courses, users_to_lessons, challenge_questions, challenge_options, challenge_submissions, challenges, tags, challenge_tags, user_challenges, learning_paths, path_courses, user_paths, path_challenges, password_reset_tokens, chat_messages, orders

**File Storage:**
- **No file storage** — Thumbnails use external URLs (picsum.photos in seed data). No local file uploads.

**Caching:**
- None detected — No Redis, Memcached, or other caching layer.

## Authentication & Identity

**Auth Provider:**
- **Custom session-cookie auth** — No external auth provider (OAuth, SSO)
  - Implementation: `createCookieSessionStorage` from React Router (`app/.server/auth/sessions.ts`)
  - Cookie name: `__session`
  - Encryption: `SESSION_SECRET` env var (signed cookies)
  - Max age: 1 hour (`maxAge: 60 * 60`)
  - Secure: enabled in production
  - Password hashing: `bcrypt` v6 with saltRounds=10 (`app/.server/auth/register.ts`, `app/.server/auth/login.ts`)
  - Roles: `learner`, `lite`, `pro`, `staff`
  - Middleware: `app/middleware/auth.ts` (protected routes), `app/middleware/admin.ts` (staff-only routes)

**Password Reset:**
- **Self-contained** — No email service integration
  - Tokens generated via `crypto.randomBytes(32)` stored in `password_reset_tokens` table
  - Reset link shown directly in UI (dev mode); production TODO for email delivery
  - Expiry: 1 hour

## Monitoring & Observability

**Error Tracking:**
- None — No Sentry, Datadog, or other error monitoring service

**Logs:**
- `console.log` / `console.error` only — No structured logging library
- Drizzle ORM logger: enabled (`logger: true` in connection)

## CI/CD & Deployment

**Hosting:**
- **Vercel** — Production deployment target (`vercel.json` sets `{ "framework": "react-router" }`)
- Production build: `react-router build` outputs `build/client/` + `build/server/`

**CI Pipeline:**
- **GitHub Actions** — Documentation deployment only (`.github/workflows/docs.yml`)
  - Trigger: Push to `main` touching `docs/**` or `mkdocs.yml`
  - Steps: Build MkDocs with Material theme, deploy to `gh-pages` branch via GitHub Pages
  - No test/typecheck CI pipeline

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Secret for signing session cookies

**Optional env vars:**
- `OPENROUTER_API_KEY` — AI chat feature
- `PAYOS_CLIENT_ID` — Payment gateway
- `PAYOS_API_KEY` — Payment gateway
- `PAYOS_CHECKSUM_KEY` — Payment gateway
- `APP_URL` — Base URL for constructing payment return/cancel URLs (default: `http://localhost:5173`)

**Secrets location:**
- `.dev.env` / `.preview.env` / `.prod.env` — Not committed (gitignored by `*.env*` pattern)
- `example.env` — Committed template with placeholder values

## Webhooks & Callbacks

**Incoming:**
- **PayOS webhook** — `POST /payment-webhook` (`app/routes/PaymentWebhook.ts`)
  - Signature verification: `verifyWebhookData()` from `@payos/node`
  - Actions: Marks order as PAID, updates user role (`lite`/`pro`) and `subscriptionEndsAt` (+30 days)
  - Idempotency: Checks for already-processed orders

**Outgoing:**
- None — No webhooks sent to external services

---

*Integration audit: 2026-07-15*
