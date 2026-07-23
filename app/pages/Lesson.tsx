import { Await, Link, redirect, useFetcher, useLoaderData } from 'react-router'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Suspense, lazy } from 'react'
import { userContext } from '~/context'
import type { Route } from './+types/Lesson'
import { NoUserContextError } from '~/error'
import { getLessonPageData } from '~/.server/queries/lesson'
import type { LessonPageData } from '~/.server/queries/lesson'
import { formatLessonLength } from '~/utils/format-course-length'
const MarkdownContent = lazy(() => import('~/components/MarkdownContent'))
import ChallengeSection from '~/components/ChallengeSection'
import {
	getChallengeData,
	submitAnswer,
	checkAndMarkIfAllCorrect,
	markLessonComplete,
} from '~/.server/queries/challenge'
import type { ChallengeQuestionWithOptions } from '~/.server/queries/challenge'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import { usersToCourses } from '~/.server/database/schema'

export async function loader({ context, params }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User resolved')
	}

	const courseId = parseInt(params.courseId)
	const lessonId = parseInt(params.lessonId)
	const userId = user.id
	if (isNaN(courseId) || isNaN(lessonId) || userId == null) {
		throw new Error('Invalid path parameter')
	}

	// Auto-enroll so the user can access lessons
	await db
		.insert(usersToCourses)
		.values({ userId, courseId })
		.onConflictDoNothing()

	return {
		dataPromise: getLessonPageData({ courseId, lessonId, userId }),
		challengeQuestionsPromise: getChallengeData(lessonId, userId),
	}
}

export async function action({ context, params, request }: Route.ActionArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User resolved')
	}

	const lessonId = parseInt(params.lessonId)
	const userId = user.id
	if (isNaN(lessonId) || userId == null) {
		throw new Error('Invalid path parameter')
	}

	const form = await request.formData()
	const intent = form.get('intent')

	if (intent === 'submit-challenge') {
		const questionId = z.coerce.number().parse(form.get('questionId'))
		const answer = z.string().parse(form.get('answer'))

		await submitAnswer(userId, questionId, answer)
		await checkAndMarkIfAllCorrect(lessonId, userId)

		return { ok: true }
	}

	if (intent === 'mark-complete') {
		await markLessonComplete(lessonId, userId)
		return { ok: true }
	}

	return { error: 'Unknown intent' }
}

export default function Lesson() {
	const { dataPromise, challengeQuestionsPromise } =
		useLoaderData<typeof loader>()

	return (
		<Suspense fallback={<LessonSkeleton />}>
			<Await resolve={dataPromise}>
				{(lessonData) => {
					if (lessonData == null) {
						return (
							<div className="rounded-xl border border-dashed border-hairline bg-surface/50 px-6 py-12 text-center">
								<h2 className="text-lg font-bold text-ink">
									Lesson not found
								</h2>
							</div>
						)
					}
					return (
						<LessonContent
							lessonData={lessonData}
							challengeQuestionsPromise={
								challengeQuestionsPromise as Promise<
									ChallengeQuestionWithOptions[]
								>
							}
						/>
					)
				}}
			</Await>
		</Suspense>
	)
}

