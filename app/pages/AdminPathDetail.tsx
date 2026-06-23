import { sql } from 'drizzle-orm'
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react'
import {
	data,
	Form,
	Link,
	redirect,
	useLoaderData,
	useNavigation,
} from 'react-router'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import type { Route } from './+types/AdminPathDetail'

export const handle = {
	section: {
		title: 'Edit Learning Path',
		subtitle: 'Manage courses in this path.',
	},
}

const pathSchema = z.object({
	id: z.coerce.number(),
	title: z.string(),
	description: z.string().nullable(),
	thumbnail: z.string().nullable(),
})

const courseInPathSchema = z.object({
	position: z.coerce.number(),
	courseId: z.coerce.number(),
	title: z.string(),
	length: z.coerce.number(),
})

const availableCourseSchema = z.object({
	id: z.coerce.number(),
	title: z.string(),
})

export async function loader({ params, context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (user.role !== 'staff') {
		throw redirect('/')
	}

	const pathId = params.pathId

	const [pathResult, coursesResult, availableResult] = await Promise.all([
		db.execute(
			sql`SELECT id, title, description, thumbnail FROM learning_paths WHERE id = ${pathId}`,
		),
		db.execute(
			sql`
				SELECT pc.position, c.id AS "courseId", c.title, c.length
				FROM path_courses pc
				JOIN courses c ON c.id = pc.course_id
				WHERE pc.path_id = ${pathId}
				ORDER BY pc.position
			`,
		),
		db.execute(
			sql`
				SELECT id, title FROM courses
				WHERE id NOT IN (
					SELECT course_id FROM path_courses WHERE path_id = ${pathId}
				)
				ORDER BY title
			`,
		),
	])

	if (pathResult.rows.length === 0) {
		throw redirect('/admin/paths')
	}

	return {
		path: pathSchema.parse(pathResult.rows[0]),
		courses: z.array(courseInPathSchema).parse(coursesResult.rows),
		availableCourses: z
			.array(availableCourseSchema)
			.parse(availableResult.rows),
	}
}

export async function action({ request, params, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (user.role !== 'staff') {
		throw redirect('/')
	}

	const pathId = Number(params.pathId)
	const form = await request.formData()
	const intent = form.get('intent')

	if (intent === 'add-course') {
		const courseId = Number(form.get('courseId'))
		const maxPosResult = await db.execute(
			sql`SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM path_courses WHERE path_id = ${pathId}`,
		)
		const nextPos = (maxPosResult.rows[0] as { next_pos: number }).next_pos
		await db.execute(
			sql`INSERT INTO path_courses (path_id, course_id, position) VALUES (${pathId}, ${courseId}, ${nextPos})`,
		)
		return data({ success: true, error: null })
	}

	if (intent === 'remove-course') {
		const courseId = Number(form.get('courseId'))
		const removedPos = Number(form.get('position'))
		await db.execute(
			sql`DELETE FROM path_courses WHERE path_id = ${pathId} AND course_id = ${courseId}`,
		)
		await db.execute(
			sql`UPDATE path_courses SET position = position - 1 WHERE path_id = ${pathId} AND position > ${removedPos}`,
		)
		return data({ success: true, error: null })
	}

	if (intent === 'reorder') {
		const courseId = Number(form.get('courseId'))
		const direction = form.get('direction') as string
		const currentPos = Number(form.get('position'))

		const swapPos = direction === 'up' ? currentPos - 1 : currentPos + 1
		if (swapPos < 1) {
			return data({ error: 'Already at the top.' }, { status: 400 })
		}

		const swapResult = await db.execute(
			sql`SELECT course_id FROM path_courses WHERE path_id = ${pathId} AND position = ${swapPos}`,
		)
		if (swapResult.rows.length === 0) {
			return data({ error: 'Already at the bottom.' }, { status: 400 })
		}
		const swapCourseId = (swapResult.rows[0] as { course_id: number })
			.course_id

		await db.execute(
			sql`UPDATE path_courses SET position = ${swapPos} WHERE path_id = ${pathId} AND course_id = ${courseId}`,
		)
		await db.execute(
			sql`UPDATE path_courses SET position = ${currentPos} WHERE path_id = ${pathId} AND course_id = ${swapCourseId}`,
		)
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

export default function AdminPathDetail() {
	const { path, courses, availableCourses } = useLoaderData<typeof loader>()
	const navigation = useNavigation()
	const isSubmitting = navigation.state === 'submitting'

	return (
		<div className="space-y-4 max-w-2xl">
			<div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
				<h2 className="text-sm font-semibold text-white">
					{path.title}
				</h2>
				{path.description ? (
					<p className="mt-1 text-xs text-slate-400">
						{path.description}
					</p>
				) : null}
				<div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
					<span>
						{courses.length} course{courses.length !== 1 ? 's' : ''}
					</span>
					<span>
						{formatDuration(
							courses.reduce((sum, c) => sum + c.length, 0),
						)}{' '}
						total
					</span>
				</div>
			</div>

			{courses.length > 0 ? (
				<div className="overflow-hidden rounded-lg border border-slate-800">
					<table className="w-full text-left text-xs">
						<thead className="bg-slate-800/50 text-[10px] uppercase tracking-widest text-slate-500">
							<tr>
								<th className="px-3 py-2">#</th>
								<th className="px-3 py-2">Course</th>
								<th className="px-3 py-2">Duration</th>
								<th className="px-3 py-2 text-right">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-800">
							{courses.map((course, index) => (
								<tr key={course.courseId}>
									<td className="px-3 py-2 text-slate-500">
										{course.position}
									</td>
									<td className="px-3 py-2 font-medium text-white">
										{course.title}
									</td>
									<td className="px-3 py-2 text-slate-500">
										{formatDuration(course.length)}
									</td>
									<td className="px-3 py-2">
										<div className="flex items-center justify-end gap-1">
											<Form
												method="POST"
												className="inline"
											>
												<input
													type="hidden"
													name="intent"
													value="reorder"
												/>
												<input
													type="hidden"
													name="courseId"
													value={course.courseId}
												/>
												<input
													type="hidden"
													name="position"
													value={course.position}
												/>
												<button
													type="submit"
													name="direction"
													value="up"
													disabled={
														index === 0 ||
														isSubmitting
													}
													className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
												>
													<ArrowUp className="h-3.5 w-3.5" />
												</button>
												<button
													type="submit"
													name="direction"
													value="down"
													disabled={
														index ===
															courses.length -
																1 ||
														isSubmitting
													}
													className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
												>
													<ArrowDown className="h-3.5 w-3.5" />
												</button>
											</Form>
											<Form
												method="POST"
												className="inline"
												onSubmit={(e) => {
													if (
														!window.confirm(
															`Remove "${course.title}" from this path?`,
														)
													) {
														e.preventDefault()
													}
												}}
											>
												<input
													type="hidden"
													name="intent"
													value="remove-course"
												/>
												<input
													type="hidden"
													name="courseId"
													value={course.courseId}
												/>
												<input
													type="hidden"
													name="position"
													value={course.position}
												/>
												<button
													type="submit"
													disabled={isSubmitting}
													className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											</Form>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center">
					<p className="text-xs text-slate-400">
						No courses in this path yet.
					</p>
				</div>
			)}

			{availableCourses.length > 0 ? (
				<Form method="POST" className="flex items-center gap-2">
					<input type="hidden" name="intent" value="add-course" />
					<select
						name="courseId"
						required
						className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-1.5 px-3 text-xs text-white outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
					>
						<option value="">Select a course...</option>
						{availableCourses.map((c) => (
							<option key={c.id} value={c.id}>
								{c.title}
							</option>
						))}
					</select>
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
						Add
					</button>
				</Form>
			) : (
				<p className="text-xs text-slate-500 text-center">
					All courses are already in this path.
				</p>
			)}

			<div className="pt-2">
				<Link
					to="/admin/paths"
					className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
				>
					&larr; Back to paths
				</Link>
			</div>
		</div>
	)
}
