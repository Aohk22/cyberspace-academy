import {
	Link,
	redirect,
	useLoaderData,
	useNavigation,
	Await,
	Form,
	useFetcher,
} from 'react-router'
import { Suspense, useState } from 'react'
import CoursePreviewCard from '~/components/CoursePreviewCard'
import {
	Play,
	CheckCircle2,
	BookOpen,
	User,
	Star,
	ChevronRight,
	Send,
	ThumbsUp,
} from 'lucide-react'
import { userContext } from '~/context'
import type { Route } from './+types/CourseDetail'
import { NoUserContextError } from '~/error'
import { getCourseDetailData } from '~/.server/queries/course-detail'
import type { CourseDetailResult } from '~/.server/queries/course-detail'
import { db } from '~/.server/database/connection'
import { usersToCourses, reviews } from '~/.server/database/schema'
import { formatLessonLength } from '~/utils/format-course-length'
import { z } from 'zod'

export async function loader({ context, params }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}

	const courseId = parseInt(params.courseId)
	if (Number.isNaN(courseId)) throw new Error('Invalid path parameter')

	return {
		dataPromise: getCourseDetailData(courseId, user.id),
		userId: user.id,
	}
}

export async function action({ context, params, request }: Route.ActionArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User resolved')
	}

	const courseId = parseInt(params.courseId)
	const userId = user.id
	if (isNaN(courseId) || userId == null) {
		throw new Error('Invalid path parameter')
	}

	const formData = await request.formData()
	const intent = formData.get('_action')

	if (intent === 'enroll' || intent === null) {
		await db
			.insert(usersToCourses)
			.values({ userId, courseId })
			.onConflictDoNothing()

		return redirect(new URL(request.url).pathname)
	}

	if (intent === 'review') {
		const rating = z.coerce.number().parse(formData.get('rating'))
		const content = z.string().parse(formData.get('content'))

		await db.insert(reviews).values({ userId, courseId, rating, content })

		return redirect(new URL(request.url).pathname)
	}

	return null
}

export default function CourseDetail() {
	const { dataPromise, userId } = useLoaderData<typeof loader>()

	return (
		<div className="space-y-8">
			<Suspense fallback={<CourseDetailSkeleton />}>
				<Await resolve={dataPromise}>
					{(data) => {
						if (data == null) {
							return (
								<div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-12 text-center">
									<h2 className="text-lg font-bold text-white">
										Course not found
									</h2>
									<Link
										to="/courses"
										className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300"
									>
										Back to courses
									</Link>
								</div>
							)
						}
						return (
							<CourseDetailInner
								data={data}
								currentUserId={userId}
							/>
						)
					}}
				</Await>
			</Suspense>
		</div>
	)
}