function LessonContent({
	lessonData,
	challengeQuestionsPromise,
}: {
	lessonData: LessonPageData
	challengeQuestionsPromise: Promise<ChallengeQuestionWithOptions[]>
}) {
	const fetcher = useFetcher()
	const {
		course,
		currentLesson,
		previousLessonId,
		nextLessonId,
		completedLessonsCount,
		totalLessonsCount,
		progressPercent,
	} = lessonData

	return (
		<div className="flex flex-col text-ink">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<Link
						to={`/courses/${course.id}`}
						className="p-2 hover:bg-soft-stone rounded-full  text-ink hover:text-ink"
					>
						<ChevronLeft className="w-6 h-6" />
					</Link>
					<div>
						<h1 className="text-xl font-bold text-ink">
							{currentLesson.lessonIndex + 1}.{' '}
							{currentLesson.title}
						</h1>
						<p className="text-sm text-ink">{course.title}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{previousLessonId ? (
						<Link
							to={`/courses/${course.id}/lessons/${previousLessonId}`}
							className="px-4 py-2 border border-hairline rounded-xl text-sm font-medium text-body-muted hover:bg-soft-stone "
						>
							Previous
						</Link>
					) : (
						<span className="px-4 py-2 border border-hairline rounded-xl text-sm font-medium text-muted">
							Previous
						</span>
					)}
					{nextLessonId ? (
						<Link
							to={`/courses/${course.id}/lessons/${nextLessonId}`}
							className="px-4 py-2 bg-deep-green text-on-dark rounded-xl text-sm font-medium hover:brightness-110"
						>
							Next Lesson
						</Link>
					) : (
						<span className="px-4 py-2 bg-soft-stone text-ink rounded-xl text-sm font-medium">
							Completed
						</span>
					)}
				</div>
			</div>

			<div>
				<div className="mb-8 flex items-center justify-between gap-4 border-b border-hairline pb-4">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.18em] text-deep-green">
							{currentLesson.moduleTitle}
						</p>
						<h2 className="mt-2 text-2xl font-bold text-ink">
							{currentLesson.title}
						</h2>
						<p className="mt-2 text-sm text-ink">
							{completedLessonsCount}/{totalLessonsCount} lessons
							completed • {progressPercent}% progress
						</p>
					</div>
					<div className="shrink-0 rounded-xl border border-hairline bg-soft-stone/50 px-4 py-2 text-sm font-medium text-body-muted">
						{formatLessonLength(currentLesson.length)}
					</div>
				</div>

				<Suspense
					fallback={
						<div className="h-96 bg-soft-stone rounded-xl animate-pulse" />
					}
				>
					<MarkdownContent content={currentLesson.contentMd} />
				</Suspense>

				<Suspense
					fallback={
						<div className="mt-10 border-t border-hairline pt-8">
							<div className="h-11 w-40 bg-soft-stone rounded-xl animate-pulse" />
						</div>
					}
				>
					<Await resolve={challengeQuestionsPromise}>
						{(challengeQuestions) => {
							const hasChallenges = challengeQuestions.length > 0
							return hasChallenges ? (
								<ChallengeSection
									questions={challengeQuestions}
									lessonId={currentLesson.id}
								/>
							) : currentLesson.completed ? (
								<div className="mt-10 border-t border-hairline pt-8">
									<span className="inline-flex items-center gap-2 rounded-xl bg-deep-green/20 px-5 py-3 text-sm font-medium text-deep-green">
										<CheckCircle2 className="w-4 h-4" />
										Completed
									</span>
								</div>
							) : (
								<div className="mt-10 border-t border-hairline pt-8">
									<fetcher.Form method="post">
										<input
											type="hidden"
											name="intent"
											value="mark-complete"
										/>
										<button
											type="submit"
											disabled={fetcher.state !== 'idle'}
											className="inline-flex items-center gap-2 rounded-xl bg-deep-green px-5 py-3 text-sm font-medium text-on-dark hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<CheckCircle2 className="w-4 h-4" />
											{fetcher.state !== 'idle'
												? 'Completing…'
												: 'Mark as Complete'}
										</button>
									</fetcher.Form>
								</div>
							)
						}}
					</Await>
				</Suspense>
			</div>
		</div>
	)
}

function LessonSkeleton() {
	return (
		<div className="flex flex-col animate-pulse">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<div className="w-10 h-10 bg-soft-stone rounded-full" />
					<div className="space-y-2">
						<div className="h-5 w-64 bg-soft-stone rounded" />
						<div className="h-4 w-32 bg-soft-stone rounded" />
					</div>
				</div>
				<div className="flex gap-2">
					<div className="h-10 w-24 bg-soft-stone rounded-xl" />
					<div className="h-10 w-28 bg-soft-stone rounded-xl" />
				</div>
			</div>
			<div className="space-y-4">
				<div className="h-4 w-32 bg-soft-stone rounded" />
				<div className="h-8 w-3/4 bg-soft-stone rounded" />
				<div className="h-4 w-48 bg-soft-stone rounded" />
				<div className="h-96 bg-soft-stone rounded-xl" />
			</div>
		</div>
	)
}
