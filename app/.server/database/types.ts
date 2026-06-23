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
} from './schema'
import { z } from 'zod'

export const USER_ROLES = ['learner', 'staff'] as const
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
export const pathCourseSchema = createSelectSchema(pathCourses)

export const learningPathWithCountSchema = learningPathSchema.extend({
	coursesCount: z.coerce.number(),
	totalDuration: z.coerce.number(),
	createdAt: z.coerce.date(),
})

export type LearningPathWithCount = z.infer<typeof learningPathWithCountSchema>

export type PathCourseEntry = {
	position: number
	courseId: number
	title: string
	description: string
	thumbnail: string | null
	length: number
	lessonsCount: number
	enrolled: boolean
}

export type LearningPathDetail = LearningPathWithCount & {
	courses: PathCourseEntry[]
}
