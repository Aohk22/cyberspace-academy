# Coding Conventions

**Analysis Date:** 2026-07-15

## Naming Patterns

**Files:**
- React components: PascalCase, e.g. `StatCard.tsx`, `AiTutor.tsx`, `PricingModal.tsx`
- Route files: kebab-case for API routes (`api.chat.ts`), PascalCase for route layout wrappers (`splat-redirect.tsx`)
- Server queries: kebab-case, e.g. `course-detail.ts`, `learning-paths.ts`
- Utility files: kebab-case, e.g. `format-course-length.ts`
- Hooks files: kebab-case, e.g. `my-hooks.tsx`
- Icons: PascalCase per component, e.g. `ChromeIcon.tsx`, `GithubIcon.tsx`
- Fallback components: PascalCase with `Fallback` suffix, e.g. `RecommendedCourseFallback.tsx`, `ContinueLearningFallback.tsx`
- Admin pages: PascalCase with `Admin` prefix, e.g. `AdminDashboard.tsx`, `AdminUsers.tsx`

**Functions:**
- Components: `export default function ComponentName` (PascalCase)
- Loaders/Actions: `export async function loader` / `export async function action` (lowercase, named)
- Server queries: camelCase, e.g. `getDashboardData`, `getCourseDetailData`, `getLessonPageData`
- Utilities: camelCase, e.g. `formatCourseLength`, `formatLessonLength`
- Hooks: camelCase with `use` prefix, e.g. `usePrefersDark`, `useTheme`
- Event handlers: camelCase, e.g. `sendMessage`, `handleKeyDown`, `handleClose`, `handleSubmit`
- Helper functions within components: camelCase, e.g. `reset`, `toggleTheme`
- Middleware: camelCase, e.g. `authMiddleware`, `adminMiddleware`

**Variables:**
- `const` preferred over `let` — use `let` only for reassignment
- camelCase for local variables: `const formData`, `const userId`, `const session`
- `const` for constants in UPPER_SNAKE_CASE: `PLAN_PRICES`, `ENV_FILES`, `USER_ROLES`
- Destructuring preferred: `const { user } = useLoaderData()`

**Types:**
- Interfaces: PascalCase with `Props` suffix for component props, e.g. `PricingModalProps`, `AiTutorProps`, `CheckoutModalProps`
- Types: PascalCase, e.g. `Message`, `NavItem`, `Plan`, `DashboardData`
- Zod schema types: PascalCase derived from `z.infer<typeof schema>`, e.g. `DashboardData`, `LearningPathWithCount`
- Database inferred types: PascalCase from `typeof schema.$inferSelect`, e.g. `User`, `Course`, `Lesson`
- Internal type aliases in route files: PascalCase, e.g. `NavItem`, `SectionValue`, `SectionHandle`

## Code Style

**Formatting:**
- Prettier (v3.8.1) configured in `.prettierrc`
- Tabs for indentation (`useTabs: true`)
- 4-space tab width (`tabWidth: 4`)
- Single quotes (`singleQuote: true`)
- No semicolons (`semi: false`)
- Prettier ignore: `build/`, `coverage/` in `.prettierignore`

**Linting:**
- No ESLint or Biome detected — no linter configured
- No lint script in `package.json`
- Quality verification relies solely on `typecheck` (React Router typegen + tsc)

**TypeScript:**
- Strict mode enabled in `tsconfig.json` (`"strict": true`)
- `verbatimModuleSyntax: true` — requires `type` keyword for type-only imports
- `noEmit: true` — TypeScript is used only for type checking, not compilation
- Target: `ES2022`, Module: `ES2022`, ModuleResolution: `bundler`
- Path alias: `"~/*"` maps to `"./app/*"`

**React:**
- JSX: `react-jsx` transform (automatic runtime, no `import React` needed for JSX)
- Inline `className` with Tailwind CSS v4 utility classes
- Template literals for dynamic class concatenation using `${}`
- `className` values spanning multiple lines use string concatenation with `\n\t\t` indentation pattern

**CSS:**
- Tailwind CSS v4 via `@tailwindcss/vite` plugin
- Global theme CSS imported in `app/root.tsx` from `~/theme.css`
- No CSS modules or CSS-in-JS detected

## Import Organization

**Order:**
1. External libraries first: `react`, `react-router`, `lucide-react`, `motion`, `zod`, `drizzle-orm`
2. `~/.server/*` server-only imports (DB, auth, queries, payment)
3. `~/` app-level imports (context, error, hooks, components, utils)
4. Type-only imports with `import type` syntax (required by `verbatimModuleSyntax`)

**Path Aliases:**
- `~/*` → `./app/*` (configured in `tsconfig.json` paths and `vite-tsconfig-paths`)
- Examples: `~/context`, `~/error`, `~/components/StatCard`, `~/theme-context`
- Relative imports used within the same directory level (e.g., `'./+types/Dashboard'`)

**React imports:**
- Named imports from `'react'`: `{ useState, useEffect, Suspense, lazy, use, useRef, useDeferredValue }`
- `import React from 'react'` used in some files only when `ReactNode` or `React.Suspense` referenced
- Type-only React imports: `import type { ReactNode } from 'react'`

