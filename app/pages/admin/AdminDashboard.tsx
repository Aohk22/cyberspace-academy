import { sql } from 'drizzle-orm'
import {
	BookMarked,
	CheckCircle2,
	GraduationCap,
	Star,
	Users,
} from 'lucide-react'
import { Link, redirect, useLoaderData, useSearchParams } from 'react-router'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import { can } from '~/auth/permissions'
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

const courseRatingSchema = z.object({
	id: z.coerce.number(),
	title: z.string(),
	averageRating: z.coerce.number().nullable(),
	reviewCount: z.coerce.number(),
})

function formatPercent(value: number) {
	return `${Math.round(value)}%`
}

function renderStars(rating: number) {
	const full = Math.floor(rating)
	const hasHalf = rating - full >= 0.3
	const empty = 5 - full - (hasHalf ? 1 : 0)
	return (
		<span className="inline-flex items-center gap-0.5">
			{Array.from({ length: full }, (_, i) => (
				<Star
					key={`full-${i}`}
					className="h-3 w-3 fill-star text-star"
				/>
			))}
			{hasHalf && (
				<span className="relative h-3 w-3">
					<Star className="absolute h-3 w-3 text-star" />
					<Star
						className="absolute h-3 w-3 fill-star text-star"
						style={{ clipPath: 'inset(0 50% 0 0)' }}
					/>
				</span>
			)}
			{Array.from({ length: empty }, (_, i) => (
				<Star key={`empty-${i}`} className="h-3 w-3 text-muted" />
			))}
		</span>
	)
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
		<div className="rounded-lg border border-hairline bg-surface p-2">
			<div
				className={`flex h-6 w-6 items-center justify-center rounded-md ${tone}`}
			>
				<Icon className="h-3.5 w-3.5" />
			</div>
			<p className="mt-1.5 text-[11px] font-medium text-ink">{label}</p>
			<p className="mt-0.5 text-base font-bold text-ink">{value}</p>
			<p className="mt-0.5 text-[10px] text-muted">{meta}</p>
		</div>
	)
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}

	if (!can(user, 'admin')) {
		throw redirect('/')
	}

	const url = new URL(request.url)
	const created = url.searchParams.get('created')
	const selectedUserId = url.searchParams.get('userId')

	const [metricsResult, usersResult, allUsersResult, courseRatingsResult] =
		await Promise.all([
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
			db.execute(sql`
				SELECT
					c.id,
					c.title,
					ROUND(AVG(r.rating)::numeric, 1) AS "averageRating",
					COUNT(r.id)::int AS "reviewCount"
				FROM courses c
				LEFT JOIN reviews r ON r.course_id = c.id
				GROUP BY c.id
				ORDER BY c.title
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
				COUNT(l.id)::int AS "totalLessons",
				COUNT(CASE WHEN utl.completed = true THEN 1 END)::int AS "completedLessons",
				CASE
					WHEN COUNT(l.id) = 0 THEN 0
						ELSE ROUND(
							COUNT(CASE WHEN utl.completed = true THEN 1 END)::numeric
							/ COUNT(l.id)::numeric
							* 100
						)
					END AS "completionRate"
				FROM courses c
				JOIN users_to_courses utc ON utc.course_id = c.id AND utc.user_id = ${selectedUserId}
				JOIN modules m ON m.course_id = c.id
				JOIN lessons l ON l.module_id = m.id
				LEFT JOIN users_to_lessons utl ON utl.lesson_id = l.id AND utl.user_id = utc.user_id
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
		courseRatings: z
			.array(courseRatingSchema)
			.parse(courseRatingsResult.rows),
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
		courseRatings,
		userCompletions,
		selectedUserId,
		selectedUserName,
		created,
	} = useLoaderData<typeof loader>()
	const [searchParams, setSearchParams] = useSearchParams()

	return (
		<div className="space-y-6">
			{created ? (
				<div className="flex items-center gap-2 rounded-lg border border-deep-green/30 bg-deep-green/10 px-3 py-2 text-xs text-deep-green">
					<CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
					<span>User created successfully.</span>
				</div>
			) : null}

			<section className="grid grid-cols-1 gap-3 md:grid-cols-3">
				<MetricCard
					label="Learners"
					value={compactNumber(metrics.totalUsers)}
					icon={Users}
					tone="bg-purple/10 text-purple"
					meta={`${metrics.totalEnrollments} enrollments`}
				/>
				<MetricCard
					label="Courses"
					value={String(metrics.totalCourses)}
					icon={BookMarked}
					tone="bg-deep-green/10 text-deep-green"
					meta="Total courses in platform"
				/>
				<MetricCard
					label="Tracked Lessons"
					value={compactNumber(metrics.totalEnrollments)}
					icon={GraduationCap}
					tone="bg-coral/10 text-coral"
					meta="Across all enrollments"
				/>
			</section>

			<section className="rounded-lg border border-hairline bg-surface p-4">
				<div className="mb-3 flex items-center justify-between gap-4">
					<h2 className="text-sm font-semibold text-ink">
						Course Ratings
					</h2>
					<Star className="h-4 w-4 text-star" />
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="bg-soft-stone/50 text-[10px] uppercase tracking-widest text-muted">
							<tr>
								<th className="px-3 py-2">Course</th>
								<th className="px-3 py-2">Rating</th>
								<th className="px-3 py-2">Reviews</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-hairline">
							{courseRatings.length > 0 ? (
								courseRatings.map((c) => (
									<tr key={c.id}>
										<td className="max-w-48 px-3 py-2 font-medium text-ink truncate">
											{c.title}
										</td>
										<td className="px-3 py-2">
											{c.averageRating ? (
												<div className="flex items-center gap-2">
													{renderStars(
														c.averageRating,
													)}
													<span className="text-ink">
														{c.averageRating.toFixed(
															1,
														)}
													</span>
												</div>
											) : (
												<span className="text-muted">
													No ratings
												</span>
											)}
										</td>
										<td className="px-3 py-2 text-ink">
											{c.reviewCount}
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={3}
										className="px-3 py-4 text-center text-muted"
									>
										No courses found.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</section>

			<section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
				<div className="rounded-lg border border-hairline bg-surface p-4">
					<div className="mb-3 flex items-center justify-between gap-4">
						<h2 className="text-sm font-semibold text-ink">
							Course Completion
						</h2>
						<Users className="h-4 w-4 text-deep-green" />
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
							className="w-full rounded-lg border border-hairline bg-soft-stone py-1.5 px-3 text-xs text-ink outline-none  focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
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
							<p className="mb-3 text-xs text-ink">
								Completion for{' '}
								<span className="font-medium text-ink">
									{selectedUserName}
								</span>
							</p>
							{userCompletions.length > 0 ? (
								<div className="space-y-3">
									{userCompletions.map((course) => (
										<div key={course.courseId}>
											<div className="mb-1 flex items-center justify-between gap-4 text-xs">
												<p className="min-w-0 truncate font-medium text-ink">
													{course.title}
												</p>
												<span className="shrink-0 font-bold text-ink">
													{formatPercent(
														course.completionRate,
													)}
												</span>
											</div>
											<div className="h-1.5 overflow-hidden rounded-full bg-soft-stone">
												<div
													className="h-full rounded-full bg-primary"
													style={{
														width: `${Math.min(course.completionRate, 100)}%`,
													}}
												/>
											</div>
											<p className="mt-0.5 text-[10px] text-muted">
												{course.completedLessons}/
												{course.totalLessons} lessons
												complete
											</p>
										</div>
									))}
								</div>
							) : (
								<p className="text-xs text-muted">
									This user is not enrolled in any courses.
								</p>
							)}
						</>
					) : (
						<p className="text-xs text-muted">
							Select a user to view their per-course completion.
						</p>
					)}
				</div>

				<div className="rounded-lg border border-hairline bg-surface p-4">
					<div className="mb-3 flex items-center justify-between gap-4">
						<h2 className="text-sm font-semibold text-ink">
							Recent Users
						</h2>
						<Users className="h-4 w-4 text-purple" />
					</div>
					<div className="overflow-hidden rounded-lg border border-hairline">
						<table className="w-full text-left text-xs">
							<thead className="bg-soft-stone/50 text-[10px] uppercase tracking-widest text-muted">
								<tr>
									<th className="px-3 py-2">Name</th>
									<th className="px-3 py-2">Email</th>
									<th className="px-3 py-2">Role</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-hairline">
								{recentUsers.map((u) => (
									<tr key={u.id}>
										<td className="px-3 py-2 font-medium text-ink">
											{u.name}
										</td>
										<td className="px-3 py-2 text-ink">
											{u.email}
										</td>
										<td className="px-3 py-2">
											<span
												className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
													u.role === 'staff'
														? 'bg-deep-green/10 text-deep-green'
														: 'bg-hairline text-body-muted'
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
							className="mt-3 inline-flex text-xs font-medium text-deep-green hover:text-deep-green"
						>
							View all users &rarr;
						</Link>
					) : null}
				</div>
			</section>
		</div>
	)
}
