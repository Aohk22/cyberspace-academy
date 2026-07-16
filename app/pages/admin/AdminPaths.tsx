import { sql } from 'drizzle-orm'
import {
	Check,
	CheckCircle2,
	Loader2,
	Pencil,
	Plus,
	Trash2,
	X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
	data,
	Form,
	Link,
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
import { can } from '~/auth/permissions'
import type { Route } from './+types/AdminPaths'

export const handle = {
	section: {
		title: 'Learning Paths',
		subtitle: 'Curate course collections for learners.',
	},
}

const pathRowSchema = z.object({
	id: z.coerce.number(),
	title: z.string(),
	description: z.string().nullable(),
	thumbnail: z.string().nullable(),
	coursesCount: z.coerce.number(),
	totalDuration: z.coerce.number(),
})

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (!can(user, 'admin')) {
		throw redirect('/')
	}

	const result = await db.execute(sql`
		SELECT
			p.id,
			p.title,
			p.description,
			p.thumbnail,
			COUNT(pc.id)::int AS "coursesCount",
			COALESCE(SUM(c.length), 0)::int AS "totalDuration"
		FROM learning_paths p
		LEFT JOIN path_courses pc ON pc.path_id = p.id
		LEFT JOIN courses c ON c.id = pc.course_id
		GROUP BY p.id
		ORDER BY p.title
	`)

	return { paths: z.array(pathRowSchema).parse(result.rows) }
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (!can(user, 'admin')) {
		throw redirect('/')
	}

	const form = await request.formData()
	const intent = form.get('intent')

	if (intent === 'create') {
		const title = (form.get('title') as string)?.trim()
		if (!title) {
			return data({ error: 'Title is required.' }, { status: 400 })
		}
		const description = (form.get('description') as string)?.trim() || null
		const thumbnail = (form.get('thumbnail') as string)?.trim() || null
		await db.execute(
			sql`INSERT INTO learning_paths (title, description, thumbnail) VALUES (${title}, ${description}, ${thumbnail})`,
		)
		return data({ success: true, error: null })
	}

	if (intent === 'update') {
		const id = Number(form.get('id'))
		const title = (form.get('title') as string)?.trim()
		if (!title) {
			return data({ error: 'Title is required.' }, { status: 400 })
		}
		const description = (form.get('description') as string)?.trim() || null
		const thumbnail = (form.get('thumbnail') as string)?.trim() || null
		await db.execute(
			sql`UPDATE learning_paths SET title = ${title}, description = ${description}, thumbnail = ${thumbnail} WHERE id = ${id}`,
		)
		return data({ success: true, error: null })
	}

	if (intent === 'delete') {
		const id = Number(form.get('id'))
		await db.execute(sql`DELETE FROM learning_paths WHERE id = ${id}`)
		return data({ success: true, error: null })
	}

	return data({ error: 'Invalid intent.' }, { status: 400 })
}

function formatDuration(minutes: number) {
	const hrs = Math.floor(minutes / 60)
	const mins = minutes % 60
	if (hrs === 0) return `${mins}m`
	return `${hrs}h ${mins}m`
}

