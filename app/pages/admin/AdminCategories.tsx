import { sql } from 'drizzle-orm'
import { CheckCircle2, Loader2, Plus, Trash2, X } from 'lucide-react'
import {
	data,
	Form,
	redirect,
	useActionData,
	useFetcher,
	useLoaderData,
	useNavigation,
} from 'react-router'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import type { Route } from './+types/AdminCategories'

export const handle = {
	section: {
		title: 'Categories',
		subtitle: 'Organize courses by topic.',
	},
}

const categoryRowSchema = z.object({
	id: z.coerce.number(),
	name: z.string(),
	courseCount: z.coerce.number(),
})

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (user.role !== 'staff') {
		throw redirect('/')
	}

	const result = await db.execute(sql`
		SELECT c.id, c.name, COUNT(co.id)::int AS "courseCount"
		FROM categories c
		LEFT JOIN courses co ON co.category_id = c.id
		GROUP BY c.id
		ORDER BY c.name
	`)

	return { categories: z.array(categoryRowSchema).parse(result.rows) }
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

	if (intent === 'create') {
		const name = (form.get('name') as string)?.trim()
		if (!name) {
			return data({ error: 'Name is required.' }, { status: 400 })
		}
		try {
			await db.execute(
				sql`INSERT INTO categories (name) VALUES (${name})`,
			)
		} catch {
			return data(
				{ error: 'A category with this name already exists.' },
				{ status: 409 },
			)
		}
		return data({ success: true, error: null })
	}

	if (intent === 'update') {
		const id = Number(form.get('id'))
		const name = (form.get('name') as string)?.trim()
		if (!name) {
			return data({ error: 'Name is required.' }, { status: 400 })
		}
		try {
			await db.execute(
				sql`UPDATE categories SET name = ${name} WHERE id = ${id}`,
			)
		} catch {
			return data(
				{ error: 'A category with this name already exists.' },
				{ status: 409 },
			)
		}
		return data({ success: true, error: null })
	}

	if (intent === 'delete') {
		const id = Number(form.get('id'))
		await db.execute(sql`DELETE FROM categories WHERE id = ${id}`)
		return data({ success: true, error: null })
	}

	return data({ error: 'Invalid intent.' }, { status: 400 })
}

export default function AdminCategories() {
	const { categories } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>() as
		| { error: string; success?: undefined }
		| { success: true; error: null }
		| undefined
	const navigation = useNavigation()
	const isSubmitting = navigation.state === 'submitting'
	const deleteFetcher = useFetcher()

	return (
		<div className="space-y-4 max-w-lg">
			{actionData?.error ? (
				<div className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">
					{actionData.error}
				</div>
			) : null}
			{actionData?.success ? (
				<div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
					<CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
					<span>Category saved.</span>
				</div>
			) : null}

			<Form method="POST" className="flex items-center gap-2">
				<input type="hidden" name="intent" value="create" />
				<input
					type="text"
					name="name"
					required
					placeholder="New category name"
					className="flex-1 rounded-lg border border-foreground-active bg-foreground-elevated py-1.5 px-3 text-xs text-foreground-text placeholder-foreground-text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
				/>
				<button
					type="submit"
					disabled={isSubmitting}
					className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-foreground-text transition-colors hover:bg-primary disabled:opacity-60"
				>
					{isSubmitting ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Plus className="h-3.5 w-3.5" />
					)}
					Add
				</button>
			</Form>

			<div className="overflow-hidden rounded-lg border border-foreground-elevated">
				<table className="w-full text-left text-xs">
					<thead className="bg-foreground-elevated/50 text-[10px] uppercase tracking-widest text-foreground-text-muted">
						<tr>
							<th className="px-3 py-2">Name</th>
							<th className="px-3 py-2">Courses</th>
							<th className="px-3 py-2 text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-foreground-elevated">
						{categories.map((cat) => (
							<tr key={cat.id}>
								<td className="px-3 py-2 font-medium text-foreground-text">
									{cat.name}
								</td>
								<td className="px-3 py-2 text-foreground-text-muted">
									{cat.courseCount}
								</td>
								<td className="px-3 py-2">
									<div className="flex items-center justify-end gap-1">
										<deleteFetcher.Form method="POST">
											<input
												type="hidden"
												name="intent"
												value="delete"
											/>
											<input
												type="hidden"
												name="id"
												value={cat.id}
											/>
											<button
												type="submit"
												disabled={
													deleteFetcher.state ===
													'submitting'
												}
												onClick={(e) => {
													if (cat.courseCount > 0) {
														if (
															!window.confirm(
																`Delete "${cat.name}"? ${cat.courseCount} course(s) will lose their category.`,
															)
														) {
															e.preventDefault()
														}
													}
												}}
												className="rounded-lg p-1.5 text-foreground-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</deleteFetcher.Form>
									</div>
								</td>
							</tr>
						))}
						{categories.length === 0 ? (
							<tr>
								<td
									colSpan={3}
									className="px-3 py-6 text-center text-foreground-text-muted"
								>
									No categories yet.
								</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
		</div>
	)
}
