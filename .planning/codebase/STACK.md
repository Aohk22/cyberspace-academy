# Technology Stack

**Analysis Date:** 2026-07-15

## Languages

**Primary:**
- TypeScript 5.9 - All application code (server and client)
- SQL (PostgreSQL dialect) - Raw queries via Drizzle ORM tagged templates, and seed/wipe scripts in `scripts/`

**Secondary:**
- CSS (Tailwind v4) - Styling via `@tailwindcss/vite` with custom theme tokens in `app/theme.css`
- YAML - CI workflow (`docs.yml`), MkDocs config (`mkdocs.yml`), pnpm workspace config
- SQL (PL/pgSQL) - Trigger functions in seed script (`scripts/seed.ts`)

## Runtime

**Environment:**
- Node.js 25 (detected: v25.2.1) — no `.nvmrc` / `.node-version` file committed

**Package Manager:**
- pnpm 10.25
- Lockfile: `pnpm-lock.yaml` present, fully deterministic
- Workspace: single project (`pnpm-workspace.yaml` only lists allowed built deps: bcrypt, esbuild, supabase)

## Frameworks

**Core:**
- React Router v7.12.0 — Full-stack framework with SSR, middleware, file-based routing, and typegen
- React 19.2.4 — UI library with server components (via React Router)

**Testing:**
- Not detected — no test runner or assertion library in dependencies. Verification is limited to `tsc` typecheck.

**Build/Dev:**
- Vite 7.1 — Bundler and dev server
- Tailwind CSS v4.1 — Utility-first CSS via `@tailwindcss/vite` plugin
- TypeScript 5.9 — Type checking (`tsc --noEmit`)
- tsx 4.21 — Script runner for DB scripts (`db:seed`, `db:wipe`)
- Prettier 3.8 — Code formatter (tabs, single quotes, no semicolons, 4-space tab width)
- React Router CLI — `react-router dev`, `react-router build`, `react-router typegen`

## Key Dependencies

**Critical:**
- `react-router` / `@react-router/node` / `@react-router/serve` / `@react-router/dev` v7.12 — Core framework; SSR, routing, middleware, server-side rendering
- `drizzle-orm` 0.45 + `drizzle-kit` 0.30 — ORM for schema definition and migrations; queries use raw `sql` tagged templates, not the query builder
- `zod` v4 + `drizzle-zod` 0.8 — Validation (Zod v4) and schema-derived Zod types (`createSelectSchema`)
- `pg` 8.20 — PostgreSQL client (`Pool` with connection string); schema set to `cyberspace` via `search_path`

**Authentication:**
- `bcrypt` 6.0 — Password hashing (saltRounds=10)

**Payments:**
- `@payos/node` 2.0 — Server-side PayOS payment gateway SDK (create payment links, verify webhooks)
- `@payos/payos-checkout` 1.0 — Client-side PayOS checkout UI (listed as dependency but unused in app code)

**AI/LLM:**
- No SDK — Direct `fetch` to OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`)

**UI:**
- `lucide-react` 0.577 — Icon component library
- `motion` 12.36 — Animation library (Framer Motion successor; used in `CheckoutModal.tsx`)
- `isbot` 5.31 — Bot detection for SSR (request categorization)
- Google Fonts: Inter + Space Grotesk (loaded via `root.tsx`)

**Infrastructure:**
- `dotenv` 17.3 — Environment file loading for dev/preview/prod
- `vite-tsconfig-paths` 5.1 — Path alias `~/*` → `./app/*`
- `supabase` 2.106 — Supabase CLI (devDependency, for local Supabase edge-functions development only; not used in application code)

## Configuration

**Environment:**
- `APP_ENV` selects env file: `.dev.env`, `.preview.env`, `.prod.env`
- Env files are gitignored (`.gitignore` has `*.env*`)
- Required vars: `DATABASE_URL`, `SESSION_SECRET`
- Optional vars: `OPENROUTER_API_KEY`, `APP_URL`, `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`

**Build:**
- `tsconfig.json` — strict mode, `verbatimModuleSyntax`, path alias `~/*` → `./app/*`
- `vite.config.ts` — plugins: `@tailwindcss/vite`, `reactRouter()`, `vite-tsconfig-paths`
- `react-router.config.ts` — SSR enabled, v8_middleware future flag
- `drizzle.config.ts` — PostgreSQL dialect, schema `cyberspace` (schemaFilter), outputs to `drizzle/out/{env}`

## Platform Requirements

**Development:**
- Node.js ≥18 (ES2022 target)
- PostgreSQL database (any host)
- pnpm package manager

**Production:**
- Vercel (deployment target declared in `vercel.json`: `{"framework": "react-router"}`)
- Node.js runtime via `@react-router/serve`

---

*Stack analysis: 2026-07-15*
