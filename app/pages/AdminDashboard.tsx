import { sql } from 'drizzle-orm'
import { BookMarked, CheckCircle2, GraduationCap, Users } from 'lucide-react'
import { Link, redirect, useLoaderData, useSearchParams } from 'react-router'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import type { Route } from './+types/AdminDashboard'

export const handle = {
	section: {
		title: 'Admin Panel',
		subtitle: 'Platform overview and management.',
	},
}

const adminMetricsSchema = z.object({
	totalUsers: z.coerce.number(),
	totalCourses: z.coerce.number(),
	totalEnrollments: z.coerce.number(),
})

const userRowSchema = z.object({
	id: z.coerce.number(),
	name: z.string(),
	email: z.string(),
	role: z.string(),
})

const userOptionSchema = z.object({
	id: z.coerce.number(),
	name: z.string(),
})

const userCompletionSchema = z.object({
	courseId: z.coerce.number(),
	title: z.string(),
	completedLessons: z.coerce.number(),
	totalLessons: z.coerce.number(),
	completionRate: z.coerce.number(),
})

function formatPercent(value: number) {
	return `${Math.round(value)}%`
}

function compactNumber(value: number) {
	return new Intl.NumberFormat('en', {
		notation: 'compact',
		maximumFractionDigits: 1,
	}).format(value)
}

function MetricCard({
	label,
	value,
	icon: Icon,
	tone,
	meta,
}: {
	label: string
	value: string
	icon: typeof Users
	tone: string
	meta: string
}) {
	return (
		<div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
			<div
				className={`flex h-6 w-6 items-center justify-center rounded-md ${tone}`}
			>
				<Icon className="h-3.5 w-3.5" />
			</div>
			<p className="mt-1.5 text-[11px] font-medium text-slate-400">
				{label}
			</p>
			<p className="mt-0.5 text-base font-bold text-white">{value}</p>
			<p className="mt-0.5 text-[10px] text-slate-500">{meta}</p>
		</div>
	)
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}

	if (user.role !== 'staff') {
		throw redirect('/')
	}

	const url = new URL(request.url)
	const created = url.searchParams.get('created')
	const selectedUserId = url.searchParams.get('userId')

	const [metricsResult, usersResult, allUsersResult] = await Promise.all([
		db.execute(sql`
			SELECT
				(SELECT COUNT(*) FROM users)::int AS "totalUsers",
				(SELECT COUNT(*) FROM courses)::int AS "totalCourses",
				(SELECT COUNT(*) FROM users_to_courses)::int AS "totalEnrollments"
		`),
		db.execute(sql`
			SELECT id, name, email, role
			FROM users
			ORDER BY id DESC
			LIMIT 5
		`),
		db.execute(sql`
			SELECT id, name FROM users ORDER BY name
		`),
	])

	let userCompletions: z.infer<typeof userCompletionSchema>[] = []
	let selectedUserName = ''

	if (selectedUserId) {
		const [completionResult, nameResult] = await Promise.all([
			db.execute(sql`
				SELECT
					c.id AS "courseId",
					c.title,
					COUNT(utl.lesson_id)::int AS "totalLessons",
					COUNT(CASE WHEN utl.completed = true THEN 1 END)::int AS "completedLessons",
					CASE
						WHEN COUNT(utl.lesson_id) = 0 THEN 0
						ELSE ROUND(
							COUNT(CASE WHEN utl.completed = true THEN 1 END)::numeric
							/ COUNT(utl.lesson_id)::numeric
							* 100
						)
					END AS "completionRate"
				FROM courses c
				JOIN users_to_courses utc ON utc.course_id = c.id AND utc.user_id = ${selectedUserId}
				JOIN modules m ON m.course_id = c.id
				JOIN lessons l ON l.module_id = m.id
				JOIN users_to_lessons utl ON utl.lesson_id = l.id AND utl.user_id = utc.user_id
				GROUP BY c.id
				ORDER BY c.title
			`),
			db.execute(
				sql`SELECT name FROM users WHERE id = ${selectedUserId}`,
			),
		])
		userCompletions = z
			.array(userCompletionSchema)
			.parse(completionResult.rows)
		if (nameResult.rows.length > 0) {
			selectedUserName = (nameResult.rows[0] as { name: string }).name
		}
	}

	return {
		metrics: adminMetricsSchema.parse(metricsResult.rows[0]),
		recentUsers: z.array(userRowSchema).parse(usersResult.rows),
		allUsers: z.array(userOptionSchema).parse(allUsersResult.rows),
		userCompletions,
		selectedUserId: selectedUserId || '',
		selectedUserName,
		created: created === 'user',
	}
}

