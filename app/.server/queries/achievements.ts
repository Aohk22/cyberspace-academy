import { sql } from 'drizzle-orm'
import { db } from '../database/connection'
import { z } from 'zod'
import { badges, userBadges } from '../database/schema'

const achievementStatsSchema = z.object({
	points: z.coerce.number(),
	challengesSolved: z.coerce.number(),
	lessonsCompleted: z.coerce.number(),
	coursesCompleted: z.coerce.number(),
})

export type AchievementStats = z.infer<typeof achievementStatsSchema>

const badgeSchema = z.object({
	id: z.coerce.number(),
	name: z.string(),
	description: z.string(),
	icon: z.string(),
	rarity: z.string(),
	criteriaType: z.string(),
	criteriaValue: z.coerce.number(),
	criteriaMeta: z.string().nullable(),
	earned: z.coerce.boolean(),
	awardedAt: z.coerce.date().nullable(),
	progress: z.coerce.number(),
})

export type AchievementBadge = z.infer<typeof badgeSchema>

const recentActivitySchema = z.object({
	id: z.coerce.number(),
	name: z.string(),
	category: z.string(),
	points: z.coerce.number(),
	completedAt: z.coerce.date(),
})

export type RecentActivity = z.infer<typeof recentActivitySchema>

const leaderboardEntrySchema = z.object({
	id: z.coerce.number(),
	name: z.string(),
	points: z.coerce.number(),
	rank: z.coerce.number(),
	isCurrentUser: z.coerce.boolean(),
})

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>

export type AchievementsData = {
	stats: AchievementStats
	badges: AchievementBadge[]
	recentActivity: RecentActivity[]
	leaderboard: LeaderboardEntry[]
}

export async function getAchievementsData(
	userId: number,
): Promise<AchievementsData> {
	const statsRes = await db.execute(sql`
		SELECT
			u.achievement_points AS "points",
			(SELECT COUNT(*) FROM user_challenges uc WHERE uc.user_id = u.id)::int AS "challengesSolved",
			(SELECT COUNT(*) FROM users_to_lessons utl WHERE utl.user_id = u.id AND utl.completed = true)::int AS "lessonsCompleted",
			(SELECT COUNT(DISTINCT utc.course_id)::int FROM users_to_courses utc
				WHERE utc.user_id = u.id
				AND NOT EXISTS (
					SELECT 1 FROM users_to_lessons utl
					INNER JOIN lessons l ON l.id = utl.lesson_id
					INNER JOIN modules m ON m.id = l.module_id
					WHERE m.course_id = utc.course_id
					AND (utl.user_id <> utc.user_id OR utl.completed = false)
				)) AS "coursesCompleted"
		FROM users u
		WHERE u.id = ${userId}
	`)

	const stats = achievementStatsSchema.parse(statsRes.rows[0] ?? {})

	const badgesRes = await db.execute(sql`
		SELECT
			b.id, b.name, b.description, b.icon, b.rarity,
			b."criteriaType" AS "criteriaType",
			b.criteria_value AS "criteriaValue",
			b."criteriaMeta" AS "criteriaMeta",
			(ub.user_id IS NOT NULL) AS "earned",
			ub.awarded_at AS "awardedAt",
			CASE b."criteriaType"
				WHEN 'challenges_solved' THEN
					(SELECT COUNT(*) FROM user_challenges uc WHERE uc.user_id = ${userId})::int
				WHEN 'lessons_completed' THEN
					(SELECT COUNT(*) FROM users_to_lessons utl WHERE utl.user_id = ${userId} AND utl.completed = true)::int
				WHEN 'points_total' THEN
					(SELECT achievement_points FROM users WHERE id = ${userId})::int
				WHEN 'courses_completed' THEN
					(SELECT COUNT(DISTINCT utc.course_id)::int FROM users_to_courses utc
						WHERE utc.user_id = ${userId}
						AND NOT EXISTS (
							SELECT 1 FROM users_to_lessons utl
							INNER JOIN lessons l ON l.id = utl.lesson_id
							INNER JOIN modules m ON m.id = l.module_id
							WHERE m.course_id = utc.course_id
							AND (utl.user_id <> utc.user_id OR utl.completed = false)
						))
				WHEN 'challenges_category' THEN
					(SELECT COUNT(*) FROM user_challenges uc
						INNER JOIN challenges c ON c.id = uc.challenge_id
						WHERE uc.user_id = ${userId} AND c.category = b."criteriaMeta")::int
				ELSE 0
			END AS "progress"
		FROM badges b
		LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ${userId}
		ORDER BY b.criteria_value ASC, b.id ASC
	`)

	const badgeData = z.array(badgeSchema).parse(badgesRes.rows)

	const recentRes = await db.execute(sql`
		SELECT
			c.id, c.name, c.category, c.points,
			uc.completed_at AS "completedAt"
		FROM user_challenges uc
		INNER JOIN challenges c ON c.id = uc.challenge_id
		WHERE uc.user_id = ${userId}
		ORDER BY uc.completed_at DESC
		LIMIT 10
	`)

	const recentActivity = z.array(recentActivitySchema).parse(recentRes.rows)

	const leaderboardRes = await db.execute(sql`
		SELECT
			id, name, points, rank, "isCurrentUser"
		FROM (
			SELECT
				u.id, u.name, u.achievement_points AS points,
				ROW_NUMBER() OVER (ORDER BY u.achievement_points DESC, u.id ASC)::int AS rank,
				(u.id = ${userId}) AS "isCurrentUser"
			FROM users u
			WHERE u.role <> 'staff'
		) ranked
		ORDER BY rank ASC
		LIMIT 10
	`)

	const leaderboard = z
		.array(leaderboardEntrySchema)
		.parse(leaderboardRes.rows)

	return { stats, badges: badgeData, recentActivity, leaderboard }
}

