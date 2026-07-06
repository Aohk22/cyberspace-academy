import { asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { CheckCircle2, Plus } from 'lucide-react'
import {
	Await,
	data,
	Link,
	redirect,
	useActionData,
	useLoaderData,
} from 'react-router'
import { Suspense } from 'react'
import { z } from 'zod'
import CourseBuilderWorkspace from '~/components/course-builder/CourseBuilderWorkspace'
import type {
	ActionResult,
	CourseDraft,
	CurriculumModule,
} from '~/components/course-builder/types'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import type { Route } from './+types/CourseBuilder'
import { db } from '~/.server/database/connection'
import {
	categories,
	courses,
	lessons,
	modules,
	challengeQuestions,
	challengeOptions,
	challengeSubmissions,
	pathCourses,
	usersToLessons,
	usersToCourses,
	reviews,
} from '~/.server/database/schema'
import { getCategories } from '~/.server/database/utils'

const challengeOptionDraftSchema = z.object({
	clientId: z.string().min(1),
	id: z.number().int().positive().nullable(),
	optionText: z.string(),
	isCorrect: z.boolean(),
})

const challengeQuestionDraftSchema = z.object({
	clientId: z.string().min(1),
	id: z.number().int().positive().nullable(),
	questionText: z.string(),
	type: z.enum(['multiple_choice', 'flag']),
	correctAnswer: z.string(),
	options: z.array(challengeOptionDraftSchema),
})

const lessonDraftSchema = z.object({
	clientId: z.string().min(1),
	id: z.number().int().positive().nullable(),
	title: z.string(),
	length: z.number().int().min(0),
	contentMd: z.string(),
	challengeQuestions: z.array(challengeQuestionDraftSchema),
})

const moduleDraftSchema = z.object({
	clientId: z.string().min(1),
	id: z.number().int().positive().nullable(),
	title: z.string(),
	lessons: z.array(lessonDraftSchema),
})

const courseDraftSchema = z.object({
	id: z.number().int().positive().nullable(),
	title: z.string().trim().min(1, 'Title is required'),
	description: z
		.string()
		.trim()
		.min(1, 'Description is required')
		.max(255, 'Description must be 255 characters or fewer'),
	instructor: z.string().trim().min(1, 'Instructor is required'),
	thumbnail: z
		.string()
		.trim()
		.pipe(
			z.union([
				z.literal(''),
				z.string().url('Thumbnail must be a valid URL'),
			]),
		),
	length: z.number().int().min(0, 'Length must be 0 or greater'),
	categoryId: z.number().int().positive('Choose a category').nullable(),
	modules: z.array(moduleDraftSchema),
	selectedModuleClientId: z.string().nullable(),
	selectedLessonClientId: z.string().nullable(),
})

function buildCourseBuilderPath({
	courseId,
	moduleId,
	lessonId,
	saved,
}: {
	courseId?: number
	moduleId?: number
	lessonId?: number
	saved?: string
}) {
	const searchParams = new URLSearchParams()

	if (courseId != null) {
		searchParams.set('courseId', String(courseId))
	}

	if (moduleId != null) {
		searchParams.set('moduleId', String(moduleId))
	}

	if (lessonId != null) {
		searchParams.set('lessonId', String(lessonId))
	}

	if (saved != null) {
		searchParams.set('saved', saved)
	}

	const query = searchParams.toString()
	return query.length > 0 ? `/course-builder?${query}` : '/course-builder'
}

function buildSelectionRedirect(
	draft: CourseDraft,
	courseId: number,
	moduleIdByClientId: Map<string, number>,
	lessonIdByClientId: Map<string, number>,
) {
	return buildCourseBuilderPath({
		courseId,
		moduleId:
			draft.selectedModuleClientId == null
				? undefined
				: moduleIdByClientId.get(draft.selectedModuleClientId),
		lessonId:
			draft.selectedLessonClientId == null
				? undefined
				: lessonIdByClientId.get(draft.selectedLessonClientId),
		saved: draft.id == null ? 'created' : 'updated',
	})
}

async function requireStaffUser(context: Route.LoaderArgs['context']) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}

	if (user.role !== 'staff') {
		throw redirect('/')
	}

	return user
}

async function getBuilderCourses() {
	return db
		.select({
			id: courses.id,
			title: courses.title,
			description: courses.description,
			instructor: courses.instructor,
			thumbnail: courses.thumbnail,
			length: courses.length,
			categoryId: courses.categoryId,
			categoryName: categories.name,
		})
		.from(courses)
		.innerJoin(categories, eq(courses.categoryId, categories.id))
		.orderBy(desc(courses.id))
}

