import { Await, redirect, useLoaderData, useFetcher, Link } from 'react-router'
import {
	Map,
	Clock,
	BookOpen,
	ChevronRight,
	Play,
	Bookmark,
	Swords,
	CheckCircle2,
	Circle,
} from 'lucide-react'
import { Suspense } from 'react'
import type { Route } from './+types/LearningPathDetail'
import {
	getLearningPathDetail,
	toggleTrackPath,
} from '~/.server/queries/learning-paths'
import type { LearningPathDetail, RoadmapItem } from '~/.server/database/types'
import {
	formatCourseLength,
	formatLessonLength,
} from '~/utils/format-course-length'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import { can } from '~/auth/permissions'

export async function loader({ context, params }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) throw new NoUserContextError('User resolved')

	if (!can(user, 'accessLearningPaths')) {
		throw redirect('/dashboard')
	}

	const pathId = parseInt(params.pathId)
	if (Number.isNaN(pathId)) throw new Error('Invalid path parameter')

	return { dataPromise: getLearningPathDetail(pathId, user.id) }
}

export async function action({ context, request, params }: Route.ActionArgs) {
	const user = context.get(userContext)
	if (user === null) throw new NoUserContextError('User resolved')

	if (!can(user, 'accessLearningPaths')) {
		return { error: 'Upgrade to Lite or Pro to track learning paths.' }
	}

	const form = await request.formData()
	const intent = form.get('intent')

	if (intent === 'toggle-track') {
		const pathId = parseInt(params.pathId)
		return toggleTrackPath(pathId, user.id)
	}

	return { error: 'Unknown intent' }
}

