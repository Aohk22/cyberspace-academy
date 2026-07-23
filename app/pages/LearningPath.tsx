import {
	Search,
	Clock,
	BookOpen,
	Bookmark,
	ChevronDown,
	ChevronRight,
	CheckCircle2,
	Play,
} from 'lucide-react'
import { Link, useLoaderData, useSearchParams, useFetcher } from 'react-router'
import { redirect } from 'react-router'
import { use, useDeferredValue, useState, Suspense } from 'react'
import type { Route } from './+types/LearningPath'
import {
	getLearningPaths,
	toggleTrackPath,
} from '~/.server/queries/learning-paths'
import type {
	LearningPathWithCount,
	LearningPathRoadmapItem,
} from '~/.server/database/types'
import { formatCourseLength } from '~/utils/format-course-length'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import { can } from '~/auth/permissions'
import { z } from 'zod'

export const handle = {
	section: {
		title: 'Learning Paths',
		subtitle:
			'Follow a curated sequence of courses and challenges to master a topic.',
	},
}

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) throw new NoUserContextError('User resolved')

	if (!can(user, 'accessLearningPaths')) {
		throw redirect('/dashboard')
	}

	return { paths: getLearningPaths(user.id) }
}

export async function action({ context, request }: Route.ActionArgs) {
	const user = context.get(userContext)
	if (user === null) throw new NoUserContextError('User resolved')

	if (!can(user, 'accessLearningPaths')) {
		return { error: 'Upgrade to Lite or Pro to track learning paths.' }
	}

	const form = await request.formData()
	const intent = form.get('intent')

	if (intent === 'toggle-track') {
		const pathId = z.coerce.number().parse(form.get('pathId'))
		return toggleTrackPath(pathId, user.id)
	}

	return { error: 'Unknown intent' }
}

export default function LearningPath() {
	const { paths } = useLoaderData<typeof loader>()

	return (
		<Suspense fallback={<LearningPathsSkeleton />}>
			<LearningPathsContent pathsPromise={paths} />
		</Suspense>
	)
}

function LearningPathsContent({
	pathsPromise,
}: {
	pathsPromise: Promise<LearningPathWithCount[]>
}) {
	const paths = use(pathsPromise)

	return <LearningPathsInner paths={paths} />
}

function LearningPathsInner({ paths }: { paths: LearningPathWithCount[] }) {
	const [searchParams, setSearchParams] = useSearchParams()
	const [searchQuery, setSearchQuery] = useState(
		searchParams.get('search') ?? '',
	)
	const deferredSearchQuery = useDeferredValue(searchQuery)
	const trackedOnly = searchParams.get('tracked') === '1'

	const normalizedSearch = deferredSearchQuery.trim().toLowerCase()
	const filtered = paths.filter((p) => {
		if (trackedOnly && !p.tracked) return false
		if (normalizedSearch) {
			const haystack = [p.title, p.description ?? '', ...(p.tags ?? [])]
				.join(' ')
				.toLowerCase()
			return haystack.includes(normalizedSearch)
		}
		return true
	})

	const trackedCount = paths.filter((p) => p.tracked).length

	function setTracked(v: boolean) {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev)
			if (v) next.set('tracked', '1')
			else next.delete('tracked')
			return next
		})
	}

	return (
		<div className="space-y-6">
			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => {
						setSearchQuery(e.target.value)
						setSearchParams((prev) => {
							const next = new URLSearchParams(prev)
							if (e.target.value)
								next.set('search', e.target.value)
							else next.delete('search')
							return next
						})
					}}
					placeholder="Search learning paths..."
					className="w-full pl-9 pr-3 py-2 bg-surface border border-hairline rounded-lg text-sm text-ink placeholder-muted outline-none focus:border-hairline transition-colors"
				/>
			</div>

			{/* Tabs */}
			<div className="flex border-b border-hairline">
				<button
					onClick={() => setTracked(false)}
					className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
						!trackedOnly
							? 'border-deep-green text-deep-green'
							: 'border-transparent text-muted hover:text-body-muted'
					}`}
				>
					All learning paths
				</button>
				<button
					onClick={() => setTracked(true)}
					className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
						trackedOnly
							? 'border-deep-green text-deep-green'
							: 'border-transparent text-muted hover:text-body-muted'
					}`}
				>
					Tracked paths
					{trackedCount > 0 && (
						<span className="ml-1.5 text-[10px] text-muted">
							({trackedCount})
						</span>
					)}
				</button>
			</div>

			{/* Cards */}
			{filtered.length > 0 ? (
				<div className="space-y-4">
					{filtered.map((path) => (
						<PathCard key={path.id} path={path} />
					))}
				</div>
			) : (
				<div className="rounded-xl border border-dashed border-hairline bg-surface/50 px-6 py-12 text-center">
					<h2 className="text-lg font-bold text-ink">
						{trackedOnly
							? 'No tracked learning paths'
							: 'No learning paths found'}
					</h2>
					<p className="mt-2 text-sm text-ink">
						{trackedOnly
							? 'Start tracking a path to see it here.'
							: 'Try a different search term.'}
					</p>
				</div>
			)}
		</div>
	)
}

