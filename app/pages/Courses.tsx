import { Search, Clock, BookOpen, ChevronRight } from 'lucide-react'
import { Link, useLoaderData, useSearchParams } from 'react-router'
import { use, useDeferredValue, useState, Suspense } from 'react'
import type { Route } from './+types/Courses'
import type { Category } from '~/.server/database/types'
import { getCategories } from '~/.server/database/utils'
import { getCoursesData, type CoursesView } from '~/.server/queries/courses'
import { formatCourseLength } from '~/utils/format-course-length'

export const handle = {
	section: {
		title: 'Explore Courses',
		subtitle: 'Find the perfect course to advance your career.',
	},
}

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const category = url.searchParams.get('cat')

	return {
		categories: getCategories(),
		courses: getCoursesData({ category }),
	}
}

export default function Courses() {
	const { categories, courses } = useLoaderData<typeof loader>()

	return (
		<div className="space-y-8">
			<Suspense fallback={<CoursesSkeleton />}>
				<CoursesContent
					categoriesPromise={categories}
					coursesPromise={courses}
				/>
			</Suspense>
		</div>
	)
}

function CoursesContent({
	categoriesPromise,
	coursesPromise,
}: {
	categoriesPromise: Promise<Category[]>
	coursesPromise: Promise<CoursesView[]>
}) {
	const categories = use(categoriesPromise)
	const courses = use(coursesPromise)

	return <CoursesInner categories={categories} courses={courses} />
}

function CoursesInner({
	categories,
	courses,
}: {
	categories: Category[]
	courses: CoursesView[]
}) {
	const [searchParams] = useSearchParams()
	const activeCategory = searchParams.get('cat') ?? 'all'
	const [searchQuery, setSearchQuery] = useState('')
	const deferredSearchQuery = useDeferredValue(searchQuery)
	const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase()
	const filteredCourses = normalizedSearchQuery
		? courses.filter((course) => {
				const haystack = [
					course.title,
					course.description,
					course.instructor,
					course.category,
				]
					.join(' ')
					.toLowerCase()

				return haystack.includes(normalizedSearchQuery)
			})
		: courses

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-center gap-3 p-3 border border-hairline rounded-xl">
				<div className="relative min-w-0 flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
					<input
						type="text"
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						placeholder="Search courses..."
						className="pl-9 pr-3 py-1.5 bg-transparent text-sm text-ink placeholder-muted outline-none w-full"
					/>
				</div>

				<div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
					<Link
						to="/courses"
						className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
							activeCategory === 'all'
								? 'bg-hairline text-ink'
								: 'text-ink hover:text-deep-green'
						}`}
					>
						All
					</Link>
					{categories.map((cat) => (
						<Link
							key={cat.id}
							to={`?cat=${cat.name}`}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
								activeCategory === cat.name
									? 'bg-deep-green text-on-dark'
									: 'text-body-muted hover:text-ink'
							}`}
						>
							{cat.name}
						</Link>
					))}
				</div>
			</div>

			{/* Course Grid */}
			{filteredCourses.length > 0 ? (
				<div className="space-y-2">
					{filteredCourses.map((course) => {
						return (
							<Link
								key={course.id}
								to={`/courses/${course.id}`}
								className="group flex items-center gap-4 p-4 border border-hairline rounded-xl hover:border-hairline transition-colors"
							>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2 text-[11px] text-muted">
										<span className="text-[10px] font-bold uppercase tracking-widest text-muted">
											{course.category}
										</span>
										<span>&middot;</span>
										<div className="flex items-center gap-1">
											<Clock className="w-3 h-3" />
											{formatCourseLength(course.length)}
										</div>
										<span>&middot;</span>
										<div className="flex items-center gap-1">
											<BookOpen className="w-3 h-3" />
											{course.lessons_count} lessons
										</div>
									</div>
									<h3 className="text-sm font-bold text-ink truncate group-hover:text-deep-green transition-colors">
										{course.title}
									</h3>
									<p className="text-xs text-ink truncate">
										{course.description}
									</p>
								</div>

								<div className="hidden sm:flex items-center gap-3 shrink-0">
									<div className="flex items-center gap-1.5">
										<div className="w-5 h-5 rounded-full bg-soft-stone flex items-center justify-center overflow-hidden">
											<img
												src={`https://ui-avatars.com/api/?name=${course.instructor}&background=random`}
												alt={course.instructor}
												className="w-full h-full object-cover"
											/>
										</div>
										<span className="text-xs text-ink whitespace-nowrap">
											{course.instructor}
										</span>
									</div>
									<ChevronRight className="w-4 h-4 text-muted group-hover:text-body-muted transition-colors" />
								</div>
							</Link>
						)
					})}
				</div>
			) : (
				<div className="border border-dashed border-hairline rounded-xl px-6 py-10 text-center">
					<h2 className="text-base font-bold text-ink">
						No courses found
					</h2>
					<p className="mt-1 text-sm text-ink">
						Try a different search term
						{activeCategory !== 'all'
							? ` in ${activeCategory}`
							: ''}
						.
					</p>
				</div>
			)}
		</div>
	)
}

function CoursesSkeleton() {
	return (
		<div className="space-y-8">
			<div className="flex gap-3 p-3 border border-hairline rounded-xl animate-pulse">
				<div className="h-7 flex-1 bg-soft-stone rounded" />
				<div className="flex gap-1.5">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="h-7 w-14 bg-soft-stone rounded-lg"
						/>
					))}
				</div>
			</div>
			<div className="space-y-2">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div
						key={i}
						className="flex gap-3 p-4 border border-hairline rounded-xl animate-pulse"
					>
						<div className="flex-1 space-y-2 py-1">
							<div className="flex gap-3">
								<div className="h-3 w-16 bg-soft-stone rounded" />
								<div className="h-3 w-12 bg-soft-stone rounded" />
								<div className="h-3 w-14 bg-soft-stone rounded" />
							</div>
							<div className="h-4 w-3/4 bg-soft-stone rounded" />
							<div className="h-3 w-1/2 bg-soft-stone rounded" />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