async function getCourseCurriculum(
	courseId: number,
): Promise<CurriculumModule[]> {
	const rows = await db
		.select({
			moduleId: modules.id,
			moduleTitle: modules.title,
			moduleCourseId: modules.courseId,
			lessonId: lessons.id,
			lessonTitle: lessons.title,
			lessonLength: lessons.length,
			lessonContentMd: lessons.contentMd,
			lessonModuleId: lessons.moduleId,
		})
		.from(modules)
		.leftJoin(lessons, eq(lessons.moduleId, modules.id))
		.where(eq(modules.courseId, courseId))
		.orderBy(asc(modules.id), asc(lessons.id))

	const lessonIds = rows
		.map((r) => r.lessonId)
		.filter((id): id is number => id != null)

	const questions =
		lessonIds.length > 0
			? await db
				.select()
				.from(challengeQuestions)
				.where(inArray(challengeQuestions.lessonId, lessonIds))
				.orderBy(asc(challengeQuestions.orderIndex))
			: []

	const questionIds = questions.map((q) => q.id)

	const options =
		questionIds.length > 0
			? await db
				.select()
				.from(challengeOptions)
				.where(inArray(challengeOptions.questionId, questionIds))
				.orderBy(asc(challengeOptions.orderIndex))
			: []

	const optionsByQuestion = new Map<
		number,
		(typeof challengeOptions.$inferSelect)[]
	>()
	for (const opt of options) {
		const list = optionsByQuestion.get(opt.questionId) ?? []
		list.push(opt)
		optionsByQuestion.set(opt.questionId, list)
	}

	const questionsByLesson = new Map<
		number,
		(typeof challengeQuestions.$inferSelect & {
			options: (typeof challengeOptions.$inferSelect)[]
		})[]
	>()
	for (const q of questions) {
		const list = questionsByLesson.get(q.lessonId) ?? []
		list.push({ ...q, options: optionsByQuestion.get(q.id) ?? [] })
		questionsByLesson.set(q.lessonId, list)
	}

	const groupedModules = new Map<number, CurriculumModule>()

	for (const row of rows) {
		if (!groupedModules.has(row.moduleId)) {
			groupedModules.set(row.moduleId, {
				id: row.moduleId,
				title: row.moduleTitle,
				courseId: row.moduleCourseId,
				lessons: [],
			})
		}

		if (
			row.lessonId != null &&
			row.lessonTitle != null &&
			row.lessonLength != null &&
			row.lessonContentMd != null &&
			row.lessonModuleId != null
		) {
			groupedModules.get(row.moduleId)?.lessons.push({
				id: row.lessonId,
				title: row.lessonTitle,
				length: row.lessonLength,
				contentMd: row.lessonContentMd,
				moduleId: row.lessonModuleId,
				challengeQuestions: questionsByLesson.get(row.lessonId) ?? [],
			} as any)
		}
	}

	return [...groupedModules.values()]
}

function getSavedMessage(saved: string | null) {
	switch (saved) {
		case 'created':
			return 'Course created successfully.'
		case 'updated':
			return 'Course updated successfully.'
		default:
			return null
	}
}

export async function loader({ request, context }: Route.LoaderArgs) {
	await requireStaffUser(context)
	const url = new URL(request.url)
	const selectedCourseId = Number(url.searchParams.get('courseId'))
	const selectedModuleId = Number(url.searchParams.get('moduleId'))
	const selectedLessonId = Number(url.searchParams.get('lessonId'))
	const saved = url.searchParams.get('saved')

	return {
		saved,
		dataPromise: loadBuilderData(
			selectedCourseId,
			selectedModuleId,
			selectedLessonId,
		),
	}
}

async function loadBuilderData(
	selectedCourseId: number,
	selectedModuleId: number,
	selectedLessonId: number,
) {
	const [categoryOptions, builderCourses] = await Promise.all([
		getCategories(),
		getBuilderCourses(),
	])

	const selectedCourse =
		Number.isNaN(selectedCourseId) || selectedCourseId <= 0
			? null
			: (builderCourses.find(
				(course) => course.id === selectedCourseId,
			) ?? null)

	const curriculum = selectedCourse
		? await getCourseCurriculum(selectedCourse.id)
		: []

	const selectedModule =
		curriculum.find((module) => module.id === selectedModuleId) ??
		curriculum[0] ??
		null

	const selectedLesson =
		selectedModule?.lessons.find(
			(lesson) => lesson.id === selectedLessonId,
		) ??
		selectedModule?.lessons[0] ??
		null

	return {
		categories: categoryOptions,
		courses: builderCourses,
		selectedCourse,
		curriculum,
		selectedModule,
		selectedLesson,
	}
}