export default function AdminDashboard() {
	const {
		metrics,
		recentUsers,
		allUsers,
		userCompletions,
		selectedUserId,
		selectedUserName,
		created,
	} = useLoaderData<typeof loader>()
	const [searchParams, setSearchParams] = useSearchParams()

	return (
		<div className="space-y-6">
			{created ? (
				<div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
					<CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
					<span>User created successfully.</span>
				</div>
			) : null}

			<section className="grid grid-cols-1 gap-3 md:grid-cols-3">
				<MetricCard
					label="Learners"
					value={compactNumber(metrics.totalUsers)}
					icon={Users}
					tone="bg-purple-400/10 text-purple-400"
					meta={`${metrics.totalEnrollments} enrollments`}
				/>
				<MetricCard
					label="Courses"
					value={String(metrics.totalCourses)}
					icon={BookMarked}
					tone="bg-blue-400/10 text-blue-400"
					meta="Total courses in platform"
				/>
				<MetricCard
					label="Tracked Lessons"
					value={compactNumber(metrics.totalEnrollments)}
					icon={GraduationCap}
					tone="bg-amber-400/10 text-amber-400"
					meta="Across all enrollments"
				/>
			</section>

			<section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
				<div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
					<div className="mb-3 flex items-center justify-between gap-4">
						<h2 className="text-sm font-semibold text-white">
							Course Completion
						</h2>
						<Users className="h-4 w-4 text-emerald-400" />
					</div>
					<div className="mb-3">
						<select
							value={selectedUserId}
							onChange={(e) => {
								const params = new URLSearchParams(searchParams)
								if (e.target.value) {
									params.set('userId', e.target.value)
								} else {
									params.delete('userId')
								}
								setSearchParams(params)
							}}
							className="w-full rounded-lg border border-slate-700 bg-slate-800 py-1.5 px-3 text-xs text-white outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
						>
							<option value="">Select a user...</option>
							{allUsers.map((u) => (
								<option key={u.id} value={u.id}>
									{u.name}
								</option>
							))}
						</select>
					</div>
					{selectedUserId ? (
						<>
							<p className="mb-3 text-xs text-slate-400">
								Completion for{' '}
								<span className="font-medium text-slate-200">
									{selectedUserName}
								</span>
							</p>
							{userCompletions.length > 0 ? (
								<div className="space-y-3">
									{userCompletions.map((course) => (
										<div key={course.courseId}>
											<div className="mb-1 flex items-center justify-between gap-4 text-xs">
												<p className="min-w-0 truncate font-medium text-slate-200">
													{course.title}
												</p>
												<span className="shrink-0 font-bold text-white">
													{formatPercent(
														course.completionRate,
													)}
												</span>
											</div>
											<div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
												<div
													className="h-full rounded-full bg-emerald-500"
													style={{
														width: `${Math.min(course.completionRate, 100)}%`,
													}}
												/>
											</div>
											<p className="mt-0.5 text-[10px] text-slate-500">
												{course.completedLessons}/
												{course.totalLessons} lessons
												complete
											</p>
										</div>
									))}
								</div>
							) : (
								<p className="text-xs text-slate-500">
									This user is not enrolled in any courses.
								</p>
							)}
						</>
					) : (
						<p className="text-xs text-slate-500">
							Select a user to view their per-course completion.
						</p>
					)}
				</div>

				<div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
					<div className="mb-3 flex items-center justify-between gap-4">
						<h2 className="text-sm font-semibold text-white">
							Recent Users
						</h2>
						<Users className="h-4 w-4 text-purple-400" />
					</div>
					<div className="overflow-hidden rounded-lg border border-slate-800">
						<table className="w-full text-left text-xs">
							<thead className="bg-slate-800/50 text-[10px] uppercase tracking-widest text-slate-500">
								<tr>
									<th className="px-3 py-2">Name</th>
									<th className="px-3 py-2">Email</th>
									<th className="px-3 py-2">Role</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-800">
								{recentUsers.map((u) => (
									<tr key={u.id}>
										<td className="px-3 py-2 font-medium text-white">
											{u.name}
										</td>
										<td className="px-3 py-2 text-slate-400">
											{u.email}
										</td>
										<td className="px-3 py-2">
											<span
												className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
													u.role === 'staff'
														? 'bg-emerald-400/10 text-emerald-300'
														: 'bg-slate-700 text-slate-300'
												}`}
											>
												{u.role}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{recentUsers.length > 0 ? (
						<Link
							to="/admin/users"
							className="mt-3 inline-flex text-xs font-medium text-emerald-400 hover:text-emerald-300"
						>
							View all users &rarr;
						</Link>
					) : null}
				</div>
			</section>
		</div>
	)
}
