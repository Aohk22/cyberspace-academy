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
							<div className="rounded-xl border border-dashed border-foreground-elevated bg-foreground/50 px-6 py-12 text-center">
								<h2 className="text-lg font-bold text-foreground-text">
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
		<div className="flex flex-col text-background-text">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<Link
						to={`/courses/${course.id}`}
						className="p-2 hover:bg-foreground-elevated rounded-full  text-foreground-text hover:text-foreground-text"
					>
						<ChevronLeft className="w-6 h-6" />
					</Link>
					<div>
						<h1 className="text-xl font-bold text-foreground-text">
							{currentLesson.lessonIndex + 1}.{' '}
							{currentLesson.title}
						</h1>
						<p className="text-sm text-foreground-text">{course.title}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{previousLessonId ? (
						<Link
							to={`/courses/${course.id}/lessons/${previousLessonId}`}
							className="px-4 py-2 border border-foreground-elevated rounded-xl text-sm font-medium text-foreground-text-secondary hover:bg-foreground-elevated "
						>
							Previous
						</Link>
					) : (
						<span className="px-4 py-2 border border-foreground-elevated rounded-xl text-sm font-medium text-foreground-text-muted">
							Previous
						</span>
					)}
					{nextLessonId ? (
						<Link
							to={`/courses/${course.id}/lessons/${nextLessonId}`}
							className="px-4 py-2 bg-primary text-foreground-text rounded-xl text-sm font-medium hover:bg-primary "
						>
							Next Lesson
						</Link>
					) : (
						<span className="px-4 py-2 bg-foreground-elevated text-foreground-text rounded-xl text-sm font-medium">
							Completed
						</span>
					)}
				</div>
			</div>

			<div>
				<div className="mb-8 flex items-center justify-between gap-4 border-b border-foreground-elevated pb-4">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
							{currentLesson.moduleTitle}
						</p>
						<h2 className="mt-2 text-2xl font-bold text-foreground-text">
							{currentLesson.title}
						</h2>
						<p className="mt-2 text-sm text-foreground-text">
							{completedLessonsCount}/{totalLessonsCount} lessons
							completed • {progressPercent}% progress
						</p>
					</div>
					<div className="shrink-0 rounded-xl border border-foreground-elevated bg-foreground-elevated/50 px-4 py-2 text-sm font-medium text-foreground-text-secondary">
						{formatLessonLength(currentLesson.length)}
					</div>
				</div>

				<Suspense
					fallback={
						<div className="h-96 bg-foreground-elevated rounded-xl animate-pulse" />
					}
				>
					<MarkdownContent content={currentLesson.contentMd} />
				</Suspense>

				<Suspense
					fallback={
						<div className="mt-10 border-t border-foreground-elevated pt-8">
							<div className="h-11 w-40 bg-foreground-elevated rounded-xl animate-pulse" />
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
								<div className="mt-10 border-t border-foreground-elevated pt-8">
									<span className="inline-flex items-center gap-2 rounded-xl bg-primary/20 px-5 py-3 text-sm font-medium text-primary">
										<CheckCircle2 className="w-4 h-4" />
										Completed
									</span>
								</div>
							) : (
								<div className="mt-10 border-t border-foreground-elevated pt-8">
									<fetcher.Form method="post">
										<input
											type="hidden"
											name="intent"
											value="mark-complete"
										/>
										<button
											type="submit"
											disabled={
												fetcher.state !== 'idle'
											}
											className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-foreground-text hover:bg-primary  disabled:opacity-50 disabled:cursor-not-allowed"
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
					<div className="w-10 h-10 bg-foreground-elevated rounded-full" />
					<div className="space-y-2">
						<div className="h-5 w-64 bg-foreground-elevated rounded" />
						<div className="h-4 w-32 bg-foreground-elevated rounded" />
					</div>
				</div>
				<div className="flex gap-2">
					<div className="h-10 w-24 bg-foreground-elevated rounded-xl" />
					<div className="h-10 w-28 bg-foreground-elevated rounded-xl" />
				</div>
			</div>
			<div className="space-y-4">
				<div className="h-4 w-32 bg-foreground-elevated rounded" />
				<div className="h-8 w-3/4 bg-foreground-elevated rounded" />
				<div className="h-4 w-48 bg-foreground-elevated rounded" />
				<div className="h-96 bg-foreground-elevated rounded-xl" />
			</div>
		</div>
	)
}