const importOptionSchema = z.object({
	optionText: z.string(),
	isCorrect: z.boolean(),
})

const importQuestionSchema = z.object({
	questionText: z.string(),
	type: z.enum(['multiple_choice', 'flag']),
	correctAnswer: z.string().optional().default(''),
	options: z.array(importOptionSchema).optional().default([]),
})

const importLessonSchema = z.object({
	title: z.string(),
	length: z.number().int().min(0),
	contentMd: z.string(),
	challengeQuestions: z.array(importQuestionSchema).optional().default([]),
})

const importModuleSchema = z.object({
	title: z.string(),
	lessons: z.array(importLessonSchema),
})

const importCourseSchema = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	description: z
		.string()
		.trim()
		.min(1, 'Description is required')
		.max(255, 'Description must be 255 characters or fewer'),
	instructor: z.string().trim().min(1, 'Instructor is required'),
	thumbnail: z.string().trim(),
	length: z.number().int().min(0),
	categoryId: z.number().int().positive('Choose a category').nullable(),
	categoryName: z.string().optional(),
	modules: z.array(importModuleSchema),
})

export async function action({ request, context }: Route.ActionArgs) {
	await requireStaffUser(context)

	const form = await request.formData()
	const intent = form.get('intent')

	if (intent === 'import-course') {
		const importJson = form.get('importJson')

		let parsedJson: unknown
		try {
			parsedJson =
				typeof importJson === 'string' ? JSON.parse(importJson) : null
		} catch {
			return data<ActionResult>(
				{ error: 'Invalid JSON payload.' },
				{ status: 400 },
			)
		}

		const parsed = importCourseSchema.safeParse(parsedJson)
		if (!parsed.success) {
			return data<ActionResult>(
				{
					error:
						parsed.error.issues[0]?.message ??
						'Invalid course import.',
				},
				{ status: 400 },
			)
		}

		const importData = parsed.data

		let categoryId = importData.categoryId
		if (categoryId == null) {
			if (importData.categoryName) {
				const catRes = await db.execute<{ id: number }>(sql`
					SELECT id FROM categories WHERE name = ${importData.categoryName} LIMIT 1
				`)
				categoryId = catRes.rows[0]?.id ?? null
			}
			if (categoryId == null) {
				return data<ActionResult>(
					{
						error: importData.categoryName
							? `Category "${importData.categoryName}" not found.`
							: 'categoryId or categoryName is required in the import file.',
					},
					{ status: 400 },
				)
			}
		}

		const courseRes = await db.execute<{ id: number }>(sql`
			INSERT INTO "courses" (title, description, instructor, thumbnail, length, category_id)
			VALUES (${importData.title}, ${importData.description}, ${importData.instructor}, ${importData.thumbnail}, ${importData.length}, ${categoryId})
			RETURNING id
		`)
		const newCourseId = courseRes.rows[0].id

		for (const moduleImport of importData.modules) {
			const moduleRes = await db.execute<{ id: number }>(sql`
				INSERT INTO "modules" (course_id, title)
				VALUES (${newCourseId}, ${moduleImport.title.trim() || 'Untitled module'})
				RETURNING id
			`)
			const moduleId = moduleRes.rows[0].id

			for (const lessonImport of moduleImport.lessons) {
				const lessonRes = await db.execute<{ id: number }>(sql`
					INSERT INTO "lessons" (module_id, title, length, content_md)
					VALUES (${moduleId}, ${lessonImport.title.trim() || 'Untitled lesson'}, ${lessonImport.length}, ${lessonImport.contentMd})
					RETURNING id
				`)
				const lessonId = lessonRes.rows[0].id

				for (const qImport of lessonImport.challengeQuestions) {
					const qRes = await db.execute<{ id: number }>(sql`
						INSERT INTO "challenge_questions" (lesson_id, question_text, type, correct_answer, order_index)
						VALUES (${lessonId}, ${qImport.questionText}, ${qImport.type}, ${qImport.type === 'flag' ? qImport.correctAnswer : null}, 0)
						RETURNING id
					`)
					const questionId = qRes.rows[0].id

					if (qImport.type === 'multiple_choice') {
						for (const opt of qImport.options) {
							await db.execute(sql`
								INSERT INTO "challenge_options" (question_id, option_text, is_correct, order_index)
								VALUES (${questionId}, ${opt.optionText}, ${opt.isCorrect}, 0)
							`)
						}
					}
				}
			}
		}

		return redirect(`/course-builder?courseId=${newCourseId}`)
	}

	if (intent === 'delete-course') {
		const courseIdStr = form.get('courseId')
		const courseId = Number(courseIdStr)
		if (!Number.isFinite(courseId)) {
			return data<ActionResult>(
				{ error: 'Invalid course ID.' },
				{ status: 400 },
			)
		}

		const lessonIds = (
			await db.execute<{ id: number }>(sql`
				SELECT l.id FROM lessons l
				INNER JOIN modules m ON l.module_id = m.id
				WHERE m.course_id = ${courseId}
			`)
		).rows.map((r) => r.id)

		if (lessonIds.length > 0) {
			await db.delete(challengeSubmissions).where(
				sql`question_id IN (
					SELECT id FROM challenge_questions WHERE lesson_id IN (${sql.join(
					lessonIds.map((id) => sql`${id}`),
					sql`, `,
				)})
				)`,
			)
			await db.delete(challengeOptions).where(
				sql`question_id IN (
					SELECT id FROM challenge_questions WHERE lesson_id IN (${sql.join(
					lessonIds.map((id) => sql`${id}`),
					sql`, `,
				)})
				)`,
			)
			await db.delete(challengeQuestions).where(
				sql`lesson_id IN (${sql.join(
					lessonIds.map((id) => sql`${id}`),
					sql`, `,
				)})`,
			)
			await db.delete(usersToLessons).where(
				sql`lesson_id IN (${sql.join(
					lessonIds.map((id) => sql`${id}`),
					sql`, `,
				)})`,
			)
		}

		await db.delete(pathCourses).where(eq(pathCourses.courseId, courseId))
		await db
			.delete(usersToCourses)
			.where(eq(usersToCourses.courseId, courseId))
		await db.delete(reviews).where(sql`course_id = ${courseId}`)
		await db
			.delete(lessons)
			.where(
				sql`module_id IN (SELECT id FROM modules WHERE course_id = ${courseId})`,
			)
		await db.delete(modules).where(eq(modules.courseId, courseId))
		await db.delete(courses).where(eq(courses.id, courseId))

		return redirect('/course-builder')
	}

	if (intent !== 'save-draft') {
		return data<ActionResult>(
			{ error: 'Unsupported action.' },
			{ status: 400 },
		)
	}

	const draftJson = form.get('draftJson')
	let parsedJson: unknown

	try {
		parsedJson =
			typeof draftJson === 'string' ? JSON.parse(draftJson) : null
	} catch {
		return data<ActionResult>(
			{ error: 'Invalid draft payload.' },
			{ status: 400 },
		)
	}

	const parsed = courseDraftSchema.safeParse(parsedJson)
	if (!parsed.success) {
		return data<ActionResult>(
			{
				error:
					parsed.error.issues[0]?.message ?? 'Invalid course draft.',
			},
			{ status: 400 },
		)
	}

	const draft = parsed.data
	if (draft.categoryId == null) {
		return data<ActionResult>(
			{ error: 'Choose a category before saving.' },
			{ status: 400 },
		)
	}

	let courseId = draft.id

	if (courseId == null) {
		const [createdCourse] = await db
			.insert(courses)
			.values({
				title: draft.title,
				description: draft.description,
				instructor: draft.instructor,
				thumbnail: draft.thumbnail,
				length: draft.length,
				categoryId: draft.categoryId,
			})
			.returning({ id: courses.id })
		courseId = createdCourse.id
	} else {
		const [updatedCourse] = await db
			.update(courses)
			.set({
				title: draft.title,
				description: draft.description,
				instructor: draft.instructor,
				thumbnail: draft.thumbnail,
				length: draft.length,
				categoryId: draft.categoryId,
			})
			.where(eq(courses.id, courseId))
			.returning({ id: courses.id })

		if (!updatedCourse) {
			return data<ActionResult>(
				{ error: 'Course not found.' },
				{ status: 404 },
			)
		}
	}

	const moduleIdByClientId = new Map<string, number>()
	const lessonIdByClientId = new Map<string, number>()

	for (const moduleDraft of draft.modules) {
		let moduleId = moduleDraft.id

		if (moduleId == null) {
			const [createdModule] = await db
				.insert(modules)
				.values({
					courseId,
					title: moduleDraft.title.trim() || 'Untitled module',
				})
				.returning({ id: modules.id })
			moduleId = createdModule.id
		} else {
			const [updatedModule] = await db
				.update(modules)
				.set({
					title: moduleDraft.title.trim() || 'Untitled module',
				})
				.where(eq(modules.id, moduleId))
				.returning({ id: modules.id })

			if (!updatedModule) {
				return data<ActionResult>(
					{ error: 'A module in this draft no longer exists.' },
					{ status: 404 },
				)
			}
		}

		moduleIdByClientId.set(moduleDraft.clientId, moduleId)
	}

	for (const moduleDraft of draft.modules) {
		const moduleId = moduleIdByClientId.get(moduleDraft.clientId)
		if (moduleId == null) {
			continue
		}

		for (const lessonDraft of moduleDraft.lessons) {
			let lessonId = lessonDraft.id

			if (lessonId == null) {
				const [createdLesson] = await db
					.insert(lessons)
					.values({
						moduleId,
						title: lessonDraft.title.trim() || 'Untitled lesson',
						length: lessonDraft.length,
						contentMd: lessonDraft.contentMd,
					})
					.returning({ id: lessons.id })
				lessonId = createdLesson.id
			} else {
				const [updatedLesson] = await db
					.update(lessons)
					.set({
						moduleId,
						title: lessonDraft.title.trim() || 'Untitled lesson',
						length: lessonDraft.length,
						contentMd: lessonDraft.contentMd,
					})
					.where(eq(lessons.id, lessonId))
					.returning({ id: lessons.id })

				if (!updatedLesson) {
					return data<ActionResult>(
						{ error: 'A lesson in this draft no longer exists.' },
						{ status: 404 },
					)
				}
			}

			lessonIdByClientId.set(lessonDraft.clientId, lessonId)

			// Save challenge questions
			await db
				.delete(challengeQuestions)
				.where(eq(challengeQuestions.lessonId, lessonId))

			for (const qDraft of lessonDraft.challengeQuestions) {
				const [createdQuestion] = await db
					.insert(challengeQuestions)
					.values({
						lessonId,
						questionText: qDraft.questionText,
						type: qDraft.type,
						correctAnswer:
							qDraft.type === 'flag'
								? qDraft.correctAnswer
								: null,
						orderIndex: 0,
					})
					.returning({ id: challengeQuestions.id })

				if (qDraft.type === 'multiple_choice') {
					await db.insert(challengeOptions).values(
						qDraft.options.map((o) => ({
							questionId: createdQuestion.id,
							optionText: o.optionText,
							isCorrect: o.isCorrect,
							orderIndex: 0,
						})),
					)
				}
			}
		}
	}

	return redirect(
		buildSelectionRedirect(
			draft,
			courseId,
			moduleIdByClientId,
			lessonIdByClientId,
		),
	)
}

