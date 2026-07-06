import { sql } from 'drizzle-orm'
import { Loader2, Plus, Search, Trash2, UserPen, X } from 'lucide-react'
import {
	data,
	Form,
	Link,
	redirect,
	useFetcher,
	useLoaderData,
	useSearchParams,
} from 'react-router'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import type { Route } from './+types/AdminUsers'

export const handle = {
	section: {
		title: 'Users',
		subtitle: 'Manage learner and staff accounts.',
	},
}

const userRowSchema = z.object({
	id: z.coerce.number(),
	name: z.string(),
	email: z.string(),
	role: z.string(),
})

export async function loader({ request, context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (user.role !== 'staff') {
		throw redirect('/')
	}

	const url = new URL(request.url)
	const search = url.searchParams.get('search') || ''
	const roleFilter = url.searchParams.get('role') || ''

	let query = sql`SELECT id, name, email, role FROM users WHERE 1=1`
	const params: (string | number)[] = []

	if (search) {
		query = sql`${query} AND (name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'})`
	}
	if (roleFilter === 'learner' || roleFilter === 'staff') {
		query = sql`${query} AND role = ${roleFilter}`
	}

	query = sql`${query} ORDER BY id DESC`

	const result = await db.execute(query)
	const users = z.array(userRowSchema).parse(result.rows)

	const countResult = await db.execute(sql`
		SELECT COUNT(*)::int AS count FROM users
	`)
	const total = (countResult.rows[0] as { count: number }).count

	return { users, total, search, roleFilter }
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (user.role !== 'staff') {
		throw redirect('/')
	}

	const form = await request.formData()
	const intent = form.get('intent')

	if (intent === 'delete-user') {
		const userId = Number(form.get('userId'))
		await db.execute(sql`DELETE FROM users WHERE id = ${userId}`)
	}

	return null
}

export default function AdminUsers() {
	const { users, total, search, roleFilter } = useLoaderData<typeof loader>()
	const fetcher = useFetcher()
	const [searchParams, setSearchParams] = useSearchParams()
	const isDeleting = fetcher.state === 'submitting'

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<p className="text-xs text-foreground-text-muted">
					{total} total user{total !== 1 ? 's' : ''}
				</p>
				<Link
					to="/users/new"
					className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg border border-foreground-active bg-foreground-elevated px-3 py-2 text-xs font-semibold text-background-text  hover:bg-foreground-active"
				>
					<Plus className="h-3.5 w-3.5" />
					New User
				</Link>
			</div>

			<Form method="GET" className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-text-muted" />
					<input
						type="text"
						name="search"
						defaultValue={search}
						placeholder="Search by name or email..."
						className="w-full rounded-lg border border-foreground-active bg-foreground-elevated py-1.5 pl-9 pr-3 text-xs text-foreground-text placeholder-foreground-text-muted outline-none  focus:border-primary focus:ring-2 focus:ring-primary/20"
					/>
				</div>
				<select
					name="role"
					defaultValue={roleFilter}
					className="rounded-lg border border-foreground-active bg-foreground-elevated py-1.5 px-3 text-xs text-foreground-text outline-none  focus:border-primary focus:ring-2 focus:ring-primary/20"
				>
					<option value="">All roles</option>
					<option value="learner">Learner</option>
					<option value="staff">Staff</option>
				</select>
				<button
					type="submit"
					className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-foreground-text  hover:bg-primary"
				>
					Search
				</button>
				{search || roleFilter ? (
					<Link
						to="/admin/users"
						className="flex items-center gap-1 rounded-lg border border-foreground-active px-3 py-1.5 text-xs text-foreground-text hover:text-foreground-text-secondary"
					>
						<X className="h-3 w-3" />
						Clear
					</Link>
				) : null}
			</Form>

			<div className="overflow-hidden rounded-lg border border-foreground-elevated">
				<table className="w-full text-left text-xs">
					<thead className="bg-foreground-elevated/50 text-[10px] uppercase tracking-widest text-foreground-text-muted">
						<tr>
							<th className="px-3 py-2">Name</th>
							<th className="px-3 py-2">Email</th>
							<th className="px-3 py-2">Role</th>
							<th className="px-3 py-2 text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-foreground-elevated">
						{users.map((u) => (
							<tr key={u.id}>
								<td className="px-3 py-2 font-medium text-foreground-text">
									{u.name}
								</td>
								<td className="px-3 py-2 text-foreground-text">
									{u.email}
								</td>
								<td className="px-3 py-2">
									<span
										className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${u.role === 'staff'
											? 'bg-primary/10 text-primary'
											: 'bg-foreground-active text-foreground-text-secondary'
											}`}
									>
										{u.role}
									</span>
								</td>
								<td className="px-3 py-2">
									<div className="flex items-center justify-end gap-1">
										<Link
											to={`/admin/users/${u.id}/edit`}
											className="rounded-lg p-1.5 text-foreground-text-muted  hover:bg-foreground-elevated hover:text-foreground-text-secondary"
										>
											<UserPen className="h-3.5 w-3.5" />
										</Link>
										<fetcher.Form
											method="POST"
											className="inline"
											onSubmit={(e) => {
												if (
													!window.confirm(
														`Delete user "${u.name}"? This will also remove their enrollments and progress.`,
													)
												) {
													e.preventDefault()
												}
											}}
										>
											<input
												type="hidden"
												name="intent"
												value="delete-user"
											/>
											<input
												type="hidden"
												name="userId"
												value={u.id}
											/>
											<button
												type="submit"
												disabled={isDeleting}
												className="rounded-lg p-1.5 text-foreground-text-muted  hover:bg-error/10 hover:text-error disabled:opacity-50"
											>
												{isDeleting ? (
													<Loader2 className="h-3.5 w-3.5 animate-spin" />
												) : (
													<Trash2 className="h-3.5 w-3.5" />
												)}
											</button>
										</fetcher.Form>
									</div>
								</td>
							</tr>
						))}
						{users.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="px-3 py-6 text-center text-foreground-text-muted"
								>
									No users found.
								</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
		</div>
	)
}
