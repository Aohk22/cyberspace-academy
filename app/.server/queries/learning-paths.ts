import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import {
	learningPathWithCountSchema,
	roadmapItemSchema,
	type LearningPathWithCount,
} from '~/.server/database/types'
import type { LearningPathDetail } from '~/.server/database/types'

export async function getLearningPaths(
	userId: number,
): Promise<LearningPathWithCount[]> {
	const res = await db.execute(sql`
		SELECT
			lp.id,
			lp.title,
			lp.description,
			lp.thumbnail,
			lp.tags,
			lp.time_to_complete AS "timeToComplete",
			lp.created_at AS "createdAt",
			COUNT(DISTINCT pc.course_id)::int AS "coursesCount",
			COALESCE(SUM(c.length), 0)::int AS "totalDuration",
			COALESCE(up.user_id IS NOT NULL, false) AS "tracked",
			0 AS "progress"
		FROM learning_paths lp
		LEFT JOIN path_courses pc ON lp.id = pc.path_id
		LEFT JOIN courses c ON pc.course_id = c.id
		LEFT JOIN user_paths up ON up.path_id = lp.id AND up.user_id = ${userId}
		GROUP BY lp.id, up.user_id
		ORDER BY lp.id
	`)

	const paths = z.array(learningPathWithCountSchema).parse(res.rows)

	const totalsRes = await db.execute(sql`
		SELECT
			pc.path_id AS "pathId",
			COUNT(*)::int AS "total"
		FROM path_courses pc
		GROUP BY pc.path_id

		UNION ALL

		SELECT
			pch.path_id AS "pathId",
			COUNT(*)::int AS "total"
		FROM path_challenges pch
		GROUP BY pch.path_id
	`)

	const totalMap = new Map<number, number>()
	for (const row of totalsRes.rows) {
		const r = row as { pathId: number; total: number }
		totalMap.set(r.pathId, (totalMap.get(r.pathId) ?? 0) + r.total)
	}

	const completedRes = await db.execute(sql`
		SELECT
			pc.path_id AS "pathId",
			COUNT(*)::int AS "completed"
		FROM path_courses pc
		INNER JOIN users_to_courses utc ON utc.course_id = pc.course_id AND utc.user_id = ${userId}
		GROUP BY pc.path_id

		UNION ALL

		SELECT
			pch.path_id AS "pathId",
			COUNT(*)::int AS "completed"
		FROM path_challenges pch
		INNER JOIN user_challenges uc ON uc.challenge_id = pch.challenge_id AND uc.user_id = ${userId}
		GROUP BY pch.path_id
	`)

	const completedMap = new Map<number, number>()
	for (const row of completedRes.rows) {
		const r = row as { pathId: number; completed: number }
		completedMap.set(
			r.pathId,
			(completedMap.get(r.pathId) ?? 0) + r.completed,
		)
	}

	const roadmapRes = await db.execute(sql`
		SELECT
			pc.path_id AS "pathId",
			pc.position,
			'course' AS "type",
			c.title,
			COALESCE(utc.user_id IS NOT NULL, false) AS "completed",
			c.id AS "targetId"
		FROM path_courses pc
		INNER JOIN courses c ON pc.course_id = c.id
		LEFT JOIN users_to_courses utc ON utc.course_id = c.id AND utc.user_id = ${userId}

		UNION ALL

		SELECT
			pch.path_id AS "pathId",
			pch.position,
			'challenge' AS "type",
			ch.name AS "title",
			COALESCE(uc.user_id IS NOT NULL, false) AS "completed",
			ch.id AS "targetId"
		FROM path_challenges pch
		INNER JOIN challenges ch ON pch.challenge_id = ch.id
		LEFT JOIN user_challenges uc ON uc.challenge_id = ch.id AND uc.user_id = ${userId}

		ORDER BY "pathId", "type", position
	`)

	const roadmapByPath = new Map<
		number,
		{
			position: number
			type: 'course' | 'challenge'
			title: string
			completed: boolean
			targetId: number
		}[]
	>()
	for (const row of roadmapRes.rows) {
		const r = row as {
			pathId: number
			position: number
			type: 'course' | 'challenge'
			title: string
			completed: boolean | string
			targetId: number
		}
		const items = roadmapByPath.get(r.pathId) ?? []
		items.push({
			position: r.position,
			type: r.type,
			title: r.title,
			completed: r.completed === true || r.completed === 'true',
			targetId: r.targetId,
		})
		roadmapByPath.set(r.pathId, items)
	}

	for (const path of paths) {
		const total = totalMap.get(path.id) ?? 0
		const completed = completedMap.get(path.id) ?? 0
		path.progress = total > 0 ? Math.round((completed / total) * 100) : 0
		path.roadmap = roadmapByPath.get(path.id) ?? []
	}

	return paths
}

