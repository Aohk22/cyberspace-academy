<!-- refreshed: 2026-07-15 -->

# Architecture

**Analysis Date:** 2026-07-15

## System Overview

```text
┌───────────────────────────────────────────────────────────────────────┐
│                        PUBLIC ROUTES (Unauthenticated)                │
│   /login  /register  /forgot-password  /reset-password               │
│   `app/pages/Login.tsx` et al.  (no layout wrapper)                   │
└──────────────────────────┬────────────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     AUTH MIDDLEWARE (Route Guard)                     │
│   `app/middleware/auth.ts`   +   `app/routes/protected.tsx`           │
│   Session → cookie `__session`  →  UserContext injected               │
└──────────────────────────┬────────────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     MAIN LAYOUT (App Shell)                           │
│   `app/layouts/MainLayout.tsx`                                        │
│   Sidebar nav + top header + outlet                                   │
│   Suspense-lazy: AiTutor, PricingModal                                │
├──────────────────────┬──────────────────────┬─────────────────────────┤
│  SECTION LAYOUT      │ UNDER CONSTRUCTION   │ ADMIN-PROTECTED LAYOUT  │
│  `SectionLayout.tsx` │ `UnderConstruction..`│ `routes/admin-protected`│
│  Title/subtitle bar  │ Coming-soon wrapper  │ adminMiddleware guard   │
└──────────┬───────────┴──────────────────────┴─────────┬───────────────┘
           │                                             │
           ▼                                             ▼
┌──────────────────────────┐            ┌──────────────────────────────┐
│  USER PAGES              │            │  ADMIN PAGES                 │
│  Dashboard  Courses      │            │  AdminDashboard  Users       │
│  CourseDetail  Lesson    │            │  CourseBuilder  Categories   │
│  LearningPath  Settings  │            │  Paths  AdminUserEdit        │
│  Challenges  Achievements│            │  AdminCreateUser             │
│  `app/pages/*.tsx`       │            │  `app/pages/admin/*.tsx`     │
└──────────────────────────┘            └──────────────────────────────┘
           │
           ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      SERVER LAYER (Server-only)                       │
│  `app/.server/`                                                       │
│                                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ DATABASE     │  │ AUTH         │  │ PAYMENT   │  │ CHAT         │  │
│  │ schema.ts   │  │ login.ts    │  │ provider  │  │ handler.ts   │  │
│  │ connection  │  │ register.ts │  │ access.ts │  │ OpenRouter   │  │
│  │ queries/    │  │ sessions.ts │  │           │  │ API call     │  │
│  │ types.ts    │  │             │  │           │  │              │  │
│  │ utils.ts    │  │             │  │           │  │              │  │
│  └─────────────┘  └──────────────┘  └───────────┘  └──────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    DATA STORE (PostgreSQL)                            │
│   Schema: `cyberspace`  via  pgSchema  in Drizzle                    │
│   Tables: users, courses, modules, lessons, challenges, orders, etc. │
│   Connection: pg Pool → drizzle({ client: pool })                    │
└───────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component             | Responsibility                                                 | File                                 |
| --------------------- | -------------------------------------------------------------- | ------------------------------------ |
| Root Layout           | HTML shell, `<ThemeProvider>`, global error boundary           | `app/root.tsx`                       |
| MainLayout            | Authenticated app shell: sidebar nav, header, outer chrome     | `app/layouts/MainLayout.tsx`         |
| SectionLayout         | Content wrapper: title/subtitle header per section             | `app/layouts/SectionLayout.tsx`      |
| Protected Route       | Applies `authMiddleware`, redirects unauthenticated users      | `app/routes/protected.tsx`           |
| Admin Protected Route | Applies `adminMiddleware`, redirects non-staff users           | `app/routes/admin-protected.tsx`     |
| Auth Middleware       | Reads session cookie, validates, sets `userContext`            | `app/middleware/auth.ts`             |
| Admin Middleware      | Checks `userContext.role === 'staff'`                          | `app/middleware/admin.ts`            |
| Route Manifest        | Single file listing all routes with layout nesting             | `app/routes.ts`                      |
| DB Connection         | pg Pool + Drizzle client, sets `search_path` to `cyberspace`   | `app/.server/database/connection.ts` |
| DB Schema             | All Drizzle table definitions under `cyberspace` pgSchema      | `app/.server/database/schema.ts`     |
| Zod Types             | `createSelectSchema` + extended Zod schemas for row parsing    | `app/.server/database/types.ts`      |
| DB Utils              | Mix of Drizzle builder and raw SQL utility functions           | `app/.server/database/utils.ts`      |
| Query Files           | Domain-specific raw SQL queries with Zod row validation        | `app/.server/queries/*.ts`           |
| Auth Services         | Login validation, registration, session management             | `app/.server/auth/*.ts`              |
| Payment Provider      | PayOS SDK wrapper for payment link CRUD + webhook verification | `app/.server/payment/provider.ts`    |
| Payment Access        | Subscription-based feature gating (AI, challenges)             | `app/.server/payment/access.ts`      |
| Chat Handler          | OpenRouter API integration with rate limiting                  | `app/.server/chat/handler.ts`        |
| User Context          | React Router `createContext` for authenticated user data       | `app/context.ts`                     |
| Theme Context         | Client-side light/dark theme toggle with localStorage          | `app/theme-context.tsx`              |
| Env Loader            | Loads `.dev.env`/`.preview.env`/`.prod.env` based on `APP_ENV` | `app/.server/env.ts`                 |

## Pattern Overview

**Overall:** React Router v7 Framework — SSR with nested layouts, middleware, and file-based route action/loader pattern.

**Key Characteristics:**

- **Single route manifest** (`app/routes.ts`) — routes defined in a central config, not file-system routing
- **Nested layout hierarchy** — Unauthenticated → AuthGuard → MainLayout → SectionLayout → AdminGuard
- **Middleware-based auth** — Route-level middleware (`v8_middleware: true`) that injects user via `context.set(userContext, ...)`
- **Server-only code isolation** — Files/directories named `.server/` are tree-shaken from client bundles
- **Raw SQL over ORM** — Drizzle used only for table definition + connection; all queries use `sql` tagged template literals
- **Zod row parsing** — Every raw SQL query result is parsed through a Zod schema for type safety
- **Suspense + Await** — Promise-based deferred data loading in page components

## Layers

**Public Pages Layer:**

- Purpose: Unauthenticated entry points (login, register, password reset)
- Location: `app/pages/` (Login.tsx, Register.tsx, etc.)
- Contains: Route loaders for redirect logic, route actions for form processing, page components
- Depends on: `app/.server/auth/` for session and credential validation
- Used by: Direct URL access (no layout wrapper in route config)

**Middleware Layer:**

- Purpose: Route-level guards that redirect unauthenticated/non-admin users
- Location: `app/middleware/auth.ts`, `app/middleware/admin.ts`
- Contains: `MiddlewareFunction` that reads session, validates, sets `userContext`
- Depends on: `app/.server/auth/sessions.ts`, `app/.server/database/utils.ts`
- Used by: `app/routes/protected.tsx`, `app/routes/admin-protected.tsx`

**Layout Layer:**

- Purpose: Nested UI chrome — sidebar, header, section title bars
- Location: `app/layouts/MainLayout.tsx`, `app/layouts/SectionLayout.tsx`, `app/layouts/UnderConstructionLayout.tsx`
- Contains: Nav components, theme toggle, AI tutor button, pricing modal
- Depends on: `app/context.ts` (via loader), `app/theme-context.tsx`
- Used by: Routes nested inside layout wrappers in `app/routes.ts`

**Page Layer:**

- Purpose: Individual route components with loaders, actions, and UI
- Location: `app/pages/*.tsx`, `app/pages/admin/*.tsx`
- Contains: Route loader for data fetching, route action for form/mutation handling, React components
- Depends on: `app/.server/queries/` for data, `app/components/` for UI
- Used by: Router based on URL matching

**Server Layer:**

- Purpose: All server-only business logic, never imported on client
- Location: `app/.server/`
- Sub-layers:
    - **Auth** (`auth/`): Login validation, registration, cookie sessions
    - **Database** (`database/`): Drizzle schema, connection, types, utility queries
    - **Queries** (`queries/`): Domain-specific raw SQL query functions
    - **Payment** (`payment/`): PayOS provider, access control gating
    - **Chat** (`chat/`): OpenRouter AI tutor integration
- Used by: Middleware, Page loaders/actions

## Data Flow

### Primary Request Path (Page Load)

1. HTTP request hits React Router SSR handler (`app/root.tsx` → `client export`)
2. Router matches URL against `app/routes.ts` manifest
3. Middleware executes in order:
    - `authMiddleware` (`app/middleware/auth.ts`): Reads `__session` cookie, validates, sets `userContext`
    - `adminMiddleware` (`app/middleware/admin.ts`): Checks `userContext.role === 'staff'`
4. Route loader executes in the matched page component:
    - Calls query functions from `app/.server/queries/` or `app/.server/database/utils.ts`
    - Queries execute via `db.execute(sql`...`)` with Zod row parsing
    - Returns data object (may contain promises for deferred loading)
5. Layout loaders execute (e.g., `MainLayout` reads `userContext`)
6. React renders component tree: Layout > SectionLayout > Page
7. Deferred promises resolve via `<Suspense>` + `<Await>` in the component

### Form Action / Mutation Flow

1. User submits a form via `<Form method="POST">` or `useFetcher.submit()`
2. Route action handler in `app/pages/*.tsx` or `app/routes/*.ts` (e.g., `payment.ts`)
3. Action validates input (Zod), performs DB mutations (raw SQL or Drizzle builder)
4. Returns JSON response or redirect with cookies

### Payment Flow

1. User clicks "Upgrade" in `PricingModal` (`app/components/PricingModal.tsx`)
2. `CheckoutModal` submits form to `/payment` action (`app/routes/payment.ts`)
3. Server creates order in `orders` table (DB), generates PayOS payment link
4. Client redirects to PayOS checkout URL
5. PayOS webhook POSTs to `/payment-webhook` (`app/routes/PaymentWebhook.ts`)
6. Webhook verifies signature via PayOS, updates order to `PAID`, extends user subscription
7. User is redirected back to `payment/success` or `payment/cancel`

### AI Chat Flow

1. User opens AiTutor panel (`app/components/AiTutor.tsx`)
2. Sends message → POST to `/api/chat` (`app/routes/api.chat.ts`)
3. Server validates session role, checks daily rate limit (`chat_messages` table)
4. Calls OpenRouter API with system prompt + conversation history
5. Returns AI response text

### Auth Flow

1. Login form POST → `Login.tsx` action → `validateCredentials()` in `app/.server/auth/login.ts`
2. Successful auth: session created via `commitSession()` → `Set-Cookie: __session`
3. Subsequent requests: `authMiddleware` reads session cookie, hydrates `userContext`
4. Subscription expiry checked on every middleware invocation; expired roles downgraded to `learner`

**State Management:**

- **Server state:** Query results loaded per-route via React Router loaders — no global client store
- **Session:** Cookie-based (`createCookieSessionStorage`), server-side only
- **Client state:** Local React state, `useFetcher` for mutations, `useTheme` context for theme
- **Deferred data:** Promises returned from loaders, resolved with `<Suspense>` + `<Await>`

## Key Abstractions

**UserContext:**

- Purpose: Provides authenticated user data (id, name, role, subscription) through the route context
- Created in: `app/context.ts` via `createContext<UserContext | null>(null)`
- Set by: `authMiddleware` via `context.set(userContext, ...)`
- Read by: Layouts and pages via `context.get(userContext)` in loaders
- Pattern: React Router's framework context API (not React's `createContext`)

**Query Functions:**

- Purpose: Encapsulate raw SQL queries with Zod validation
- Examples: `app/.server/queries/courses.ts`, `app/.server/queries/dashboard.ts`
- Pattern: `async function getX(params): Promise<XType[]>` → `db.execute(sql\`...\`)`→`z.array(schema).parse(res.rows)`

**Route Handles (SectionMetadata):**

- Purpose: Declarative section title/subtitle per route, consumed by `SectionLayout`
- Location: Route pages export `export const handle = { section: { title, subtitle } }`
- Pattern: `useMatches()` in `SectionLayout` walks route matches to find the deepest section handle

**Middleware Guard Pattern:**

- Purpose: Protect route trees from unauthorized access
- Pattern: A route component file exports `middleware: Route.MiddlewareFunction[]` array
- Files: `app/routes/protected.tsx`, `app/routes/admin-protected.tsx`

**Database Schema Pattern:**

- Purpose: Single source of truth for table definitions via Drizzle
- Location: `app/.server/database/schema.ts`
- Pattern: All tables under `cyberspaceSchema = pgSchema('cyberspace')`, with foreign keys, defaults, and unique constraints

## Entry Points

**Application Entry:**

- Location: `app/root.tsx` - Root Layout component with `<html>`, `<ThemeProvider>`, `<Outlet>`, global error boundary
- Triggers: Any URL hit on the deployed app
- Responsibilities: HTML shell, font preconnect, theme flash prevention, error boundary

**Auth Entry:**

- Location: `app/middleware/auth.ts` - `authMiddleware`
- Triggers: Every request to a route nested under `routes/protected.tsx`
- Responsibilities: Session verification, user context hydration, subscription expiry check

**API Entry Points:**

- `/payment-webhook` → `app/routes/PaymentWebhook.ts` — PayOS webhook receiver (POST only)
- `/api/chat` → `app/routes/api.chat.ts` — AI chat endpoint (POST, via action)
- `/payment` → `app/routes/payment.ts` — Payment link creation (POST, via action)

## Architectural Constraints

- **Server-only code:** Everything in `app/.server/` (and subdirectories) must never be imported on the client. React Router enforces this via tree-shaking. Violation = leaked secrets.
- **Auth dependency:** Every page under `MainLayout` depends on `userContext` being non-null. The `authMiddleware` always sets it before these routes render.
- **SSR by default:** `react-router.config.ts` has `ssr: true`. All routes render server-side first.
- **Database schema lockstep:** Drizzle schema (`schema.ts`) must match the PostgreSQL `cyberspace` schema. `db:push` syncs them, `db:generate` creates migration files.
- **No Drizzle query builder:** Queries must use `sql` tagged template literals + Zod parsing, not Drizzle's ORM query builder. (`database/utils.ts` contains the only exceptions for simple selects.)
- **Single route manifest:** All routes defined in one file (`app/routes.ts`), not file-system routing.

## Anti-Patterns

### Mixing Drizzle builder and raw SQL

**What happens:** `app/.server/database/utils.ts` uses both Drizzle query builder (`db.select().from(users).where(eq(...))`) and raw SQL (`db.execute(sql\`...\`)`), while `app/.server/queries/` uses only raw SQL. This is inconsistent.
**Do this instead:** Use raw SQL everywhere for consistency. The only exception could be simple single-row selects.

### Prices set to zero

**What happens:** `app/routes/payment.ts` has `PLAN_PRICES: { Lite: 0, Pro: 0 }` with a `TODO: set VND prices` comment. The payment flow is wired end-to-end but produces free transactions.
**Fix approach:** Replace with real VND prices once the pricing is finalized.

### Social login buttons as visual-only

**What happens:** `app/pages/Login.tsx` has Google and GitHub buttons rendered in the UI, but they are `<button type="button">` elements with no action handler. They are visual placeholders only.

## Error Handling

**Strategy:** Route-level error boundaries with React Router's `ErrorBoundary`.

**Patterns:**

- `app/root.tsx` exports `ErrorBoundary` component — catches all unhandled errors
- `isRouteErrorResponse(error)` check to differentiate HTTP errors (404, 500) from unexpected exceptions
- Stack traces shown only in `import.meta.env.DEV` mode
- Auth middleware throws `redirect()` for auth failures (not rendered error pages)
- Custom `NoUserContextError` class (`app/error.ts`) for missing user context

## Cross-Cutting Concerns

**Logging:** Ad-hoc `console.log`/`console.error` calls — no structured logging framework

- `app/.server/database/connection.ts`: `console.error` for pool errors
- `app/.server/auth/login.ts`: `console.log` for DrizzleQueryError
- `app/routes/PaymentWebhook.ts`: `console.error` for webhook verification failures
- `app/.server/queries/dashboard.ts`: `console.log(res)` for query debugging

**Validation:** Zod v4 used throughout:

- Form data parsing in route actions
- Row result parsing in every raw SQL query
- Drizzle schema validation via `createSelectSchema` in `types.ts`

**Authentication:** Cookie-based sessions with bcrypt password hashing:

- Session cookie: `__session`, httpOnly, sameSite=lax, 1-hour expiry (30-day if "remember me")
- Password hashing: bcrypt, 10 salt rounds

---

_Architecture analysis: 2026-07-15_
