import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import {
	learningPathWithCountSchema,
	type LearningPathWithCount,
	type PathCourseEntry,
	type LearningPathDetail,
} from '~/.server/database/types'

const pathCourseRowSchema = z.object({
	position: z.coerce.number(),
	courseId: z.coerce.number(),
	title: z.string(),
	description: z.string(),
	thumbnail: z.string().nullable(),
	length: z.coerce.number(),
	lessonsCount: z.coerce.number(),
	enrolled: z
		.union([z.boolean(), z.string()])
		.transform((v) => v === true || v === 'true'),
})

export async function getLearningPaths(): Promise<LearningPathWithCount[]> {
	const res = await db.execute(sql`
		SELECT
			lp.id,
			lp.title,
			lp.description,
			lp.thumbnail,
			lp.created_at AS "createdAt",
			COUNT(pc.course_id)::int AS "coursesCount",
			COALESCE(SUM(c.length), 0)::int AS "totalDuration"
		FROM learning_paths lp
		LEFT JOIN path_courses pc ON lp.id = pc.path_id
		LEFT JOIN courses c ON pc.course_id = c.id
		GROUP BY lp.id
		ORDER BY lp.id
	`)

	return z.array(learningPathWithCountSchema).parse(res.rows)
}

export async function getLearningPathDetail(
	pathId: number,
	userId?: number,
): Promise<LearningPathDetail | null> {
	const pathRes = await db.execute(sql`
		SELECT
			lp.id,
			lp.title,
			lp.description,
			lp.thumbnail,
			lp.created_at AS "createdAt",
			COUNT(pc.course_id)::int AS "coursesCount",
			COALESCE(SUM(c.length), 0)::int AS "totalDuration"
		FROM learning_paths lp
		LEFT JOIN path_courses pc ON lp.id = pc.path_id
		LEFT JOIN courses c ON pc.course_id = c.id
		WHERE lp.id = ${pathId}
		GROUP BY lp.id
	`)

	if (pathRes.rows.length === 0) return null

	const path = z.parse(learningPathWithCountSchema, pathRes.rows[0])

	const courseRes = await db.execute(sql`
		SELECT
			pc.position,
			c.id AS "courseId",
			c.title,
			c.description,
			c.thumbnail,
			c.length,
			(SELECT COUNT(*)::int FROM lessons l
			 INNER JOIN modules m ON l.module_id = m.id
			 WHERE m.course_id = c.id) AS "lessonsCount"
			${
				userId != null
					? sql`,EXISTS(SELECT 1 FROM users_to_courses utc WHERE utc.course_id = c.id AND utc.user_id = ${userId}) AS "enrolled"`
					: sql`,false AS "enrolled"`
			}
		FROM path_courses pc
		INNER JOIN courses c ON pc.course_id = c.id
		WHERE pc.path_id = ${pathId}
		ORDER BY pc.position
	`)

	const courses = z.array(pathCourseRowSchema).parse(courseRes.rows)

	return { ...path, courses }
}
