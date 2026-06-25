import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import {
	courseSchema,
	moduleSchema,
	lessonSchema,
} from '~/.server/database/types'

const courseDetailsSchema = z.object({
	courseId: z.coerce.number(),
	courseTitle: z.string(),
	courseDescription: z.string(),
	courseInstructor: z.string(),
	courseThumbnail: z.string(),
	courseLength: z.coerce.number(),

	categoryId: z.coerce.number(),

	moduleId: z.coerce.number(),
	moduleTitle: z.string(),

	lessonId: z.coerce.number(),
	lessonTitle: z.string(),
	lessonLength: z.coerce.number(),
	lessonContentMd: z.string(),
	lessonCompleted: z.boolean().optional(),
})

const courseDetailsGroupedSchema = courseSchema.extend({
	modules: z.array(
		moduleSchema.extend({
			lessons: z.array(
				lessonSchema.extend({
					completed: z.boolean().optional(),
				}),
			),
		}),
	),
})

export type CourseDetails = z.infer<typeof courseDetailsGroupedSchema>

export type CourseDetailResult = {
	enrolled: boolean
	course: CourseDetails
	averageRating: number | null
	reviewCount: number
	studentCount: number
}

export async function getCourseDetailData(
	courseId: number,
	userId: number,
): Promise<CourseDetailResult | null> {
	const enrolled =
		(
			await db.execute(sql`
			SELECT * FROM users_to_courses 
			WHERE user_id = ${userId} AND course_id = ${courseId}
		`)
		).rows.length > 0

	const res = await db.execute(sql`
		SELECT
			c.id AS "courseId",
			c.title AS "courseTitle",
			c.description AS "courseDescription",
			c.instructor AS "courseInstructor",
			c.thumbnail AS "courseThumbnail",
			c.length AS "courseLength",

			cat.id AS "categoryId",

			m.id AS "moduleId",
			m.title AS "moduleTitle",

			l.id AS "lessonId",
			l.title AS "lessonTitle",
			l.length AS "lessonLength",
			l.content_md AS "lessonContentMd"
			${enrolled ? sql`,utl.completed AS "lessonCompleted"` : sql``}
		FROM courses c
		INNER JOIN categories cat ON c.category_id = cat.id
		INNER JOIN modules m ON c.id = m.course_id
		INNER JOIN lessons l ON m.id = l.module_id 
		${
			enrolled
				? sql`
			LEFT JOIN users_to_lessons utl 
			ON utl.lesson_id = l.id AND utl.user_id = ${userId}
			`
				: sql``
		}
		WHERE c.id = ${courseId}
		ORDER BY m.id, l.id
	`)

	if (res.rows.length === 0) {
		return null
	}

	const rows = z.array(courseDetailsSchema).parse(res.rows)

	const grouped = rows.reduce(
		(acc, row) => {
			if (!acc[row.courseId]) {
				acc[row.courseId] = {
					id: row.courseId,
					title: row.courseTitle,
					description: row.courseDescription,
					instructor: row.courseInstructor,
					thumbnail: row.courseThumbnail,
					length: row.courseLength,
					categoryId: row.categoryId,
					modules: {},
				}
			}

			if (!acc[row.courseId].modules[row.moduleId]) {
				acc[row.courseId].modules[row.moduleId] = {
					id: row.moduleId,
					title: row.moduleTitle,
					courseId: row.courseId,
					lessons: [],
				}
			}

			acc[row.courseId].modules[row.moduleId].lessons.push({
				id: row.lessonId,
				title: row.lessonTitle,
				length: row.lessonLength,
				contentMd: row.lessonContentMd,
				moduleId: row.moduleId,
				completed: row.lessonCompleted,
			})

			return acc
		},
		{} as Record<string, any>,
	)

	const flatten = Object.values(grouped).map((c: any) => ({
		...c,
		modules: Object.values(c.modules),
	}))[0]

	const course = z.parse(courseDetailsGroupedSchema, flatten)

	const [reviewStats, studentCountResult] = await Promise.all([
		db.execute(sql`
			SELECT
				ROUND(AVG(r.rating)::numeric, 1) AS "averageRating",
				COUNT(*)::int AS "reviewCount"
			FROM reviews r
			WHERE r.course_id = ${courseId}
		`),
		db.execute(sql`
			SELECT COUNT(*)::int AS "count"
			FROM users_to_courses
			WHERE course_id = ${courseId}
		`),
	])

	const averageRating = (
		reviewStats.rows[0] as { averageRating: string | null }
	).averageRating
	const reviewCount = Number(
		(reviewStats.rows[0] as { reviewCount: number }).reviewCount,
	)
	const studentCount = Number(
		(studentCountResult.rows[0] as { count: number }).count,
	)

	return {
		enrolled,
		course,
		averageRating: averageRating ? Number(averageRating) : null,
		reviewCount,
		studentCount,
	}
}
