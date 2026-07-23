import {
	primaryKey,
	integer,
	varchar,
	text,
	boolean,
	timestamp,
	unique,
	pgSchema,
} from 'drizzle-orm/pg-core'

export const cyberspaceSchema = pgSchema('cyberspace')

export const users = cyberspaceSchema.table('users', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull().unique(),
	password: text().notNull(),
	role: varchar({ length: 20 }).notNull().default('learner'),
	achievementPoints: integer('achievement_points').notNull().default(0),
	subscriptionEndsAt: timestamp('subscription_ends_at'),
})

export const reviews = cyberspaceSchema.table('reviews', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	userId: integer('user_id'),
	courseId: integer('course_id'),
	content: varchar({ length: 255 }).notNull(),
	rating: integer().notNull(),
})

export const categories = cyberspaceSchema.table('categories', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull().unique(),
})

export const courses = cyberspaceSchema.table('courses', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: text().notNull(),
	description: varchar({ length: 255 }).notNull(),
	instructor: varchar({ length: 255 }).notNull(),
	thumbnail: text().notNull(),
	length: integer().notNull(),

	categoryId: integer('category_id')
		.notNull()
		.references(() => categories.id),
})

export const modules = cyberspaceSchema.table('modules', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: varchar({ length: 255 }).notNull(),

	courseId: integer('course_id')
		.notNull()
		.references(() => courses.id),
})

export const lessons = cyberspaceSchema.table('lessons', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: varchar({ length: 255 }).notNull(),
	length: integer().notNull(),
	contentMd: text('content_md').notNull().default(''),

	moduleId: integer('module_id')
		.notNull()
		.references(() => modules.id),
})

export const usersToCourses = cyberspaceSchema.table(
	'users_to_courses',
	{
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		courseId: integer('course_id')
			.notNull()
			.references(() => courses.id),
	},
	(t) => [primaryKey({ columns: [t.userId, t.courseId] })],
)

export const usersToLessons = cyberspaceSchema.table(
	'users_to_lessons',
	{
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		lessonId: integer('lesson_id')
			.notNull()
			.references(() => lessons.id),
		completed: boolean().notNull().default(false),
	},
	(t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
)

export const challengeQuestions = cyberspaceSchema.table(
	'challenge_questions',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		lessonId: integer('lesson_id')
			.notNull()
			.references(() => lessons.id),
		questionText: text('question_text').notNull(),
		type: varchar({ length: 20 }).notNull().default('multiple_choice'),
		correctAnswer: text('correct_answer'),
		orderIndex: integer('order_index').notNull().default(0),
	},
)

export const challengeOptions = cyberspaceSchema.table('challenge_options', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	questionId: integer('question_id')
		.notNull()
		.references(() => challengeQuestions.id, { onDelete: 'cascade' }),
	optionText: text('option_text').notNull(),
	isCorrect: boolean('is_correct').notNull().default(false),
	orderIndex: integer('order_index').notNull().default(0),
})

export const challengeSubmissions = cyberspaceSchema.table(
	'challenge_submissions',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		questionId: integer('question_id')
			.notNull()
			.references(() => challengeQuestions.id, { onDelete: 'cascade' }),
		answerText: text('answer_text').notNull(),
		isCorrect: boolean('is_correct').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(t) => [unique().on(t.userId, t.questionId)],
)

export const learningPaths = cyberspaceSchema.table('learning_paths', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	thumbnail: text(),
	tags: text('tags').array(),
	timeToComplete: integer('time_to_complete'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const pathCourses = cyberspaceSchema.table(
	'path_courses',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		pathId: integer('path_id')
			.notNull()
			.references(() => learningPaths.id, { onDelete: 'cascade' }),
		courseId: integer('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		position: integer('position').notNull(),
	},
	(t) => [
		unique().on(t.pathId, t.courseId),
		unique().on(t.pathId, t.position),
	],
)

export const userPaths = cyberspaceSchema.table(
	'user_paths',
	{
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		pathId: integer('path_id')
			.notNull()
			.references(() => learningPaths.id, { onDelete: 'cascade' }),
		trackedAt: timestamp('tracked_at').defaultNow().notNull(),
	},
	(t) => [primaryKey({ columns: [t.userId, t.pathId] })],
)

export const pathChallenges = cyberspaceSchema.table(
	'path_challenges',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		pathId: integer('path_id')
			.notNull()
			.references(() => learningPaths.id, { onDelete: 'cascade' }),
		challengeId: integer('challenge_id')
			.notNull()
			.references(() => challenges.id, { onDelete: 'cascade' }),
		position: integer('position').notNull(),
	},
	(t) => [
		unique().on(t.pathId, t.challengeId),
		unique().on(t.pathId, t.position),
	],
)

export const challenges = cyberspaceSchema.table('challenges', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	flag: text().notNull(),
	difficulty: varchar({ length: 50 }).notNull(),
	category: varchar({ length: 50 }).notNull(),
	points: integer().notNull().default(0),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tags = cyberspaceSchema.table('tags', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull().unique(),
})

export const challengeTags = cyberspaceSchema.table(
	'challenge_tags',
	{
		challengeId: integer('challenge_id')
			.notNull()
			.references(() => challenges.id, { onDelete: 'cascade' }),
		tagId: integer('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),
	},
	(t) => [primaryKey({ columns: [t.challengeId, t.tagId] })],
)

export const userChallenges = cyberspaceSchema.table(
	'user_challenges',
	{
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		challengeId: integer('challenge_id')
			.notNull()
			.references(() => challenges.id, { onDelete: 'cascade' }),
		completedAt: timestamp('completed_at').defaultNow().notNull(),
	},
	(t) => [primaryKey({ columns: [t.userId, t.challengeId] })],
)

export const badges = cyberspaceSchema.table('badges', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	icon: varchar({ length: 50 }).notNull(),
	rarity: varchar({ length: 20 }).notNull().default('common'),
	criteriaType: varchar({ length: 50 }).notNull(),
	criteriaValue: integer().notNull(),
	criteriaMeta: varchar({ length: 50 }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const userBadges = cyberspaceSchema.table(
	'user_badges',
	{
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		badgeId: integer('badge_id')
			.notNull()
			.references(() => badges.id, { onDelete: 'cascade' }),
		awardedAt: timestamp('awarded_at').defaultNow().notNull(),
	},
	(t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
)

export const passwordResetTokens = cyberspaceSchema.table(
	'password_reset_tokens',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		token: varchar({ length: 255 }).notNull().unique(),
		expiresAt: timestamp('expires_at').notNull(),
		usedAt: timestamp('used_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
)

export const chatMessages = cyberspaceSchema.table(
	'chat_messages',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		date: varchar({ length: 10 }).notNull(),
		count: integer().notNull().default(0),
	},
	(t) => [unique().on(t.userId, t.date)],
)

export const orders = cyberspaceSchema.table('orders', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	orderCode: integer('order_code').notNull().unique(),
	paymentLinkId: varchar('payment_link_id', { length: 255 }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	plan: varchar({ length: 50 }).notNull(),
	amount: integer().notNull(),
	status: varchar({ length: 20 }).notNull().default('PENDING'),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
