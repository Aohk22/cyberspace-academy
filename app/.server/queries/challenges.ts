import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import { challenges } from '~/.server/database/schema'
import { challengeViewSchema } from '~/.server/database/types'
import { awardBadgesForUser } from './achievements'
import type { ChallengeView } from '~/.server/database/types'

export async function getChallenges({
	userId,
	category,
	difficulty,
	search,
}: {
	userId: number
	category?: string | null
	difficulty?: string | null
	search?: string | null
}): Promise<ChallengeView[]> {
	const res = await db.execute(sql`
		SELECT 
			c.id, c.name, c.description, c.flag, c.difficulty, c.category, c.points,
			c.created_at AS "createdAt",
			COUNT(uc.user_id)::int AS "solveCount",
			COUNT(uc2.user_id)::int AS completed,
			COALESCE(
				json_agg(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL),
				'[]'::json
			) AS tags
		FROM challenges c
		LEFT JOIN user_challenges uc ON c.id = uc.challenge_id
		LEFT JOIN user_challenges uc2 ON c.id = uc2.challenge_id AND uc2.user_id = ${userId}
		LEFT JOIN challenge_tags ct ON c.id = ct.challenge_id
		LEFT JOIN tags t ON ct.tag_id = t.id
		WHERE 1=1
		${category ? sql`AND c.category = ${category}` : sql``}
		${difficulty ? sql`AND c.difficulty = ${difficulty}` : sql``}
		${search ? sql`AND c.name ILIKE ${'%' + search + '%'}` : sql``}
		GROUP BY c.id
		ORDER BY c.id
	`)

	return z.array(challengeViewSchema).parse(res.rows)
}

export async function submitFlag({
	challengeId,
	userId,
	flag,
}: {
	challengeId: number
	userId: number
	flag: string
}): Promise<{ correct: boolean; points?: number }> {
	const challenge = await db
		.select()
		.from(challenges)
		.where(eq(challenges.id, challengeId))
		.limit(1)
		.then((r) => r.at(0) ?? null)

	if (!challenge) {
		return { correct: false }
	}

	if (flag.trim().toLowerCase() !== challenge.flag.trim().toLowerCase()) {
		return { correct: false }
	}

	const existingRes = await db.execute(
		sql`SELECT 1 FROM user_challenges WHERE user_id = ${userId} AND challenge_id = ${challengeId}`,
	)
	if (existingRes.rows.length > 0) {
		return { correct: true, points: 0 }
	}

	await db.execute(
		sql`INSERT INTO user_challenges (user_id, challenge_id) VALUES (${userId}, ${challengeId})`,
	)

	await db.execute(
		sql`UPDATE users SET achievement_points = achievement_points + ${challenge.points} WHERE id = ${userId}`,
	)

	await awardBadgesForUser(userId)

	return { correct: true, points: challenge.points }
}
