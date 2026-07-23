# CyberSpace Academy — Agent Guide

## Quick start

```sh
pnpm install
cp example.env .dev.env   # fill in DATABASE_URL, SESSION_SECRET
pnpm run db:push && pnpm run db:seed
pnpm run dev              # http://localhost:5173
```

## Env loading

- `APP_ENV=dev|preview|prod` selects env file: `.dev.env`, `.preview.env`, `.prod.env`
- Default is `dev`. Both `drizzle.config.ts` and `app/.server/env.ts` read `APP_ENV`
- `.env` files are gitignored; never commit secrets

## Developer commands (in order when applicable)

| Command                | Notes                                                                |
| ---------------------- | -------------------------------------------------------------------- |
| `pnpm run typecheck`   | Runs `react-router typegen && tsc` — **must pass before committing** |
| `pnpm run fmt`         | Prettier (tabs, single quotes, no semi, 4-space tab width)           |
| `pnpm run dev`         | Dev server on `:5173`                                                |
| `pnpm run build`       | Outputs `build/client/` + `build/server/`                            |
| `pnpm run start`       | Serve production build                                               |
| `pnpm run db:push`     | Push Drizzle schema to PostgreSQL                                    |
| `pnpm run db:seed`     | Seed DB (runs `scripts/seed.ts` which executes `scripts/seed.sql`)   |
| `pnpm run db:wipe`     | Delete all data                                                      |
| `pnpm run db:generate` | Generate Drizzle migration files                                     |
| `pnpm run db:migrate`  | Run Drizzle migrations                                               |

**There are no test or lint scripts.** Verification = `typecheck` + `fmt`.

## Architecture

```
app/
├── .server/          # Server-only: DB, auth, queries, payments, chat — NEVER imported on client
├── components/       # Shared UI
├── layouts/          # MainLayout, SectionLayout, UnderConstructionLayout
├── middleware/       # auth.ts, admin.ts
├── routes/           # Route loaders/actions/middleware
├── pages/            # Page components (one per route)
├── routes.ts         # Single route manifest
└── root.tsx          # Root layout + error boundary
```

- **Route protection**: Nest routes under `routes/protected.tsx` (authMiddleware) or `routes/admin-protected.tsx` (adminMiddleware)
- **Path alias**: `~/*` → `./app/*`
- **SSR**: enabled in `react-router.config.ts`

## Database

- PostgreSQL, schema `cyberspace` (pgSchema in Drizzle, search_path set in connection pool)
- **Drizzle for schema only** — queries use raw `sql` tagged template + Zod row parsing (never the Drizzle query builder)
- Schema: `app/.server/database/schema.ts`
- Queries: `app/.server/queries/`
- Quick reset: `pnpm run db:wipe && pnpm run db:push && pnpm run db:seed`

## Style conventions

- Tailwind CSS v4 via `@tailwindcss/vite`
- Prettier: tabs, single quotes, no semicolons, 4-space tab width
- TypeScript strict mode with `verbatimModuleSyntax`

## Key packages

| Purpose    | Package                                         |
| ---------- | ----------------------------------------------- |
| Auth       | bcrypt, session cookies                         |
| Payments   | @payos/node, @payos/payos-checkout              |
| AI chat    | OpenRouter API (optional, `OPENROUTER_API_KEY`) |
| DB ORM     | drizzle-orm + pg                                |
| Validation | zod v4, drizzle-zod                             |
| Icons      | lucide-react                                    |
| Animation  | motion                                          |

## CI

Only docs deployment (MkDocs to GitHub Pages). No test/typecheck CI pipeline.