export default function AdminPaths() {
	const { paths } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>() as
		| { error: string; success?: undefined }
		| { success: true; error: null }
		| undefined
	const navigation = useNavigation()
	const isSubmitting = navigation.state === 'submitting'

	const [editingId, setEditingId] = useState<number | null>(null)
	const editFetcher = useFetcher<typeof action>()
	const editData = editFetcher.data as
		| { error: string; success?: undefined }
		| { success: true; error: null }
		| undefined
	const editSubmitting = editFetcher.state === 'submitting'

	useEffect(() => {
		if (editData?.success) {
			setEditingId(null)
		}
	}, [editData])

	return (
		<div className="space-y-4">
			{actionData?.error ? (
				<div className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">
					{actionData.error}
				</div>
			) : null}
			{actionData?.success ? (
				<div className="flex items-center gap-2 rounded-lg border border-deep-green/30 bg-deep-green/10 px-3 py-2 text-xs text-deep-green">
					<CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
					<span>Learning path saved.</span>
				</div>
			) : null}

			<Form
				method="POST"
				className="rounded-lg border border-hairline bg-surface p-4 space-y-3"
			>
				<input type="hidden" name="intent" value="create" />
				<div className="space-y-1">
					<label
						htmlFor="title"
						className="text-xs font-semibold text-body-muted"
					>
						Title
					</label>
					<input
						id="title"
						name="title"
						type="text"
						required
						placeholder="e.g. Security Foundations"
						className="w-full rounded-lg border border-hairline bg-soft-stone py-1.5 px-3 text-xs text-ink placeholder-muted outline-none  focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
					/>
				</div>
				<div className="space-y-1">
					<label
						htmlFor="description"
						className="text-xs font-semibold text-body-muted"
					>
						Description
					</label>
					<input
						id="description"
						name="description"
						type="text"
						placeholder="Optional description"
						className="w-full rounded-lg border border-hairline bg-soft-stone py-1.5 px-3 text-xs text-ink placeholder-muted outline-none  focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
					/>
				</div>
				<div className="space-y-1">
					<label
						htmlFor="thumbnail"
						className="text-xs font-semibold text-body-muted"
					>
						Thumbnail URL
					</label>
					<input
						id="thumbnail"
						name="thumbnail"
						type="text"
						placeholder="Optional image URL"
						className="w-full rounded-lg border border-hairline bg-soft-stone py-1.5 px-3 text-xs text-ink placeholder-muted outline-none  focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
					/>
				</div>
				<button
					type="submit"
					disabled={isSubmitting}
					className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-deep-green px-3 py-1.5 text-xs font-bold text-on-dark hover:brightness-110 disabled:opacity-60"
				>
					{isSubmitting ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Plus className="h-3.5 w-3.5" />
					)}
					Create Path
				</button>
			</Form>

			<div className="overflow-hidden rounded-lg border border-hairline">
				<table className="w-full text-left text-xs">
					<thead className="bg-soft-stone/50 text-[10px] uppercase tracking-widest text-muted">
						<tr>
							<th className="px-3 py-2">Title</th>
							<th className="px-3 py-2">Courses</th>
							<th className="px-3 py-2">Duration</th>
							<th className="px-3 py-2 text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-hairline">
						{paths.map((path) =>
							editingId === path.id ? (
								<tr key={path.id}>
									<td colSpan={4} className="px-3 py-2">
										<editFetcher.Form
											method="POST"
											className="flex flex-wrap items-end gap-3"
										>
											<input
												type="hidden"
												name="intent"
												value="update"
											/>
											<input
												type="hidden"
												name="id"
												value={path.id}
											/>
											<div className="space-y-1">
												<label className="text-[10px] font-semibold text-ink">
													Title
												</label>
												<input
													name="title"
													defaultValue={path.title}
													required
													className="w-44 rounded-lg border border-hairline bg-soft-stone py-1.5 px-2 text-xs text-ink placeholder-muted outline-none  focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-[10px] font-semibold text-ink">
													Description
												</label>
												<input
													name="description"
													defaultValue={
														path.description ?? ''
													}
													className="w-44 rounded-lg border border-hairline bg-soft-stone py-1.5 px-2 text-xs text-ink placeholder-muted outline-none  focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-[10px] font-semibold text-ink">
													Thumbnail URL
												</label>
												<input
													name="thumbnail"
													defaultValue={
														path.thumbnail ?? ''
													}
													className="w-44 rounded-lg border border-hairline bg-soft-stone py-1.5 px-2 text-xs text-ink placeholder-muted outline-none  focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
												/>
											</div>
											<div className="flex items-center gap-1 pb-1">
												<button
													type="submit"
													disabled={editSubmitting}
													className="rounded-lg p-1.5 text-deep-green  hover:bg-deep-green/10 disabled:opacity-50"
													title="Save"
												>
													{editSubmitting ? (
														<Loader2 className="h-3.5 w-3.5 animate-spin" />
													) : (
														<Check className="h-3.5 w-3.5" />
													)}
												</button>
												<button
													type="button"
													onClick={() =>
														setEditingId(null)
													}
													className="rounded-lg p-1.5 text-muted  hover:bg-hairline/20 hover:text-body-muted"
													title="Cancel"
												>
													<X className="h-3.5 w-3.5" />
												</button>
											</div>
											{editData?.error ? (
												<span className="w-full text-[10px] text-rose">
													{editData.error}
												</span>
											) : null}
										</editFetcher.Form>
									</td>
								</tr>
							) : (
								<tr key={path.id}>
									<td className="px-3 py-2">
										<Link
											to={`/admin/paths/${path.id}`}
											className="font-medium text-ink hover:text-deep-green "
										>
											{path.title}
										</Link>
										{path.description ? (
											<p className="text-[10px] text-muted mt-0.5 leading-tight">
												{path.description}
											</p>
										) : null}
									</td>
									<td className="px-3 py-2 text-muted">
										{path.coursesCount}
									</td>
									<td className="px-3 py-2 text-muted">
										{formatDuration(path.totalDuration)}
									</td>
									<td className="px-3 py-2">
										<div className="flex items-center justify-end gap-1">
											<button
												type="button"
												onClick={() =>
													setEditingId(path.id)
												}
												className="rounded-lg p-1.5 text-muted  hover:bg-hairline/20 hover:text-body-muted"
												title="Edit"
											>
												<Pencil className="h-3.5 w-3.5" />
											</button>
											<Form
												method="POST"
												onSubmit={(e) => {
													if (
														!window.confirm(
															`Delete path "${path.title}"?`,
														)
													) {
														e.preventDefault()
													}
												}}
											>
												<input
													type="hidden"
													name="intent"
													value="delete"
												/>
												<input
													type="hidden"
													name="id"
													value={path.id}
												/>
												<button
													type="submit"
													className="rounded-lg p-1.5 text-muted  hover:bg-error/10 hover:text-error"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											</Form>
										</div>
									</td>
								</tr>
							),
						)}
						{paths.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="px-3 py-6 text-center text-muted"
								>
									No learning paths yet.
								</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
		</div>
	)
}