export async function awardBadgesForUser(userId: number): Promise<void> {
	const badgeRows = await db.execute(sql`
		SELECT
			b.id, b."criteriaType" AS "criteriaType",
			b.criteria_value AS "criteriaValue",
			b."criteriaMeta" AS "criteriaMeta",
			CASE b."criteriaType"
				WHEN 'challenges_solved' THEN
					(SELECT COUNT(*) FROM user_challenges uc WHERE uc.user_id = ${userId})::int
				WHEN 'lessons_completed' THEN
					(SELECT COUNT(*) FROM users_to_lessons utl WHERE utl.user_id = ${userId} AND utl.completed = true)::int
				WHEN 'points_total' THEN
					(SELECT achievement_points FROM users WHERE id = ${userId})::int
				WHEN 'courses_completed' THEN
					(SELECT COUNT(DISTINCT utc.course_id)::int FROM users_to_courses utc
						WHERE utc.user_id = ${userId}
						AND NOT EXISTS (
							SELECT 1 FROM users_to_lessons utl
							INNER JOIN lessons l ON l.id = utl.lesson_id
							INNER JOIN modules m ON m.id = l.module_id
							WHERE m.course_id = utc.course_id
							AND (utl.user_id <> utc.user_id OR utl.completed = false)
						))
				WHEN 'challenges_category' THEN
					(SELECT COUNT(*) FROM user_challenges uc
						INNER JOIN challenges c ON c.id = uc.challenge_id
						WHERE uc.user_id = ${userId} AND c.category = b."criteriaMeta")::int
				ELSE 0
			END AS "progress"
		FROM badges b
		WHERE NOT EXISTS (
			SELECT 1 FROM user_badges ub WHERE ub.badge_id = b.id AND ub.user_id = ${userId}
		)
	`)

	const qualifying = badgeRows.rows.filter(
		(r) => Number(r.progress) >= Number(r.criteriaValue),
	)

	if (qualifying.length === 0) return

	await db
		.insert(userBadges)
		.values(qualifying.map((r) => ({ userId, badgeId: Number(r.id) })))
		.onConflictDoNothing()
}