function PathCard({ path }: { path: LearningPathWithCount }) {
	const [expanded, setExpanded] = useState(false)
	const fetcher = useFetcher()
	const tracked = fetcher.formData
		? fetcher.formData.get('intent') === 'toggle-track' &&
			fetcher.formData.get('pathId') === String(path.id)
			? fetcher.data
				? (fetcher.data as { tracked: boolean }).tracked
				: !path.tracked
			: path.tracked
		: path.tracked

	const completedCount = path.roadmap.filter((item) => item.completed).length
	const totalCount = path.roadmap.length

	return (
		<div className="bg-surface border border-hairline rounded-xl overflow-hidden hover:border-hairline transition-colors">
			<div className="p-5">
				<div className="flex items-start justify-between gap-4">
					{/* Left content */}
					<div className="flex-1 min-w-0">
						{/* Header */}
						<div className="flex items-center gap-2 mb-2">
							<Link
								to={`/learning-path/${path.id}`}
								className="text-lg font-bold text-ink hover:text-deep-green transition-colors truncate"
							>
								{path.title}
							</Link>
							{tracked && (
								<span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-deep-green bg-deep-green/10 px-2 py-0.5 rounded">
									Tracking
								</span>
							)}
						</div>

						{/* Metadata row */}
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted mb-3">
							<div className="flex items-center gap-1">
								<Clock className="w-3 h-3" />
								{path.timeToComplete
									? formatCourseLength(path.timeToComplete)
									: formatCourseLength(path.totalDuration)}
							</div>
							<div className="w-1 h-1 bg-hairline rounded-full shrink-0" />
							<div className="flex items-center gap-1">
								<BookOpen className="w-3 h-3" />
								{path.coursesCount} courses
							</div>
							{totalCount > 0 && (
								<>
									<div className="w-1 h-1 bg-hairline rounded-full shrink-0" />
									<span>{totalCount} steps</span>
								</>
							)}
						</div>

						{/* Description */}
						{path.description && (
							<p className="text-sm text-ink line-clamp-2 mb-3">
								{path.description}
							</p>
						)}

						{/* Progress section */}
						{tracked && totalCount > 0 && (
							<div className="max-w-xs mb-0">
								<div className="flex items-center justify-between text-xs text-muted mb-1">
									<span>progress</span>
									<span>
										{completedCount}/{totalCount}
									</span>
								</div>
								<div className="w-full h-1.5 bg-soft-stone rounded-full overflow-hidden">
									<div
										className="h-full bg-primary rounded-full transition-all duration-500"
										style={{ width: `${path.progress}%` }}
									/>
								</div>
							</div>
						)}
					</div>

					{/* Right: Continue button + Track toggle */}
					<div className="flex flex-col items-center gap-2 shrink-0">
						<Link
							to={`/learning-path/${path.id}`}
							className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-deep-green hover:brightness-110 text-xs font-bold rounded-lg transition-colors text-on-dark"
						>
							Continue
							<Play className="w-3 h-3 fill-current" />
						</Link>
						<fetcher.Form method="post">
							<input
								type="hidden"
								name="intent"
								value="toggle-track"
							/>
							<input
								type="hidden"
								name="pathId"
								value={path.id}
							/>
							<button
								type="submit"
								className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold border transition-all ${
									tracked
										? 'border-deep-green/30 text-deep-green hover:bg-deep-green/10'
										: 'border-hairline text-muted hover:text-body-muted hover:border-hairline'
								}`}
							>
								<Bookmark
									className={`w-3 h-3 ${tracked ? 'fill-current' : ''}`}
								/>
								{tracked ? 'Tracking' : 'Track'}
							</button>
						</fetcher.Form>
					</div>
				</div>

				{/* Expand/collapse */}
				{totalCount > 0 && (
					<button
						onClick={() => setExpanded(!expanded)}
						className="flex items-center gap-1 mt-3 text-xs text-muted hover:text-body-muted transition-colors"
					>
						{expanded ? (
							<ChevronDown className="w-3.5 h-3.5" />
						) : (
							<ChevronRight className="w-3.5 h-3.5" />
						)}
						{expanded ? 'Hide roadmap' : 'Show roadmap'}
					</button>
				)}
			</div>

			{/* Expanded roadmap */}
			{expanded && totalCount > 0 && (
				<div className="border-t border-hairline px-5 py-4 bg-canvas/50">
					<RoadmapTimeline items={path.roadmap} />
				</div>
			)}
		</div>
	)
}

function RoadmapTimeline({ items }: { items: LearningPathRoadmapItem[] }) {
	return (
		<div className="relative">
			<div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-hairline" />
			<div className="space-y-0">
				{items.map((item, index) => (
					<div
						key={`${item.type}-${item.position}`}
						className="relative flex items-start gap-4 pb-8 last:pb-0"
					>
						{/* Arrow connector (except last) */}
						{index < items.length - 1 && (
							<div className="absolute left-[11px] top-[30px] text-muted select-none">
								<ChevronDown className="w-[10px] h-[10px]" />
							</div>
						)}

						{/* Node */}
						<div className="relative z-10 mt-0.5">
							<div
								className={`w-[30px] h-[30px] rounded-full flex items-center justify-center border-2 ${
									item.completed
										? 'border-deep-green bg-deep-green/20'
										: 'border-hairline bg-soft-stone'
								}`}
							>
								{item.completed ? (
									<CheckCircle2 className="w-4 h-4 text-deep-green" />
								) : (
									<span className="text-xs font-bold text-ink">
										{item.position}
									</span>
								)}
							</div>
						</div>

						{/* Content */}
						<div className="flex-1 min-w-0 pt-1">
							<div className="flex items-center gap-2 mb-0.5">
								<span
									className={`text-[10px] font-bold uppercase tracking-wider ${
										item.type === 'course'
											? 'text-deep-green'
											: 'text-purple'
									}`}
								>
									{item.type === 'course'
										? 'Course'
										: 'Challenge'}
								</span>
							</div>
							<p className="text-sm text-ink font-medium truncate">
								{item.title}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

function LearningPathsSkeleton() {
	return (
		<div className="space-y-4 animate-pulse">
			{[1, 2, 3].map((i) => (
				<div
					key={i}
					className="bg-surface border border-hairline rounded-xl overflow-hidden p-5"
				>
					<div className="space-y-3">
						<div className="h-5 w-48 bg-soft-stone rounded" />
						<div className="h-4 w-36 bg-soft-stone rounded" />
						<div className="h-4 w-full bg-soft-stone rounded" />
					</div>
				</div>
			))}
		</div>
	)
}
