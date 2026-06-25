import { eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import {
	challengeOptions,
	challengeQuestions,
	lessons,
	modules,
} from '~/.server/database/schema'

const exportQuestionOptionSchema = z.object({
	optionText: z.string(),
	isCorrect: z.boolean(),
})

const exportQuestionSchema = z.object({
	questionText: z.string(),
	type: z.string(),
	correctAnswer: z.string().nullable(),
	options: z.array(exportQuestionOptionSchema),
})

const exportLessonSchema = z.object({
	title: z.string(),
	length: z.number(),
	contentMd: z.string(),
	challengeQuestions: z.array(exportQuestionSchema),
})

const exportModuleSchema = z.object({
	title: z.string(),
	lessons: z.array(exportLessonSchema),
})

const exportCourseSchema = z.object({
	title: z.string(),
	description: z.string(),
	instructor: z.string(),
	thumbnail: z.string(),
	length: z.number(),
	categoryId: z.number(),
	categoryName: z.string().optional(),
	modules: z.array(exportModuleSchema),
})

export type CourseExport = z.infer<typeof exportCourseSchema>

export async function getCourseExportData(
	courseId: number,
): Promise<CourseExport | null> {
	const courseRes = await db.execute(sql`
		SELECT
			c.title,
			c.description,
			c.instructor,
			c.thumbnail,
			c.length,
			c.category_id AS "categoryId",
			cat.name AS "categoryName"
		FROM courses c
		INNER JOIN categories cat ON c.category_id = cat.id
		WHERE c.id = ${courseId}
	`)

	if (courseRes.rows.length === 0) return null

	const course = courseRes.rows[0] as any

	const moduleRows = await db
		.select({ id: modules.id, title: modules.title })
		.from(modules)
		.where(eq(modules.courseId, courseId))
		.orderBy(modules.id)

	const lessonRows = await db
		.select({
			id: lessons.id,
			title: lessons.title,
			length: lessons.length,
			contentMd: lessons.contentMd,
			moduleId: lessons.moduleId,
		})
		.from(lessons)
		.innerJoin(modules, eq(lessons.moduleId, modules.id))
		.where(eq(modules.courseId, courseId))
		.orderBy(lessons.id)

	const lessonIds = lessonRows.map((l) => l.id)
	let questionsByLesson = new Map<
		number,
		{
			questionText: string
			type: string
			correctAnswer: string | null
			options: { optionText: string; isCorrect: boolean }[]
		}[]
	>()

	if (lessonIds.length > 0) {
		const questionRows = await db
			.select()
			.from(challengeQuestions)
			.where(inArray(challengeQuestions.lessonId, lessonIds))
			.orderBy(challengeQuestions.orderIndex)

		const questionIds = questionRows.map((q) => q.id)

		const optionsByQuestion = new Map<
			number,
			{ optionText: string; isCorrect: boolean }[]
		>()

		if (questionIds.length > 0) {
			const optionRows = await db
				.select()
				.from(challengeOptions)
				.where(inArray(challengeOptions.questionId, questionIds))
				.orderBy(challengeOptions.orderIndex)

			for (const opt of optionRows) {
				const list = optionsByQuestion.get(opt.questionId) ?? []
				list.push({
					optionText: opt.optionText,
					isCorrect: opt.isCorrect,
				})
				optionsByQuestion.set(opt.questionId, list)
			}
		}

		for (const q of questionRows) {
			const list = questionsByLesson.get(q.lessonId) ?? []
			list.push({
				questionText: q.questionText,
				type: q.type,
				correctAnswer: q.correctAnswer,
				options: optionsByQuestion.get(q.id) ?? [],
			})
			questionsByLesson.set(q.lessonId, list)
		}
	}

	const lessonsByModule = new Map<
		number,
		{
			title: string
			length: number
			contentMd: string
			challengeQuestions: any[]
		}[]
	>()
	for (const lesson of lessonRows) {
		const list = lessonsByModule.get(lesson.moduleId) ?? []
		list.push({
			title: lesson.title,
			length: lesson.length,
			contentMd: lesson.contentMd,
			challengeQuestions: questionsByLesson.get(lesson.id) ?? [],
		})
		lessonsByModule.set(lesson.moduleId, list)
	}

	const result: CourseExport = {
		title: course.title,
		description: course.description,
		instructor: course.instructor,
		thumbnail: course.thumbnail,
		length: course.length,
		categoryId: course.categoryId,
		categoryName: course.categoryName,
		modules: moduleRows.map((m) => ({
			title: m.title,
			lessons: lessonsByModule.get(m.id) ?? [],
		})),
	}

	return exportCourseSchema.parse(result)
}
