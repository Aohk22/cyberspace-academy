# Codebase Structure

**Analysis Date:** 2026-07-15

## Directory Layout

```
web-app/
├── app/                          # Application source code
│   ├── .server/                  # Server-only code (never on client)
│   │   ├── auth/                 # Auth services (login, register, sessions)
│   │   ├── chat/                 # AI chat handler (OpenRouter)
│   │   ├── database/             # DB connection + schema + types + utils
│   │   ├── payment/              # PayOS provider + access control
│   │   ├── queries/              # Domain-specific raw SQL query functions
│   │   └── env.ts                # Environment loader
│   ├── components/               # Shared UI components
│   │   ├── course-builder/       # Course builder workspace components
│   │   ├── fallbacks/            # Suspense fallback UI
│   │   └── icons/                # Custom SVG icon components
│   ├── hooks/                    # Custom React hooks
│   ├── layouts/                  # Page layout wrappers
│   ├── middleware/               # Route guard middleware functions
│   ├── pages/                    # Page components (one per route)
│   │   └── admin/                # Admin-only pages
│   ├── routes/                   # Route wrapper + API/standalone route files
│   ├── context.ts                # React Router user context definition
│   ├── error.ts                  # Custom error classes
│   ├── root.tsx                  # Root layout, HTML shell, error boundary
│   ├── routes.ts                 # Single route manifest (all routes defined here)
│   ├── theme-context.tsx         # Light/dark theme context provider
│   ├── theme.css                 # Tailwind v4 CSS with design tokens
│   ├── types.ts                  # Global type definitions
│   └── utils/                    # Utility functions
├── build/                        # Output: client/ + server/ (gitignored)
├── drizzle/                      # Drizzle migration output
│   └── out/                      # Per-environment migration files
├── .react-router/                # React Router generated types (gitignored)
│   └── types/
├── .github/                      # CI workflows
│   └── workflows/
├── .vercel/                      # Vercel deployment config
├── public/                       # Static assets (favicon, icons)
│   └── icons/
├── scripts/                      # DB seed/wiped scripts
├── docs/                         # MkDocs documentation site
├── node_modules/                 # Dependencies (gitignored)
├── .venv/                        # Python virtual env for docs (gitignored)
│
├── package.json                  # Project manifest
├── tsconfig.json                 # TypeScript config (strict, alias ~/*)
├── vite.config.ts                # Vite config (Tailwind, React Router, path aliases)
├── react-router.config.ts        # React Router config (SSR, middleware)
├── drizzle.config.ts             # Drizzle Kit config (PostgreSQL, cyberspace schema)
├── vercel.json                   # Vercel framework config
├── pnpm-workspace.yaml           # pnpm workspace config (allowed deps)
├── .prettierrc                   # Prettier: tabs, single quotes, no semi
├── .prettierignore
├── .gitignore
│
├── example.env                   # Env template (safe to reference)
├── .dev.env                      # Dev environment (gitignored)
├── .preview.env                  # Preview environment (gitignored)
├── .prod.env                     # Production environment (gitignored)
│
├── AGENTS.md                     # Agent instructions (this file)
├── DESIGN.md                     # Design documentation
├── README.md                     # Project README
├── mkdocs.yml                    # Documentation site config
└── pnpm-lock.yaml                # Dependency lockfile
```

## Directory Purposes

**`app/.server/`:**

- Purpose: All server-only code that is tree-shaken from client bundles
- Contains: Auth services, database schema/connection, raw SQL queries, payment provider, chat handler
- Key files:
    - `database/schema.ts`: 281 lines — All Drizzle table definitions (18 tables under `cyberspace` pgSchema)
    - `database/connection.ts`: Drizzle client + pg Pool with `search_path` setup
    - `database/types.ts`: Zod schemas + TypeScript types derived from schema
    - `database/utils.ts`: Mixed Drizzle builder + raw SQL utility functions
    - `auth/sessions.ts`: Cookie session storage (`__session`, httpOnly, 1h expiry)
    - `auth/login.ts`: bcrypt credential validation
    - `auth/register.ts`: User registration with bcrypt hashing
    - `payment/provider.ts`: PayOS SDK wrapper
    - `payment/access.ts`: Subscription-based feature gating
    - `chat/handler.ts`: OpenRouter API integration
    - `env.ts`: `APP_ENV`-based environment file loader

**`app/pages/`:**

- Purpose: One-page-per-route React components with loaders and actions
- Contains: 20 page files covering all user-facing and admin routes
- Key files:
    - `Login.tsx` + `Register.tsx`: Auth pages (unauthenticated, no layout wrapper)
    - `Dashboard.tsx`: Enrolled courses overview with deferred loading
    - `Courses.tsx`: Course catalog with search, category filter
    - `CourseDetail.tsx`: Detailed course view with modules/lessons tree, enrollment, reviews
    - `Lesson.tsx`: Lesson content + challenge section + AI tutor context
    - `LearningPath.tsx` / `LearningPathDetail.tsx`: Learning path listing and detail
    - `Challenges.tsx`: Challenge listing
    - `Settings.tsx`: User settings (profile, password, subscription)
    - `CourseBuilder.tsx`: Admin course creation/editing
    - `admin/AdminDashboard.tsx`, `admin/AdminUsers.tsx`, `admin/AdminCategories.tsx`, etc.
    - `CourseBuilderLesson.tsx`: Admin lesson editor