export async function getLearningPathDetail(
	pathId: number,
	userId: number,
): Promise<LearningPathDetail | null> {
	const pathRes = await db.execute(sql`
		SELECT
			lp.id,
			lp.title,
			lp.description,
			lp.thumbnail,
			lp.tags,
			lp.time_to_complete AS "timeToComplete",
			lp.created_at AS "createdAt",
			COUNT(DISTINCT pc.course_id)::int AS "coursesCount",
			COALESCE(SUM(c.length), 0)::int AS "totalDuration",
			COALESCE(up.user_id IS NOT NULL, false) AS "tracked",
			0 AS "progress"
		FROM learning_paths lp
		LEFT JOIN path_courses pc ON lp.id = pc.path_id
		LEFT JOIN courses c ON pc.course_id = c.id
		LEFT JOIN user_paths up ON up.path_id = lp.id AND up.user_id = ${userId}
		WHERE lp.id = ${pathId}
		GROUP BY lp.id, up.user_id
	`)

	if (pathRes.rows.length === 0) return null

	const path = z.parse(learningPathWithCountSchema, pathRes.rows[0])

	const totalItemsRes = await db.execute(sql`
		SELECT COUNT(*)::int AS "total"
		FROM (
			SELECT 1 FROM path_courses WHERE path_id = ${pathId}
			UNION ALL
			SELECT 1 FROM path_challenges WHERE path_id = ${pathId}
		) t
	`)

	const completedItemsRes = await db.execute(sql`
		SELECT COUNT(*)::int AS "completed"
		FROM (
			SELECT 1 FROM path_courses pc
			INNER JOIN users_to_courses utc ON utc.course_id = pc.course_id AND utc.user_id = ${userId}
			WHERE pc.path_id = ${pathId}
			UNION ALL
			SELECT 1 FROM path_challenges pch
			INNER JOIN user_challenges uc ON uc.challenge_id = pch.challenge_id AND uc.user_id = ${userId}
			WHERE pch.path_id = ${pathId}
		) t
	`)

	const total = (totalItemsRes.rows[0] as { total: number }).total
	const completed = (completedItemsRes.rows[0] as { completed: number })
		.completed
	path.progress = total > 0 ? Math.round((completed / total) * 100) : 0

	const [coursesRes, challengesRes] = await Promise.all([
		db.execute(sql`
			SELECT
				'course' AS "type",
				pc.position,
				c.id AS "courseId",
				c.title,
				c.description,
				c.thumbnail,
				c.length,
				(SELECT COUNT(*)::int FROM lessons l
				 INNER JOIN modules m ON l.module_id = m.id
				 WHERE m.course_id = c.id) AS "lessonsCount",
				COALESCE(EXISTS(
					SELECT 1 FROM users_to_courses utc
					WHERE utc.course_id = c.id AND utc.user_id = ${userId}
				), false) AS "completed"
			FROM path_courses pc
			INNER JOIN courses c ON pc.course_id = c.id
			WHERE pc.path_id = ${pathId}
		`),
		db.execute(sql`
			SELECT
				'challenge' AS "type",
				pch.position,
				ch.id AS "challengeId",
				ch.name,
				ch.description,
				ch.difficulty,
				ch.category,
				ch.points,
				COALESCE(EXISTS(
					SELECT 1 FROM user_challenges uc
					WHERE uc.challenge_id = ch.id AND uc.user_id = ${userId}
				), false) AS "completed"
			FROM path_challenges pch
			INNER JOIN challenges ch ON pch.challenge_id = ch.id
			WHERE pch.path_id = ${pathId}
		`),
	])

	const roadmap = z.array(roadmapItemSchema).parse(
		(
			[...coursesRes.rows, ...challengesRes.rows] as {
				type: string
				position: number
			}[]
		).sort(
			(a, b) => a.type.localeCompare(b.type) || a.position - b.position,
		),
	)

	return { ...path, roadmap }
}

export async function toggleTrackPath(
	pathId: number,
	userId: number,
): Promise<{ tracked: boolean }> {
	const existing = await db.execute(sql`
		SELECT 1 FROM user_paths
		WHERE user_id = ${userId} AND path_id = ${pathId}
	`)

	if (existing.rows.length > 0) {
		await db.execute(sql`
			DELETE FROM user_paths
			WHERE user_id = ${userId} AND path_id = ${pathId}
		`)
		return { tracked: false }
	}

	await db.execute(sql`
		INSERT INTO user_paths (user_id, path_id)
		VALUES (${userId}, ${pathId})
		ON CONFLICT DO NOTHING
	`)
	return { tracked: true }
}
