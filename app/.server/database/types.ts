import { createSelectSchema } from 'drizzle-zod'
import {
	users,
	courses,
	modules,
	lessons,
	reviews,
	categories,
	challengeQuestions,
	challengeOptions,
	challengeSubmissions,
	learningPaths,
	pathCourses,
	userPaths,
	pathChallenges,
	passwordResetTokens,
	challenges,
	tags,
	challengeTags,
	userChallenges,
	chatMessages,
	badges,
	userBadges,
} from './schema'
import { z } from 'zod'

export const USER_ROLES = ['learner', 'staff', 'lite', 'pro'] as const
export type UserRole = (typeof USER_ROLES)[number]

export type User = typeof users.$inferSelect
export type Course = typeof courses.$inferSelect
export type Module = typeof modules.$inferSelect
export type Lesson = typeof lessons.$inferSelect
export type Review = typeof reviews.$inferSelect
export type Category = typeof categories.$inferSelect
export type ChallengeQuestion = typeof challengeQuestions.$inferSelect
export type ChallengeOption = typeof challengeOptions.$inferSelect
export type ChallengeSubmission = typeof challengeSubmissions.$inferSelect
export type LearningPath = typeof learningPaths.$inferSelect
export type Challenge = typeof challenges.$inferSelect
export type Tag = typeof tags.$inferSelect
export type ChallengeTag = typeof challengeTags.$inferSelect
export type UserChallenge = typeof userChallenges.$inferSelect
export type UserPath = typeof userPaths.$inferSelect
export type PathChallenge = typeof pathChallenges.$inferSelect
export type Badge = typeof badges.$inferSelect
export type UserBadge = typeof userBadges.$inferSelect

export const userSchema = createSelectSchema(users)
export const courseSchema = createSelectSchema(courses)
export const moduleSchema = createSelectSchema(modules)
export const lessonSchema = createSelectSchema(lessons)
export const categorySchema = createSelectSchema(categories)
export const challengeQuestionSchema = createSelectSchema(challengeQuestions)
export const challengeOptionSchema = createSelectSchema(challengeOptions)
export const challengeSubmissionSchema =
	createSelectSchema(challengeSubmissions)
export const learningPathSchema = createSelectSchema(learningPaths)
export const passwordResetTokenSchema = createSelectSchema(passwordResetTokens)
export const pathCourseSchema = createSelectSchema(pathCourses)
export const challengeSchema = createSelectSchema(challenges)
export const tagSchema = createSelectSchema(tags)
export const challengeTagSchema = createSelectSchema(challengeTags)
export const userChallengeSchema = createSelectSchema(userChallenges)
export const badgeSchema = createSelectSchema(badges)
export const userBadgeSchema = createSelectSchema(userBadges)

export const learningPathRoadmapItemSchema = z.object({
	position: z.coerce.number(),
	type: z.enum(['course', 'challenge']),
	title: z.string(),
	completed: z
		.union([z.boolean(), z.string()])
		.transform((v) => v === true || v === 'true'),
	targetId: z.coerce.number(),
})

export type LearningPathRoadmapItem = z.infer<
	typeof learningPathRoadmapItemSchema
>

export const learningPathWithCountSchema = learningPathSchema.extend({
	coursesCount: z.coerce.number(),
	totalDuration: z.coerce.number(),
	tags: z.array(z.string()).nullable(),
	timeToComplete: z.coerce.number().nullable(),
	createdAt: z.coerce.date(),
	tracked: z
		.union([z.boolean(), z.string()])
		.transform((v) => v === true || v === 'true'),
	progress: z.coerce.number(),
	roadmap: z.array(learningPathRoadmapItemSchema).default([]),
})

export type LearningPathWithCount = z.infer<typeof learningPathWithCountSchema>

export const pathCourseEntrySchema = z.object({
	position: z.coerce.number(),
	courseId: z.coerce.number(),
	title: z.string(),
	description: z.string(),
	thumbnail: z.string().nullable(),
	length: z.coerce.number(),
	lessonsCount: z.coerce.number(),
	completed: z
		.union([z.boolean(), z.string()])
		.transform((v) => v === true || v === 'true'),
})

export type PathCourseEntry = z.infer<typeof pathCourseEntrySchema>

export const roadmapItemSchema = z.discriminatedUnion('type', [
	pathCourseEntrySchema.extend({ type: z.literal('course') }),
	z.object({
		type: z.literal('challenge'),
		position: z.coerce.number(),
		challengeId: z.coerce.number(),
		name: z.string(),
		description: z.string(),
		difficulty: z.string(),
		category: z.string(),
		points: z.coerce.number(),
		completed: z
			.union([z.boolean(), z.string()])
			.transform((v) => v === true || v === 'true'),
	}),
])

export type RoadmapItem = z.infer<typeof roadmapItemSchema>

export const learningPathDetailSchema = learningPathWithCountSchema.extend({
	roadmap: z.array(roadmapItemSchema),
})

export type LearningPathDetail = z.infer<typeof learningPathDetailSchema>

export const challengeViewSchema = challengeSchema.extend({
	solveCount: z.coerce.number(),
	completed: z.coerce.boolean(),
	tags: z.array(z.string()),
	createdAt: z.coerce.date(),
})

export type ChatMessage = typeof chatMessages.$inferSelect

export type ChallengeView = z.infer<typeof challengeViewSchema>
