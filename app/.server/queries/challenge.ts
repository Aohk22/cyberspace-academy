import { sql, eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import {
	challengeQuestions,
	challengeOptions,
	challengeSubmissions,
	usersToLessons,
} from '~/.server/database/schema'
import {
	challengeQuestionSchema,
	challengeOptionSchema,
	challengeSubmissionSchema,
} from '~/.server/database/types'

const challengeQuestionWithOptionsSchema = challengeQuestionSchema.extend({
	options: z.array(challengeOptionSchema).default([]),
	submission: challengeSubmissionSchema.nullable().default(null),
})

export type ChallengeQuestionWithOptions = z.infer<
	typeof challengeQuestionWithOptionsSchema
>

export async function getChallengeData(
	lessonId: number,
	userId: number,
): Promise<ChallengeQuestionWithOptions[]> {
	const questions = await db
		.select()
		.from(challengeQuestions)
		.where(eq(challengeQuestions.lessonId, lessonId))
		.orderBy(challengeQuestions.orderIndex)

	if (questions.length === 0) return []

	const questionIds = questions.map((q) => q.id)

	const options = await db
		.select()
		.from(challengeOptions)
		.where(inArray(challengeOptions.questionId, questionIds))
		.orderBy(challengeOptions.orderIndex)

	const submissions = await db
		.select()
		.from(challengeSubmissions)
		.where(
			and(
				inArray(challengeSubmissions.questionId, questionIds),
				eq(challengeSubmissions.userId, userId),
			),
		)

	const optionsByQuestion = new Map<number, typeof options>()
	for (const opt of options) {
		const list = optionsByQuestion.get(opt.questionId) ?? []
		list.push(opt)
		optionsByQuestion.set(opt.questionId, list)
	}

	const submissionsByQuestion = new Map<
		number,
		(typeof submissions)[number]
	>()
	for (const sub of submissions) {
		submissionsByQuestion.set(sub.questionId, sub)
	}

	return questions.map((q) => ({
		...q,
		options: optionsByQuestion.get(q.id) ?? [],
		submission: submissionsByQuestion.get(q.id) ?? null,
	}))
}

export async function submitAnswer(
	userId: number,
	questionId: number,
	answerText: string,
): Promise<{ isCorrect: boolean }> {
	const question = await db
		.select()
		.from(challengeQuestions)
		.where(eq(challengeQuestions.id, questionId))
		.limit(1)
		.then((rows) => rows[0] ?? null)

	if (question == null) {
		throw new Error('Question not found')
	}

	let isCorrect = false

	if (question.type === 'multiple_choice') {
		const selectedOption = await db
			.select()
			.from(challengeOptions)
			.where(
				and(
					eq(challengeOptions.id, parseInt(answerText)),
					eq(challengeOptions.questionId, questionId),
				),
			)
			.limit(1)
			.then((rows) => rows[0] ?? null)

		isCorrect = selectedOption?.isCorrect ?? false
	} else if (question.type === 'flag') {
		const correct = question.correctAnswer ?? ''
		isCorrect =
			answerText.trim().toLowerCase() === correct.trim().toLowerCase()
	}

	await db
		.insert(challengeSubmissions)
		.values({
			userId,
			questionId,
			answerText,
			isCorrect,
		})
		.onConflictDoUpdate({
			target: [
				challengeSubmissions.userId,
				challengeSubmissions.questionId,
			],
			set: {
				answerText,
				isCorrect,
				createdAt: sql`now()`,
			},
		})

	return { isCorrect }
}

export async function markLessonComplete(lessonId: number, userId: number) {
	await db
		.insert(usersToLessons)
		.values({
			userId,
			lessonId,
			completed: true,
		})
		.onConflictDoUpdate({
			target: [usersToLessons.userId, usersToLessons.lessonId],
			set: { completed: true },
		})
}

export async function checkAndMarkIfAllCorrect(
	lessonId: number,
	userId: number,
): Promise<boolean> {
	const questions = await db
		.select({ id: challengeQuestions.id })
		.from(challengeQuestions)
		.where(eq(challengeQuestions.lessonId, lessonId))

	if (questions.length === 0) return false

	const questionIds = questions.map((q) => q.id)

	const incorrectCount = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(challengeSubmissions)
		.where(
			and(
				inArray(challengeSubmissions.questionId, questionIds),
				eq(challengeSubmissions.userId, userId),
				eq(challengeSubmissions.isCorrect, false),
			),
		)
		.then((rows) => rows[0]?.count ?? 0)

	const answeredCount = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(challengeSubmissions)
		.where(
			and(
				inArray(challengeSubmissions.questionId, questionIds),
				eq(challengeSubmissions.userId, userId),
				eq(challengeSubmissions.isCorrect, true),
			),
		)
		.then((rows) => rows[0]?.count ?? 0)

	const allCorrect =
		incorrectCount === 0 && answeredCount === questions.length

	if (allCorrect) {
		await markLessonComplete(lessonId, userId)
	}

	return allCorrect
}