export default function LearningPathDetail() {
	const { dataPromise } = useLoaderData<typeof loader>()

	return (
		<div className="space-y-8">
			<Suspense fallback={<LearningPathDetailSkeleton />}>
				<Await resolve={dataPromise}>
					{(data) => {
						if (data == null) {
							return (
								<div className="rounded-xl border border-dashed border-hairline bg-surface/50 px-6 py-12 text-center">
									<h2 className="text-lg font-bold text-ink">
										Path not found
									</h2>
									<Link
										to="/learning-path"
										className="mt-2 inline-block text-sm text-deep-green hover:text-deep-green"
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
	const fetcher = useFetcher()
	const tracked = fetcher.formData
		? fetcher.formData.get('intent') === 'toggle-track'
			? fetcher.data
				? (fetcher.data as { tracked: boolean }).tracked
				: !path.tracked
			: path.tracked
		: path.tracked

	const completedCount = path.roadmap.filter((item) => item.completed).length
	const totalCount = path.roadmap.length

	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Link
						to="/learning-path"
						className="text-sm text-muted hover:text-deep-green "
					>
						Learning Paths
					</Link>
					<ChevronRight className="w-4 h-4 text-muted" />
					<span className="text-sm text-ink font-medium">
						{path.title}
					</span>
				</div>

				<div className="flex flex-col md:flex-row md:items-start gap-6">
					<div className="flex-1 space-y-4">
						<h1 className="text-4xl font-bold text-ink tracking-tight">
							{path.title}
						</h1>
						{path.description && (
							<p className="text-lg text-ink leading-relaxed">
								{path.description}
							</p>
						)}

						{path.tags && path.tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{path.tags.map((tag) => (
									<span
										key={tag}
										className="text-xs text-muted bg-soft-stone px-2 py-0.5 rounded"
									>
										#{tag}
									</span>
								))}
							</div>
						)}

						<div className="flex flex-wrap items-center gap-4 text-sm text-muted">
							<div className="flex items-center gap-1.5">
								<BookOpen className="w-4 h-4" />
								{path.coursesCount} courses
							</div>
							<div className="w-1 h-1 bg-hairline rounded-full" />
							<div className="flex items-center gap-1.5">
								<Clock className="w-4 h-4" />
								{path.timeToComplete
									? formatCourseLength(path.timeToComplete)
									: formatCourseLength(path.totalDuration)}
							</div>
							{totalCount > 0 && (
								<>
									<div className="w-1 h-1 bg-hairline rounded-full" />
									<div className="flex items-center gap-1.5">
										<Swords className="w-4 h-4" />
										{totalCount} items
									</div>
								</>
							)}
						</div>

						{path.tracked && totalCount > 0 && (
							<div className="max-w-sm">
								<div className="flex items-center justify-between text-sm text-muted mb-1.5">
									<span>Progress</span>
									<span>
										{completedCount}/{totalCount} (
										{path.progress}%)
									</span>
								</div>
								<div className="w-full h-2 bg-soft-stone rounded-full overflow-hidden">
									<div
										className="h-full bg-primary rounded-full transition-all duration-500"
										style={{ width: `${path.progress}%` }}
									/>
								</div>
							</div>
						)}
					</div>

					<div className="flex flex-col items-start gap-3 shrink-0">
						{path.thumbnail ? (
							<div className="w-full md:w-72 aspect-video rounded-xl overflow-hidden">
								<img
									src={path.thumbnail}
									alt={path.title}
									className="w-full h-full object-cover"
									referrerPolicy="no-referrer"
								/>
							</div>
						) : (
							<div className="w-full md:w-72 aspect-video rounded-xl bg-soft-stone flex items-center justify-center">
								<Map className="w-12 h-12 text-muted" />
							</div>
						)}

						<fetcher.Form method="post" className="w-full">
							<input
								type="hidden"
								name="intent"
								value="toggle-track"
							/>
							<button
								type="submit"
								className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-sm ${
									tracked
										? 'bg-deep-green/10 border border-deep-green/30 text-deep-green hover:bg-deep-green/20'
										: 'bg-primary hover:bg-deep-green text-on-dark'
								}`}
							>
								<Bookmark
									className={`w-4 h-4 ${tracked ? 'fill-current' : ''}`}
								/>
								{tracked ? 'Tracking' : 'Track Path'}
							</button>
						</fetcher.Form>
					</div>
				</div>
			</div>

			{/* Progress Overview */}
			{tracked && totalCount > 0 && (
				<div className="rounded-xl border border-hairline bg-surface/50 p-5">
					<h3 className="text-sm font-bold text-ink mb-3">
						Progress Overview
					</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div>
							<div className="text-2xl font-bold text-ink">
								{completedCount}
							</div>
							<div className="text-xs text-muted">Completed</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-ink">
								{totalCount - completedCount}
							</div>
							<div className="text-xs text-muted">Remaining</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-deep-green">
								{path.progress}%
							</div>
							<div className="text-xs text-muted">Complete</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-ink">
								{path.timeToComplete
									? formatCourseLength(path.timeToComplete)
									: formatCourseLength(path.totalDuration)}
							</div>
							<div className="text-xs text-muted">Est. time</div>
						</div>
					</div>
				</div>
			)}

			{/* Roadmap */}
			<div className="space-y-4">
				<h2 className="text-2xl font-bold text-ink">Roadmap</h2>
				<div className="space-y-3">
					{path.roadmap.map((item, index) => (
						<RoadmapItemRow
							key={`${item.type}-${item.type === 'course' ? item.courseId : item.challengeId}`}
							item={item}
							index={index}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

function RoadmapItemRow({ item, index }: { item: RoadmapItem; index: number }) {
	const href =
		item.type === 'course' ? `/courses/${item.courseId}` : '/challenges'

	return (
		<Link
			to={href}
			className={`flex items-center gap-4 p-4 border rounded-xl  group ${
				item.completed
					? 'border-deep-green/30 bg-deep-green/5'
					: 'border-hairline bg-surface hover:border-hairline'
			}`}
		>
			<div
				className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
					item.completed
						? 'bg-deep-green/20 text-deep-green'
						: 'bg-soft-stone text-ink'
				}`}
			>
				{index + 1}
			</div>

			<div
				className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
					item.type === 'course'
						? 'bg-deep-green/10 text-deep-green'
						: 'bg-purple/10 text-purple'
				}`}
			>
				{item.type === 'course' ? (
					<BookOpen className="w-5 h-5" />
				) : (
					<Swords className="w-5 h-5" />
				)}
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-0.5">
					{item.type === 'course' ? (
						<span className="text-[10px] font-bold uppercase tracking-wider text-muted">
							Course
						</span>
					) : (
						<span className="text-[10px] font-bold uppercase text-purple">
							Challenge &middot; {item.difficulty}
						</span>
					)}
				</div>
				<h3 className="font-bold text-ink group-hover:text-deep-green  truncate">
					{item.type === 'course' ? item.title : item.name}
				</h3>
				{item.type === 'course' ? (
					<p className="text-xs text-muted mt-0.5">
						{item.lessonsCount} lessons &middot;{' '}
						{formatLessonLength(item.length)}
					</p>
				) : (
					<p className="text-xs text-muted mt-0.5">
						{item.points} pts &middot; {item.difficulty}
					</p>
				)}
			</div>

			{item.completed ? (
				<CheckCircle2 className="w-5 h-5 text-deep-green shrink-0" />
			) : (
				<Circle className="w-5 h-5 text-muted shrink-0" />
			)}
		</Link>
	)
}

function LearningPathDetailSkeleton() {
	return (
		<div className="space-y-8 animate-pulse">
			<div className="space-y-4">
				<div className="h-4 w-28 bg-soft-stone rounded" />
				<div className="flex gap-6">
					<div className="flex-1 space-y-3">
						<div className="h-10 w-3/4 bg-soft-stone rounded" />
						<div className="h-5 w-full bg-soft-stone rounded" />
						<div className="flex gap-4">
							<div className="h-4 w-20 bg-soft-stone rounded" />
							<div className="h-4 w-24 bg-soft-stone rounded" />
						</div>
					</div>
					<div className="w-72 aspect-video bg-soft-stone rounded-xl shrink-0 hidden md:block" />
				</div>
				<div className="h-11 w-36 bg-soft-stone rounded-xl" />
			</div>
			<div className="space-y-3">
				<div className="h-7 w-24 bg-soft-stone rounded" />
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="h-20 bg-soft-stone rounded-xl" />
				))}
			</div>
		</div>
	)
}