**`app/components/`:**

- Purpose: Shared/dumb UI components reused across pages
- Contains: 13 entries including complex components and subdirectories
- Key files:
    - `AiTutor.tsx`: AI tutoring chat panel (322 lines)
    - `PricingModal.tsx`: Subscription plan selection modal (240 lines)
    - `CheckoutModal.tsx`: PayOS checkout trigger modal (170 lines)
    - `ChallengeSection.tsx`: Lesson challenge question/answer UI (220 lines)
    - `MarkdownContent.tsx`: Custom Markdown renderer (167 lines)
    - `ContinueLearning.tsx`: Dashboard "continue where you left off" card
    - `RecommendedCourseCard.tsx`: Course preview card
    - `CoursePreviewCard.tsx`: Course detail preview card
    - `StatCard.tsx`: Dashboard stat display
    - `course-builder/`: Course builder sub-components (workspace, forms, tree view, types)
    - `fallbacks/`: Suspense loading skeletons (ContinueLearningFallback, RecommendedCourseFallback)
    - `icons/`: Custom SVG icons (ChromeIcon, GithubIcon)

**`app/layouts/`:**

- Purpose: Nested layout components providing UI chrome
- Contains: 3 layout files
- Key files:
    - `MainLayout.tsx`: Full app shell with collapsible sidebar, header, theme toggle, AI tutor button, pricing modal
    - `SectionLayout.tsx`: Route handle-based title/subtitle header wrapper
    - `UnderConstructionLayout.tsx`: WIP page wrapper with "Coming soon" message

**`app/middleware/`:**

- Purpose: Route guard middleware
- Contains: 2 middleware functions
- Key files:
    - `auth.ts`: Session validation, user context hydration, subscription expiry check (75 lines)
    - `admin.ts`: Staff role check, redirects non-staff to `/dashboard` (12 lines)

**`app/routes/`:**

- Purpose: Route wrapper components and standalone API/action routes
- Contains: 8 files
- Key files:
    - `protected.tsx`: Auth middleware wrapper, exports `shouldRevalidate: true`
    - `admin-protected.tsx`: Admin middleware wrapper
    - `payment.ts`: Payment link creation action
    - `PaymentWebhook.ts`: PayOS webhook receiver (POST only)
    - `api.chat.ts`: AI chat API endpoint
    - `CourseExport.ts`: Course export functionality
    - `ToggleView.ts`: View toggle route
    - `splat-redirect.tsx`: 404 catch-all redirect

**`app/hooks/`:**

- Purpose: Custom React hooks
- Contains: `my-hooks.tsx` with `usePrefersDark()` hook

**`scripts/`:**

- Purpose: Database seed and maintenance scripts (run with `tsx`)
- Contains:
    - `seed.ts`: Seed runner — reads and executes `seed.sql`
    - `seed.sql`: Seed data SQL statements
    - `wipe.ts`: Data deletion script
    - `user-to-lesson-trigger.sql`: Database trigger SQL

**`drizzle/`:**

- Purpose: Drizzle Kit migration output
- Contains: `out/` with per-environment migration directories

**`docs/`:**

- Purpose: MkDocs documentation site
- Contains: Markdown documentation files

## Key File Locations

**Entry Points:**

- `app/root.tsx`: Application entry — root layout, HTML shell, global error boundary
- `app/routes.ts`: Route manifest — all URL-to-component mappings

**Configuration:**

- `package.json`: Scripts, dependencies (React Router, Drizzle, PayOS, Zod, etc.)
- `tsconfig.json`: Strict TypeScript, `~/*` path alias, `verbatimModuleSyntax`
- `vite.config.ts`: Tailwind CSS v4, React Router plugin, path aliases
- `react-router.config.ts`: SSR enabled, `v8_middleware` enabled
- `drizzle.config.ts`: PostgreSQL dialect, `cyberspace` schema filter, env-based config
- `.prettierrc`: Tabs, single quotes, no semicolons, 4-space tab width
- `vercel.json`: Framework = `react-router`

**Core Logic — Server:**

