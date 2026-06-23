import {
	pgTable,
	primaryKey,
	integer,
	varchar,
	text,
	boolean,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull().unique(),
	password: text().notNull(),
	role: varchar({ length: 20 }).notNull().default('learner'),
})

export const reviews = pgTable('reviews', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	userId: integer('user_id'),
	courseId: integer('course_id'),
	content: varchar({ length: 255 }).notNull(),
	rating: integer().notNull(),
})

export const categories = pgTable('categories', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull().unique(),
})

export const courses = pgTable('courses', {
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

export const modules = pgTable('modules', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: varchar({ length: 255 }).notNull(),

	courseId: integer('course_id')
		.notNull()
		.references(() => courses.id),
})

export const lessons = pgTable('lessons', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: varchar({ length: 255 }).notNull(),
	length: integer().notNull(),
	contentMd: text('content_md').notNull().default(''),

	moduleId: integer('module_id')
		.notNull()
		.references(() => modules.id),
})

export const usersToCourses = pgTable(
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

export const usersToLessons = pgTable(
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

export const challengeQuestions = pgTable('challenge_questions', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	lessonId: integer('lesson_id')
		.notNull()
		.references(() => lessons.id),
	questionText: text('question_text').notNull(),
	type: varchar({ length: 20 }).notNull().default('multiple_choice'),
	correctAnswer: text('correct_answer'),
	orderIndex: integer('order_index').notNull().default(0),
})

export const challengeOptions = pgTable('challenge_options', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	questionId: integer('question_id')
		.notNull()
		.references(() => challengeQuestions.id, { onDelete: 'cascade' }),
	optionText: text('option_text').notNull(),
	isCorrect: boolean('is_correct').notNull().default(false),
	orderIndex: integer('order_index').notNull().default(0),
})

export const challengeSubmissions = pgTable(
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

export const learningPaths = pgTable('learning_paths', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	thumbnail: text(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const pathCourses = pgTable(
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
