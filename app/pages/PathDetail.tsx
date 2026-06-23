import { Await, redirect, useLoaderData } from 'react-router'
import { Map, Clock, BookOpen, ChevronRight, Play } from 'lucide-react'
import { Link } from 'react-router'
import { Suspense } from 'react'
import type { Route } from './+types/PathDetail'
import { getLearningPathDetail } from '~/.server/queries/learning-paths'
import type { LearningPathDetail } from '~/.server/database/types'
import {
	formatCourseLength,
	formatLessonLength,
} from '~/utils/format-course-length'
import { getSession } from '~/.server/auth/sessions'

export async function loader({ request, params }: Route.LoaderArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	const userId = session.has('userId')
		? parseInt(session.get('userId')!)
		: undefined

	const pathId = parseInt(params.pathId)
	if (Number.isNaN(pathId)) throw new Error('Invalid path parameter')

	return { dataPromise: getLearningPathDetail(pathId, userId) }
}

export default function PathDetail() {
	const { dataPromise } = useLoaderData<typeof loader>()

	return (
		<div className="space-y-8">
			<Suspense fallback={<PathDetailSkeleton />}>
				<Await resolve={dataPromise}>
					{(data) => {
						if (data == null) {
							return (
								<div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-12 text-center">
									<h2 className="text-lg font-bold text-white">
										Path not found
									</h2>
									<Link
										to="/paths"
										className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300"
									>
										Back to learning paths
									</Link>
								</div>
							)
						}
						return <PathDetailInner path={data} />
					}}
				</Await>
			</Suspense>
		</div>
	)
}

function PathDetailInner({ path }: { path: LearningPathDetail }) {
	const firstUnenrolled = path.courses.find((c) => !c.enrolled)
	const allEnrolled = path.courses.every((c) => c.enrolled)
	const firstCourse = path.courses[0]

	let ctaLabel: string
	let ctaHref: string
	if (allEnrolled) {
		ctaLabel = 'Review Path'
		ctaHref = `/courses/${path.courses[0].courseId}`
	} else if (firstUnenrolled) {
		ctaLabel = firstCourse?.enrolled ? 'Continue Path' : 'Start Path'
		ctaHref = `/courses/${firstUnenrolled.courseId}`
	} else {
		ctaLabel = 'Start Path'
		ctaHref = `/courses/${firstCourse?.courseId}`
	}

	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Link
						to="/paths"
						className="text-sm text-slate-500 hover:text-emerald-400 transition-colors"
					>
						Learning Paths
					</Link>
					<ChevronRight className="w-4 h-4 text-slate-700" />
					<span className="text-sm text-slate-200 font-medium">
						{path.title}
					</span>
				</div>

				<div className="flex flex-col md:flex-row md:items-start gap-6">
					<div className="flex-1 space-y-4">
						<h1 className="text-4xl font-bold text-white tracking-tight">
							{path.title}
						</h1>
						{path.description && (
							<p className="text-lg text-slate-400 leading-relaxed">
								{path.description}
							</p>
						)}
						<div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
							<div className="flex items-center gap-1.5">
								<BookOpen className="w-4 h-4" />
								{path.coursesCount} courses
							</div>
							<div className="w-1 h-1 bg-slate-700 rounded-full" />
							<div className="flex items-center gap-1.5">
								<Clock className="w-4 h-4" />
								{formatCourseLength(path.totalDuration)}
							</div>
						</div>
					</div>

					{path.thumbnail ? (
						<div className="w-full md:w-72 aspect-video rounded-xl overflow-hidden shrink-0">
							<img
								src={path.thumbnail}
								alt={path.title}
								className="w-full h-full object-cover"
								referrerPolicy="no-referrer"
							/>
						</div>
					) : (
						<div className="w-full md:w-72 aspect-video rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
							<Map className="w-12 h-12 text-slate-600" />
						</div>
					)}
				</div>

				<Link
					to={ctaHref}
					className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-sm"
				>
					<Play className="w-4 h-4" />
					{ctaLabel}
				</Link>
			</div>

			<div className="space-y-4">
				<h2 className="text-2xl font-bold text-white">Courses</h2>
				<div className="space-y-3">
					{path.courses.map((course, index) => (
						<Link
							key={course.courseId}
							to={
								course.enrolled
									? `/courses/${course.courseId}`
									: `/courses/${course.courseId}`
							}
							className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors group"
						>
							<div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-sm font-bold text-slate-400">
								{index + 1}
							</div>
							{course.thumbnail && (
								<div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 hidden sm:block">
									<img
										src={course.thumbnail}
										alt={course.title}
										className="w-full h-full object-cover"
										referrerPolicy="no-referrer"
									/>
								</div>
							)}
							<div className="flex-1 min-w-0">
								<h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
									{course.title}
								</h3>
								<p className="text-xs text-slate-500 mt-0.5">
									{course.lessonsCount} lessons &middot;{' '}
									{formatLessonLength(course.length)}
								</p>
							</div>
							{course.enrolled ? (
								<span className="text-xs font-bold text-emerald-500">
									Enrolled
								</span>
							) : (
								<span className="text-xs font-bold text-slate-500 group-hover:text-emerald-400 transition-colors">
									Start
								</span>
							)}
						</Link>
					))}
				</div>
			</div>
		</div>
	)
}

function PathDetailSkeleton() {
	return (
		<div className="space-y-8 animate-pulse">
			<div className="space-y-4">
				<div className="h-4 w-28 bg-slate-800 rounded" />
				<div className="flex gap-6">
					<div className="flex-1 space-y-3">
						<div className="h-10 w-3/4 bg-slate-800 rounded" />
						<div className="h-5 w-full bg-slate-800 rounded" />
						<div className="flex gap-4">
							<div className="h-4 w-20 bg-slate-800 rounded" />
							<div className="h-4 w-24 bg-slate-800 rounded" />
						</div>
					</div>
					<div className="w-72 aspect-video bg-slate-800 rounded-xl shrink-0 hidden md:block" />
				</div>
				<div className="h-11 w-36 bg-slate-800 rounded-xl" />
			</div>
			<div className="space-y-3">
				<div className="h-7 w-24 bg-slate-800 rounded" />
				{[1, 2, 3].map((i) => (
					<div key={i} className="h-20 bg-slate-800 rounded-xl" />
				))}
			</div>
		</div>
	)
}