## Error Handling

**Patterns:**
- Custom error classes: `NoUserContextError` in `app/error.ts`
```
export class NoUserContextError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'NoUserContextError'
	}
}
```
- React Router's `isRouteErrorResponse` for HTTP errors in root error boundary
- Throw `redirect()` for auth failures: `throw redirect('/login')`
- Throw `NoUserContextError` when user context is unexpectedly null
- Action functions return `{ error: string }` objects for form-level errors
- Server queries use `z.safeParse` for graceful parse failures (returns `null` instead of throwing)
- Catch blocks in async functions log errors and return user-friendly messages
- Auth middleware uses `throw redirect(...)` with `Set-Cookie` header for session cleanup

**Route-level Error Responses:**
- `Response.json({ error: 'Unauthorized' }, { status: 401 })` for API route auth failures
- `Response.json({ error: 'Invalid plan' }, { status: 400 })` for validation failures
- `Response.json({ error: 'Unknown intent' }, { status: 400 })` for unrecognized actions

**Error Boundary:**
- `root.tsx` exports an `ErrorBoundary` function component
- Shows 404 page, error status text, or stack trace in dev mode
- Uses `import.meta.env.DEV` to conditionally show stack traces

## Logging

**Framework:** No logging library — uses `console.log`, `console.error`

**Patterns:**
- `console.log` for seed progress: `console.log('🌱 Seeding database...')`
- `console.log` for debug output: `console.log(res)` in `dashboard.ts`
- `console.error` for connection errors: `console.error('Failed to set search_path...', err)`
- `console.error` for unexpected pool errors
- `console.error` for webhook verification failures
- No structured logging, no log levels

**Seed script logging:**
- Emoji-prefixed status messages: `'🌱 Seeding database...'`, `'✅ Trigger ready'`, `'❌ Seed failed:'`, `'🎉 Seeding complete!'`

## Comments

**When to Comment:**
- Sparse — only used for marking TODOs and section headers
- JSX comments `{/* ... */}` for section labeling in complex components
- Code comments for explaining business logic (e.g., "Retry on order code collision")
- No JSDoc/TSDoc detected anywhere in the codebase

**TODOs:**
- 2 TODOs found in source code:
  - `app/pages/Login.tsx:110`: `{/* TODO: Check styling for password reset */}`
  - `app/routes/payment.ts:10`: `// TODO: set VND prices`

## Function Design

**Size:** No enforced limits. Query functions range from 5 lines (`formatLessonLength`) to 200+ lines (`seed.ts`). Component functions range from 6 lines (`GithubIcon`) to 289 lines (`Login.tsx`).

**Parameters:**
- Component props defined as inline type or `interface` named `{ComponentName}Props`
- Server query functions accept single args or destructured objects
- Destructured route args pattern: `{ request, context, params }`

**Return Values:**
- Components return JSX
- `loader` functions return data objects: `return { courses: getDashboardData(user.id) }`
- `action` functions return `{ error: string }` or `redirect()` or `Response.json()`
- Query utilities return typed arrays or `null` for not-found

## Module Design

**Exports:**
- Components: `export default function ComponentName`
- Server utilities: named exports `export async function getFoo`
- Hooks: named exports `export function useHookName`
- Types: named exports `export type Foo`
- Constants: named exports `export const FOO`
- Session utilities: named exports from barrel: `export { getSession, commitSession, destroySession }`

**Barrel Files:**
- `app/.server/database/types.ts` serves as a barrel for all DB type definitions and Zod schemas
- `app/types.ts` minimal — single type export: `export type Role = 'student' | 'staff'`
- `app/context.ts` exports the `UserContext` type and `userContext` context object
- `app/error.ts` exports the `NoUserUserContextError` class

## Component Patterns

**Component Structure:**
```tsx
// Props defined as interface above component
interface ComponentNameProps {
	propName: Type
}

export default function ComponentName({ prop1, prop2 }: ComponentNameProps) {
	// Hooks at top
	const [state, setState] = useState(initial)

	// Effects

	// Handlers defined as inner functions

	// Return JSX
	return (
		<div>
			{content}
		</div>
	)
}
```

**Route Pages Pattern:**
```tsx
import type { Route } from './+types/PageName'

export async function loader({ context }: Route.LoaderArgs) {
	// fetch data
	return { data }
}

export async function action({ request, context }: Route.ActionArgs) {
	// handle form submission
	return { error } | redirect()
}

export default function PageName({ loaderData, actionData }: Route.ComponentProps) {
	// render
}
```

**Server Query Pattern:**
```tsx
import { sql } from 'drizzle-orm'
import { db } from '../database/connection'
import { z } from 'zod'

const mySchema = z.object({ ... })

export type MyData = z.infer<typeof mySchema>

export async function getMyData(userId: number): Promise<MyData[]> {
	const res = await db.execute(sql`SELECT ...`)
	return z.array(mySchema).parse(res.rows)
}
```

---

*Convention analysis: 2026-07-15*