export const handle = {
	section: {
		title: 'Course Builder',
		subtitle: '',
	},
}

export default function CourseBuilder() {
	const { saved, dataPromise } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>() as
		| ActionResult
		| undefined
	const savedMessage = getSavedMessage(saved)

	return (
		<div className="space-y-8">
			{savedMessage ? (
				<div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
					<CheckCircle2 className="h-4 w-4" />
					<span>{savedMessage}</span>
				</div>
			) : null}

			{actionData?.error ? (
				<div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
					{actionData.error}
				</div>
			) : null}

			<Suspense fallback={<CourseBuilderSkeleton />}>
				<Await resolve={dataPromise}>
					{(data) => {
						const {
							categories: categoryOptions,
							courses: builderCourses,
							selectedCourse,
							curriculum,
						} = data

						return (
							<div className="space-y-8">
								<CourseBuilderWorkspace
									key={selectedCourse?.id ?? 'new-course'}
									courses={builderCourses}
									categories={categoryOptions}
									selectedCourse={selectedCourse}
									curriculum={curriculum}
								/>
							</div>
						)
					}}
				</Await>
			</Suspense>
		</div>
	)
}

function CourseBuilderSkeleton() {
	return (
		<div className="space-y-8 animate-pulse">
			<div className="h-96 bg-foreground-elevated rounded-xl" />
			<div className="h-64 bg-foreground-elevated rounded-xl" />
		</div>
	)
}