- `app/.server/database/schema.ts`: Drizzle schema — all 18 tables
- `app/.server/database/connection.ts`: pg Pool + Drizzle client
- `app/.server/database/types.ts`: Zod schemas + TS types
- `app/.server/database/utils.ts`: Database utility functions
- `app/.server/queries/*.ts`: Domain-specific queries (courses, dashboard, lesson, etc.)
- `app/.server/auth/sessions.ts`: Cookie session storage
- `app/.server/auth/login.ts`: Login validation
- `app/.server/auth/register.ts`: Registration
- `app/.server/payment/provider.ts`: PayOS SDK wrapper
- `app/.server/payment/access.ts`: Access control
- `app/.server/chat/handler.ts`: OpenRouter AI integration
- `app/.server/env.ts`: Environment loader

**Core Logic — Client:**

- `app/middleware/auth.ts`: Auth guard
- `app/middleware/admin.ts`: Admin guard
- `app/layouts/MainLayout.tsx`: Main app shell
- `app/context.ts`: User context definition
- `app/theme-context.tsx`: Theme provider
- `app/theme.css`: Tailwind + design tokens (124 lines)

**Testing:**

- No test files detected. No test framework configured.

## Naming Conventions

**Files:**

- Page/component files: PascalCase — `Dashboard.tsx`, `MainLayout.tsx`, `AiTutor.tsx`
- Route files: kebab-case or concatenated — `api.chat.ts`, `PaymentWebhook.ts`, `admin-protected.tsx`
- Utility/hook files: kebab-case — `my-hooks.tsx`, `format-course-length.ts`
- Database files: lowercase — `connection.ts`, `schema.ts`, `types.ts`, `utils.ts`
- Query files: lowercase, domain-based — `courses.ts`, `dashboard.ts`, `course-detail.ts`

**Directories:**

- All lowercase: `.server/`, `components/`, `layouts/`, `middleware/`, `pages/`, `routes/`, `queries/`, `hooks/`, `utils/`
- Sub-directories: lowercase — `course-builder/`, `fallbacks/`, `icons/`, `admin/`

**Functions:**

- `camelCase` — `getDashboardData`, `createPaymentLink`, `validateCredentials`, `formatCourseLength`
- Exported async functions for queries: `get[Domain]Data` or `get[Entity]`

**Variables:**

- `camelCase` — `userId`, `actionData`, `fetcherData`, `activeCategory`
- SQL variables: PascalCase for inline SQL columns — `lessonsCount`, `lessonsCompleted` (aliased with quotes in SQL)

**Types:**

- PascalCase — `DashboardData`, `CourseView`, `UserContext`, `LessonPageData`
- Zod schemas: `camelCaseSchema` — `courseSchema`, `dashboardDataSchema`
- Drizzle row types: `typeof table.$inferSelect` — `Course`, `User`, `Lesson`

## Where to Add New Code

**New Feature (Page + Data):**

1. Create query function in `app/.server/queries/<domain>.ts`
2. Add page component in `app/pages/<Feature>.tsx` with loader + action
3. If the page needs a custom layout wrapper, add it in `app/layouts/`
4. Register route in `app/routes.ts`
5. If the page needs shared UI, add sub-components in `app/components/`

**New API Endpoint:**

- Add route file in `app/routes/api.<name>.ts` with `loader` and/or `action` exports
- Register in `app/routes.ts` (route path prefix like `api/`)
- Any server-only logic goes in `app/.server/`

**New Database Table:**

1. Add table definition in `app/.server/database/schema.ts` using `cyberspaceSchema.table()`
2. Add Zod schema + type in `app/.server/database/types.ts`
3. Run `pnpm run db:push` or `pnpm run db:generate && pnpm run db:migrate`

**New Shared Component:**

- Add in `app/components/<ComponentName>.tsx`
- If complex with sub-components, create `app/components/<component-name>/` directory
- Import via `~/components/<ComponentName>` alias

**New Admin Feature:**

- Page file in `app/pages/admin/<Name>.tsx`
- Route nested under `layout('./routes/admin-protected.tsx', [...])` in `app/routes.ts`

**New Utility Function:**

- Add in `app/utils/<name>.ts`
- Import via `~/utils/<name>`

**Database Script:**

- Add in `scripts/` directory, run with `pnpm run db:seed` integration or via `tsx`

## Special Directories

**`.react-router/types/`:**

- Purpose: Auto-generated TypeScript types for route modules (e.g., `./+types/Dashboard`)
- Generated: Yes — by `pnpm run typecheck` or `react-router typegen`
- Committed: No (gitignored)

**`build/`:**

- Purpose: Production build output (`build/client/`, `build/server/`)
- Generated: Yes — by `pnpm run build`
- Committed: No (gitignored)

**`node_modules/`:**

- Purpose: Dependencies
- Generated: Yes — by `pnpm install`
- Committed: No (gitignored)

**`drizzle/out/`:**

- Purpose: Per-environment Drizzle migration files (`dev/`, `preview/`, `prod/`)
- Generated: Yes — by `pnpm run db:generate`
- Committed: Yes — migration files should be committed

**`.vercel/`:**

- Purpose: Vercel deployment metadata
- Generated: Yes — by Vercel
- Committed: No (gitignored)

---

_Structure analysis: 2026-07-15_
