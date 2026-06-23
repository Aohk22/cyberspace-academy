import { Await, Link, redirect, useLoaderData } from 'react-router'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Suspense } from 'react'
import { userContext } from '~/context'
import type { Route } from './+types/Lesson'
import { NoUserContextError } from '~/error'
import { getLessonPageData } from '~/.server/queries/lesson'
import type { LessonPageData } from '~/.server/queries/lesson'
import { formatLessonLength } from '~/utils/format-course-length'
import MarkdownContent from '~/components/MarkdownContent'
import ChallengeSection from '~/components/ChallengeSection'
import {
	getChallengeData,
	submitAnswer,
	checkAndMarkIfAllCorrect,
	markLessonComplete,
} from '~/.server/queries/challenge'
import type { ChallengeQuestionWithOptions } from '~/.server/queries/challenge'
import { z } from 'zod'

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
							<div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-12 text-center">
								<h2 className="text-lg font-bold text-white">
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
		<div className="flex flex-col text-slate-200">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<Link
						to={`/courses/${course.id}`}
						className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
					>
						<ChevronLeft className="w-6 h-6" />
					</Link>
					<div>
						<h1 className="text-xl font-bold text-white">
							{currentLesson.lessonIndex + 1}.{' '}
							{currentLesson.title}
						</h1>
						<p className="text-sm text-slate-400">{course.title}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{previousLessonId ? (
						<Link
							to={`/courses/${course.id}/lessons/${previousLessonId}`}
							className="px-4 py-2 border border-slate-800 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
						>
							Previous
						</Link>
					) : (
						<span className="px-4 py-2 border border-slate-800 rounded-xl text-sm font-medium text-slate-500">
							Previous
						</span>
					)}
					{nextLessonId ? (
						<Link
							to={`/courses/${course.id}/lessons/${nextLessonId}`}
							className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
						>
							Next Lesson
						</Link>
					) : (
						<span className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm font-medium">
							Completed
						</span>
					)}
				</div>
			</div>

			<div>
				<div className="mb-8 flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
							{currentLesson.moduleTitle}
						</p>
						<h2 className="mt-2 text-2xl font-bold text-white">
							{currentLesson.title}
						</h2>
						<p className="mt-2 text-sm text-slate-400">
							{completedLessonsCount}/{totalLessonsCount} lessons
							completed • {progressPercent}% progress
						</p>
					</div>
					<div className="shrink-0 rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300">
						{formatLessonLength(currentLesson.length)}
					</div>
				</div>

				<MarkdownContent content={currentLesson.contentMd} />

				<Suspense
					fallback={
						<div className="mt-10 border-t border-slate-800 pt-8">
							<div className="h-11 w-40 bg-slate-800 rounded-xl animate-pulse" />
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
							) : (
								<div className="mt-10 border-t border-slate-800 pt-8">
									<form method="post">
										<input
											type="hidden"
											name="intent"
											value="mark-complete"
										/>
										<button
											type="submit"
											className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
										>
											<CheckCircle2 className="w-4 h-4" />
											Mark as Complete
										</button>
									</form>
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
					<div className="w-10 h-10 bg-slate-800 rounded-full" />
					<div className="space-y-2">
						<div className="h-5 w-64 bg-slate-800 rounded" />
						<div className="h-4 w-32 bg-slate-800 rounded" />
					</div>
				</div>
				<div className="flex gap-2">
					<div className="h-10 w-24 bg-slate-800 rounded-xl" />
					<div className="h-10 w-28 bg-slate-800 rounded-xl" />
				</div>
			</div>
			<div className="space-y-4">
				<div className="h-4 w-32 bg-slate-800 rounded" />
				<div className="h-8 w-3/4 bg-slate-800 rounded" />
				<div className="h-4 w-48 bg-slate-800 rounded" />
				<div className="h-96 bg-slate-800 rounded-xl" />
			</div>
		</div>
	)
}
