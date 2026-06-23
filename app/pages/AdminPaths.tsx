import { sql } from 'drizzle-orm'
import { CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'
import {
	data,
	Form,
	Link,
	redirect,
	useActionData,
	useLoaderData,
	useNavigation,
} from 'react-router'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
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
	coursesCount: z.coerce.number(),
	totalDuration: z.coerce.number(),
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
		SELECT
			p.id,
			p.title,
			p.description,
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
	if (user.role !== 'staff') {
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

	return (
		<div className="space-y-4">
			{actionData?.error ? (
				<div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
					{actionData.error}
				</div>
			) : null}
			{actionData?.success ? (
				<div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
					<CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
					<span>Learning path saved.</span>
				</div>
			) : null}

			<Form
				method="POST"
				className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3"
			>
				<input type="hidden" name="intent" value="create" />
				<div className="space-y-1">
					<label
						htmlFor="title"
						className="text-xs font-semibold text-slate-300"
					>
						Title
					</label>
					<input
						id="title"
						name="title"
						type="text"
						required
						placeholder="e.g. Security Foundations"
						className="w-full rounded-lg border border-slate-700 bg-slate-800 py-1.5 px-3 text-xs text-white placeholder-slate-500 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
					/>
				</div>
				<div className="space-y-1">
					<label
						htmlFor="description"
						className="text-xs font-semibold text-slate-300"
					>
						Description
					</label>
					<input
						id="description"
						name="description"
						type="text"
						placeholder="Optional description"
						className="w-full rounded-lg border border-slate-700 bg-slate-800 py-1.5 px-3 text-xs text-white placeholder-slate-500 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
					/>
				</div>
				<div className="space-y-1">
					<label
						htmlFor="thumbnail"
						className="text-xs font-semibold text-slate-300"
					>
						Thumbnail URL
					</label>
					<input
						id="thumbnail"
						name="thumbnail"
						type="text"
						placeholder="Optional image URL"
						className="w-full rounded-lg border border-slate-700 bg-slate-800 py-1.5 px-3 text-xs text-white placeholder-slate-500 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
					/>
				</div>
				<button
					type="submit"
					disabled={isSubmitting}
					className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
				>
					{isSubmitting ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Plus className="h-3.5 w-3.5" />
					)}
					Create Path
				</button>
			</Form>

			<div className="overflow-hidden rounded-lg border border-slate-800">
				<table className="w-full text-left text-xs">
					<thead className="bg-slate-800/50 text-[10px] uppercase tracking-widest text-slate-500">
						<tr>
							<th className="px-3 py-2">Title</th>
							<th className="px-3 py-2">Courses</th>
							<th className="px-3 py-2">Duration</th>
							<th className="px-3 py-2 text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-800">
						{paths.map((path) => (
							<tr key={path.id}>
								<td className="px-3 py-2">
									<Link
										to={`/admin/paths/${path.id}`}
										className="font-medium text-white hover:text-emerald-400 transition-colors"
									>
										{path.title}
									</Link>
								</td>
								<td className="px-3 py-2 text-slate-500">
									{path.coursesCount}
								</td>
								<td className="px-3 py-2 text-slate-500">
									{formatDuration(path.totalDuration)}
								</td>
								<td className="px-3 py-2">
									<div className="flex items-center justify-end gap-1">
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
												className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</Form>
									</div>
								</td>
							</tr>
						))}
						{paths.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="px-3 py-6 text-center text-slate-500"
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