function CourseDetailInner({
	data,
	currentUserId,
}: {
	data: CourseDetailResult
	currentUserId: number
}) {
	const { enrolled, course, averageRating, reviewCount, studentCount } = data
	const navigation = useNavigation()
	const modules = course.modules
	const lessonsCount = modules.reduce(
		(acc, module) => acc + module.lessons.length,
		0,
	)
	const allLessons = modules.flatMap((module) => module.lessons)
	const isSubmittingEnrollment =
		navigation.state === 'submitting' &&
		navigation.formAction?.endsWith(`/courses/${course.id}`)
	const lastCompletedLesson = [...allLessons]
		.reverse()
		.find((lesson) => lesson.completed)
	const fallbackLesson = allLessons[0]
	const continueLesson = lastCompletedLesson ?? fallbackLesson
	const continuePath = continueLesson
		? `/courses/${course.id}/lessons/${continueLesson.id}`
		: `/courses/${course.id}`

	const [reviewRating, setReviewRating] = useState(5)
	const [reviewContent, setReviewContent] = useState('')
	const reviewFetcher = useFetcher()

	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Link
						to="/courses"
						className="text-sm text-slate-500 hover:text-emerald-400 transition-colors"
					>
						Courses
					</Link>
					<ChevronRight className="w-4 h-4 text-slate-700" />
					<span className="text-sm text-slate-200 font-medium">
						{course.title ?? 'Course'}
					</span>
				</div>
				<h1 className="text-4xl font-bold text-white tracking-tight">
					{course.title ?? 'Course'}
				</h1>
				<p className="text-lg text-slate-400 leading-relaxed">
					{course.description ?? 'Enroll to unlock this course.'}
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-6 py-4 border-y border-slate-800">
				<div className="flex items-center gap-2">
					<div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
						<img
							src={`https://ui-avatars.com/api/?name=${course.instructor ?? 'Instructor'}&background=random`}
							alt={course.instructor ?? 'Instructor'}
						/>
					</div>
					<div>
						<p className="text-xs text-slate-500 font-medium">
							Instructor
						</p>
						<p className="text-sm font-bold text-white">
							{course.instructor ?? 'Instructor'}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
						<Star className="w-5 h-5 text-amber-400 fill-amber-400" />
					</div>
					<div>
						<p className="text-xs text-slate-500 font-medium">
							Rating
						</p>
						<p className="text-sm font-bold text-white">
							{averageRating
								? `${averageRating} (${reviewCount} reviews)`
								: 'No reviews yet'}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
						<User className="w-5 h-5 text-emerald-400" />
					</div>
					<div>
						<p className="text-xs text-slate-500 font-medium">
							Students
						</p>
						<p className="text-sm font-bold text-white">
							{studentCount.toLocaleString()} enrolled
						</p>
					</div>
				</div>
			</div>

			<CoursePreviewCard
				course={course}
				continuePath={continuePath}
				enrolled={enrolled}
				isSubmittingEnrollment={isSubmittingEnrollment}
			/>

			{/* Curriculum */}
			{enrolled ? (
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-bold text-white">
							Course Content
						</h2>
						<p className="text-sm text-slate-500">
							{modules.length} modules • {lessonsCount} lessons
						</p>
					</div>

					<div className="space-y-4">
						{modules.map((module, i) => (
							<div
								key={module.id}
								className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm"
							>
								<div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
									<h3 className="font-bold text-white">
										Module {i + 1}: {module.title}
									</h3>
									<span className="text-xs text-slate-500 font-medium">
										{module.lessons.length} lessons
									</span>
								</div>
								<div className="divide-y divide-slate-800/50">
									{module.lessons.map((lesson) => (
										<Link
											key={lesson.id}
											to={`/courses/${course.id}/lessons/${lesson.id}`}
											className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors group"
										>
											<div className="flex items-center gap-4">
												<div
													className={
														'w-8 h-8 rounded-full flex items-center justify-center transition-colors' +
														(lesson.completed
															? ' bg-emerald-500/10 text-emerald-500'
															: ' bg-slate-800 text-slate-600 group-hover:bg-emerald-500/10 group-hover:text-emerald-400')
													}
												>
													{lesson.completed ? (
														<CheckCircle2 className="w-5 h-5" />
													) : (
														<Play className="w-4 h-4" />
													)}
												</div>
												<div>
													<p
														className={
															'text-sm font-medium transition-colors' +
															(lesson.completed
																? ' text-slate-500'
																: ' text-slate-200 group-hover:text-emerald-400')
														}
													>
														{lesson.title}
													</p>
													<div className="flex items-center gap-2 mt-0.5">
														<span className="text-[10px] font-bold uppercase text-slate-500">
															Video
														</span>
														<span className="w-0.5 h-0.5 bg-slate-700 rounded-full" />
														<span className="text-[10px] text-slate-500">
															{formatLessonLength(
																lesson.length,
															)}
														</span>
													</div>
												</div>
											</div>
											{!lesson.completed && (
												<span className="text-xs font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
													Start
												</span>
											)}
										</Link>
									))}
								</div>
							</div>
						))}
					</div>

					{/* Review Form */}
					<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
						<h3 className="text-lg font-bold text-white">
							Leave a Review
						</h3>
						<reviewFetcher.Form method="POST">
							<input
								type="hidden"
								name="_action"
								value="review"
							/>
							<div className="flex items-center gap-1 mb-3">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										onClick={() => setReviewRating(star)}
										className="transition-colors"
									>
										<Star
											className={`w-5 h-5 ${
												star <= reviewRating
													? 'fill-amber-400 text-amber-400'
													: 'text-slate-600'
											}`}
										/>
									</button>
								))}
								<input
									type="hidden"
									name="rating"
									value={reviewRating}
								/>
							</div>
							<textarea
								name="content"
								required
								rows={3}
								placeholder="Share your thoughts about this course..."
								value={reviewContent}
								onChange={(e) =>
									setReviewContent(e.target.value)
								}
								className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"
							/>
							<div className="flex justify-end mt-3">
								<button
									type="submit"
									disabled={
										!reviewContent.trim() ||
										reviewFetcher.state === 'submitting'
									}
									className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
								>
									<Send className="w-4 h-4" />
									Submit Review
								</button>
							</div>
						</reviewFetcher.Form>
					</div>
				</div>
			) : (
				<div className="space-y-6">
					<div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-4">
						<h2 className="text-2xl font-bold text-white">
							Course Summary
						</h2>
						<p className="text-slate-400 leading-relaxed">
							{course.description}
						</p>
						<div className="space-y-3 pt-2">
							<div className="flex items-center gap-2 text-sm font-medium text-slate-300">
								<BookOpen className="w-4 h-4 text-emerald-500" />
								Modules in this course
							</div>
							<div className="space-y-3">
								{modules.map((module, index) => (
									<div
										key={module.id}
										className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-4"
									>
										<div className="flex items-start justify-between gap-4">
											<div className="min-w-0">
												<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
													Module {index + 1}
												</p>
												<p className="mt-2 text-sm text-slate-200">
													{module.title}
												</p>
											</div>
											<p className="shrink-0 text-xs text-slate-500">
												{module.lessons.length} lessons
											</p>
										</div>
										<div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
											{module.lessons.map(
												(lesson, lessonIndex) => (
													<div
														key={lesson.id}
														className="flex items-center justify-between gap-4 text-sm"
													>
														<div className="min-w-0 text-slate-300">
															<p className="truncate">
																Lesson{' '}
																{lessonIndex +
																	1}
																: {lesson.title}
															</p>
														</div>
														<p className="shrink-0 text-xs text-slate-500">
															{formatLessonLength(
																lesson.length,
															)}
														</p>
													</div>
												),
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Enroll to review */}
					<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
						<p className="text-sm text-slate-400">
							Enroll in this course to leave a review.
						</p>
					</div>
				</div>
			)}
		</div>
	)
}

function CourseDetailSkeleton() {
	return (
		<div className="space-y-8 animate-pulse">
			<div className="space-y-4">
				<div className="h-4 w-32 bg-slate-800 rounded" />
				<div className="h-10 w-3/4 bg-slate-800 rounded" />
				<div className="h-5 w-full bg-slate-800 rounded" />
			</div>
			<div className="flex gap-6 py-4 border-y border-slate-800">
				<div className="h-10 w-40 bg-slate-800 rounded-lg" />
				<div className="h-10 w-32 bg-slate-800 rounded-lg" />
				<div className="h-10 w-36 bg-slate-800 rounded-lg" />
			</div>
			<div className="h-64 bg-slate-800 rounded-xl" />
			<div className="space-y-4">
				<div className="h-6 w-48 bg-slate-800 rounded" />
				{[1, 2, 3].map((i) => (
					<div key={i} className="h-16 bg-slate-800 rounded-xl" />
				))}
			</div>
		</div>
	)
}
