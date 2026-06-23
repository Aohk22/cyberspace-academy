import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import {
	courseSchema,
	lessonSchema,
	moduleSchema,
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

export async function getCourseDetailData(
	courseId: number,
	userId: number,
): Promise<{ enrolled: boolean; course: CourseDetails } | null> {
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
			INNER JOIN users_to_lessons utl 
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

	// Group flat rows into nested structure
	const grouped = rows.reduce(
		(acc, row) => {
			// Accumulate the courses.
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

			// Accumulate the modules.
			if (!acc[row.courseId].modules[row.moduleId]) {
				acc[row.courseId].modules[row.moduleId] = {
					id: row.moduleId,
					title: row.moduleTitle,
					courseId: row.courseId,
					lessons: [],
				}
			}

			// Accumulate the lessons
			acc[row.courseId].modules[row.moduleId].lessons.push({
				id: row.lessonId,
				title: row.lessonTitle,
				length: row.lessonLength,
				contentMd: row.lessonContentMd,
				moduleId: row.moduleId,

				completed: row.lessonCompleted, // This the extra parameter.
			})

			return acc
		},
		{} as Record<string, any>,
	)

	// console.dir(grouped, { depth: null })

	// Flatten modules from object to array
	const flatten = Object.values(grouped).map((c: any) => ({
		...c,
		modules: Object.values(c.modules),
	}))[0]

	console.dir(flatten, { depth: null })

	const course = z.parse(courseDetailsGroupedSchema, flatten)
	return { enrolled, course }
}
