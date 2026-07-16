import { useState, lazy, Suspense } from 'react'
import { asc, eq, inArray } from 'drizzle-orm'
import { ArrowLeft, ChevronRight, Flag, Plus, Save, Trash2 } from 'lucide-react'
import {
	data,
	Form,
	Link,
	redirect,
	useActionData,
	useLoaderData,
	useNavigation,
} from 'react-router'
const MarkdownContent = lazy(() => import('~/components/MarkdownContent'))
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import { can } from '~/auth/permissions'
import type { Route } from './+types/CourseBuilderLesson'
import { db } from '~/.server/database/connection'
import {
	challengeQuestions as challengeQuestionsTable,
	challengeOptions as challengeOptionsTable,
	courses,
	lessons,
	modules,
} from '~/.server/database/schema'
import type {
	ChallengeOption,
	ChallengeQuestion,
} from '~/.server/database/types'

type LoadedQuestion = ChallengeQuestion & {
	options: ChallengeOption[]
}

type ActionResult = { error?: string }

let questionKeyCounter = 0
function nextQuestionKey() {
	return `q-${++questionKeyCounter}`
}

let optionKeyCounter = 0
function nextOptionKey() {
	return `o-${++optionKeyCounter}`
}

function buildQuestionFromLoaded(q: LoadedQuestion): QuestionState {
	return {
		key: nextQuestionKey(),
		id: q.id,
		questionText: q.questionText,
		type: q.type as 'multiple_choice' | 'flag',
		correctAnswer: q.correctAnswer ?? '',
		options: q.options.map((opt) => ({
			key: nextOptionKey(),
			id: opt.id,
			optionText: opt.optionText,
			isCorrect: opt.isCorrect,
		})),
	}
}

function createBlankQuestion(): QuestionState {
	return {
		key: nextQuestionKey(),
		id: null,
		questionText: '',
		type: 'multiple_choice',
		correctAnswer: '',
		options: [
			{
				key: nextOptionKey(),
				id: null,
				optionText: '',
				isCorrect: false,
			},
			{
				key: nextOptionKey(),
				id: null,
				optionText: '',
				isCorrect: false,
			},
		],
	}
}

type QuestionState = {
	key: string
	id: number | null
	questionText: string
	type: 'multiple_choice' | 'flag'
	correctAnswer: string
	options: {
		key: string
		id: number | null
		optionText: string
		isCorrect: boolean
	}[]
}

async function requireStaffUser(context: Route.LoaderArgs['context']) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (!can(user, 'admin')) {
		throw redirect('/')
	}
	return user
}

export async function loader({ params, context }: Route.LoaderArgs) {
	await requireStaffUser(context)

	const courseId = Number(params.courseId)
	const lessonId = Number(params.lessonId)

	if (Number.isNaN(courseId) || Number.isNaN(lessonId)) {
		throw data(null, { status: 400 })
	}

	const course = await db
		.select()
		.from(courses)
		.where(eq(courses.id, courseId))
		.limit(1)
		.then((rows) => rows[0] ?? null)

	if (!course) {
		throw data(null, { status: 404 })
	}

	const lesson = await db
		.select()
		.from(lessons)
		.where(eq(lessons.id, lessonId))
		.limit(1)
		.then((rows) => rows[0] ?? null)

	if (!lesson) {
		throw data(null, { status: 404 })
	}

	const module_ = await db
		.select()
		.from(modules)
		.where(eq(modules.id, lesson.moduleId))
		.limit(1)
		.then((rows) => rows[0] ?? null)

	if (!module_) {
		throw data(null, { status: 404 })
	}

	const allCourseModules = await db
		.select()
		.from(modules)
		.where(eq(modules.courseId, courseId))
		.orderBy(asc(modules.id))

	const questions = await db
		.select()
		.from(challengeQuestionsTable)
		.where(eq(challengeQuestionsTable.lessonId, lessonId))
		.orderBy(asc(challengeQuestionsTable.orderIndex))

	const questionIds = questions.map((q) => q.id)

	const allOptions: ChallengeOption[] =
		questionIds.length > 0
			? await db
					.select()
					.from(challengeOptionsTable)
					.where(
						inArray(challengeOptionsTable.questionId, questionIds),
					)
					.orderBy(asc(challengeOptionsTable.orderIndex))
			: []

	const optionsByQuestion = new Map<number, ChallengeOption[]>()
	for (const opt of allOptions) {
		const list = optionsByQuestion.get(opt.questionId) ?? []
		list.push(opt)
		optionsByQuestion.set(opt.questionId, list)
	}

	const loadedQuestions: LoadedQuestion[] = questions.map((q) => ({
		...q,
		options: optionsByQuestion.get(q.id) ?? [],
	}))

	return {
		course,
		lesson,
		module: module_,
		allCourseModules,
		challengeQuestions: loadedQuestions,
	}
}

export async function action({ request, params, context }: Route.ActionArgs) {
	const user = await requireStaffUser(context)

	const courseId = Number(params.courseId)
	const lessonId = Number(params.lessonId)

	if (Number.isNaN(courseId) || Number.isNaN(lessonId)) {
		return data<ActionResult>(
			{ error: 'Invalid parameters.' },
			{ status: 400 },
		)
	}

	const form = await request.formData()
	const intent = form.get('intent')

	if (intent !== 'save-lesson') {
		return data<ActionResult>(
			{ error: 'Unsupported action.' },
			{ status: 400 },
		)
	}

	const title = form.get('title')
	const length = form.get('length')
	const contentMd = form.get('contentMd')
	const moduleId = form.get('moduleId')
	const challengeJson = form.get('challengeJson')

	if (typeof title !== 'string' || title.trim().length === 0) {
		return data<ActionResult>(
			{ error: 'Title is required.' },
			{ status: 400 },
		)
	}

	const lessonLength = Number(length)
	const parsedModuleId = Number(moduleId)

	if (Number.isNaN(lessonLength) || lessonLength < 0) {
		return data<ActionResult>(
			{ error: 'Length must be a positive number.' },
			{ status: 400 },
		)
	}

	if (Number.isNaN(parsedModuleId)) {
		return data<ActionResult>(
			{ error: 'Module selection is required.' },
			{ status: 400 },
		)
	}

	await db
		.update(lessons)
		.set({
			title: title.trim(),
			length: lessonLength,
			contentMd: typeof contentMd === 'string' ? contentMd : '',
			moduleId: parsedModuleId,
		})
		.where(eq(lessons.id, lessonId))

	// Parse and save challenge questions
	let parsedChallenges: any[] = []
	if (typeof challengeJson === 'string' && challengeJson.trim()) {
		try {
			parsedChallenges = JSON.parse(challengeJson)
		} catch {
			return data<ActionResult>(
				{ error: 'Invalid challenge data.' },
				{ status: 400 },
			)
		}
	}

	await db
		.delete(challengeQuestionsTable)
		.where(eq(challengeQuestionsTable.lessonId, lessonId))

	for (const q of parsedChallenges) {
		const [created] = await db
			.insert(challengeQuestionsTable)
			.values({
				lessonId,
				questionText: q.questionText ?? '',
				type: q.type ?? 'multiple_choice',
				correctAnswer:
					q.type === 'flag' ? (q.correctAnswer ?? '') : null,
				orderIndex: 0,
			})
			.returning({ id: challengeQuestionsTable.id })

		if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
			await db.insert(challengeOptionsTable).values(
				q.options.map((o: any) => ({
					questionId: created.id,
					optionText: o.optionText ?? '',
					isCorrect: o.isCorrect ?? false,
					orderIndex: 0,
				})),
			)
		}
	}

	return redirect(`/course-builder?courseId=${courseId}`)
}

export default function CourseBuilderLesson() {
	const {
		course,
		lesson,
		module: currentModule,
		allCourseModules,
		challengeQuestions,
	} = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>() as
		| ActionResult
		| undefined
	const navigation = useNavigation()
	const isSaving = navigation.state === 'submitting'

	const [title, setTitle] = useState(lesson.title)
	const [length, setLength] = useState(lesson.length)
	const [contentMd, setContentMd] = useState(lesson.contentMd)
	const [moduleId, setModuleId] = useState(lesson.moduleId)
	const [questions, setQuestions] = useState<QuestionState[]>(() =>
		challengeQuestions.map(buildQuestionFromLoaded),
	)
	const [activeTab, setActiveTab] = useState<
		'write' | 'preview' | 'challenge'
	>('write')

	function addQuestion() {
		setQuestions((prev) => [...prev, createBlankQuestion()])
	}

	function removeQuestion(key: string) {
		setQuestions((prev) => prev.filter((q) => q.key !== key))
	}

	function updateQuestion(key: string, field: string, value: any) {
		setQuestions((prev) =>
			prev.map((q) => (q.key === key ? { ...q, [field]: value } : q)),
		)
	}

	function addOption(questionKey: string) {
		setQuestions((prev) =>
			prev.map((q) =>
				q.key === questionKey
					? {
							...q,
							options: [
								...q.options,
								{
									key: nextOptionKey(),
									id: null,
									optionText: '',
									isCorrect: false,
								},
							],
						}
					: q,
			),
		)
	}

	function removeOption(questionKey: string, optionKey: string) {
		setQuestions((prev) =>
			prev.map((q) =>
				q.key === questionKey
					? {
							...q,
							options: q.options.filter(
								(o) => o.key !== optionKey,
							),
						}
					: q,
			),
		)
	}

	function updateOption(
		questionKey: string,
		optionKey: string,
		field: string,
		value: any,
	) {
		setQuestions((prev) =>
			prev.map((q) =>
				q.key === questionKey
					? {
							...q,
							options: q.options.map((o) =>
								o.key === optionKey
									? { ...o, [field]: value }
									: o,
							),
						}
					: q,
			),
		)
	}

	function markCorrect(questionKey: string, correctOptionKey: string) {
		setQuestions((prev) =>
			prev.map((q) =>
				q.key === questionKey
					? {
							...q,
							options: q.options.map((o) => ({
								...o,
								isCorrect: o.key === correctOptionKey,
							})),
						}
					: q,
			),
		)
	}

	const challengeJson = JSON.stringify(
		questions.map((q) => ({
			questionText: q.questionText,
			type: q.type,
			correctAnswer: q.correctAnswer,
			options: q.options.map((o) => ({
				optionText: o.optionText,
				isCorrect: o.isCorrect,
			})),
		})),
	)

	return (
		<div className="space-y-6">
			{/* Breadcrumbs */}
			<nav className="flex items-center gap-2 text-sm text-ink">
				<Link to="/course-builder" className=" hover:text-ink">
					Course Builder
				</Link>
				<ChevronRight className="h-3.5 w-3.5 shrink-0" />
				<Link
					to={`/course-builder?courseId=${course.id}`}
					className=" hover:text-ink"
				>
					{course.title}
				</Link>
				<ChevronRight className="h-3.5 w-3.5 shrink-0" />
				<span className="font-medium text-ink">
					{lesson.title || 'Untitled lesson'}
				</span>
			</nav>

			{/* Back to builder */}
			<Link
				to={`/course-builder?courseId=${course.id}`}
				className="inline-flex items-center gap-1.5 text-xs text-ink  hover:text-ink"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				Back to builder
			</Link>

			{/* Error */}
			{actionData?.error ? (
				<div className="text-sm text-error">{actionData.error}</div>
			) : null}

			{/* Editor form */}
			<Form method="post" className="space-y-6">
				<input type="hidden" name="intent" value="save-lesson" />
				<input
					type="hidden"
					name="challengeJson"
					value={challengeJson}
				/>

				<div>
					<div className="flex items-center justify-between gap-4">
						<div>
							<h2 className="text-lg font-bold text-ink">
								Lesson Editor
							</h2>
						</div>
						<button
							type="submit"
							disabled={isSaving}
							className="inline-flex items-center gap-2 rounded-lg bg-deep-green px-4 py-2 text-sm font-semibold text-on-dark  hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
						>
							<Save className="h-4 w-4" />
							{isSaving ? 'Saving...' : 'Save Lesson'}
						</button>
					</div>

					{/* Tabs */}
					<div className="mt-4 flex items-center gap-1 border-b border-hairline">
						<button
							type="button"
							onClick={() => setActiveTab('write')}
							className={`rounded-t-lg px-3 py-1.5 text-xs font-medium  ${
								activeTab === 'write'
									? 'border border-hairline border-b-canvas bg-canvas text-ink'
									: 'text-ink hover:text-body-muted'
							}`}
						>
							Write
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('preview')}
							className={`rounded-t-lg px-3 py-1.5 text-xs font-medium  ${
								activeTab === 'preview'
									? 'border border-hairline border-b-canvas bg-canvas text-ink'
									: 'text-ink hover:text-body-muted'
							}`}
						>
							Preview
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('challenge')}
							className={`rounded-t-lg flex items-center gap-1 px-3 py-1.5 text-xs font-medium  ${
								activeTab === 'challenge'
									? 'border border-hairline border-b-canvas bg-canvas text-ink'
									: 'text-ink hover:text-body-muted'
							}`}
						>
							<Flag className="h-3 w-3" />
							Challenge
						</button>
					</div>

					{/* Write tab */}
					{activeTab === 'write' && (
						<div className="mt-4 space-y-3">
							<div className="grid gap-3 md:grid-cols-[1.2fr_0.7fr_1fr]">
								<label className="space-y-1">
									<span className="text-xs font-medium text-ink">
										Lesson title
									</span>
									<input
										type="text"
										name="title"
										value={title}
										onChange={(e) =>
											setTitle(e.target.value)
										}
										className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none transition focus:border-deep-green/40 focus:ring-2 focus:ring-deep-green/10"
									/>
								</label>

								<label className="space-y-1">
									<span className="text-xs font-medium text-ink">
										Length (sec)
									</span>
									<input
										type="number"
										name="length"
										min={0}
										step={1}
										value={length}
										onChange={(e) =>
											setLength(Number(e.target.value))
										}
										className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none transition focus:border-deep-green/40 focus:ring-2 focus:ring-deep-green/10"
									/>
								</label>

								<label className="space-y-1">
									<span className="text-xs font-medium text-ink">
										Module
									</span>
									<select
										name="moduleId"
										value={moduleId}
										onChange={(e) =>
											setModuleId(Number(e.target.value))
										}
										className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none transition focus:border-deep-green/40 focus:ring-2 focus:ring-deep-green/10"
									>
										{allCourseModules.map((m) => (
											<option key={m.id} value={m.id}>
												{m.title || 'Untitled module'}
											</option>
										))}
									</select>
								</label>
							</div>

							<label className="space-y-1">
								<span className="text-xs font-medium text-ink">
									Markdown
								</span>
								<textarea
									name="contentMd"
									value={contentMd}
									onChange={(e) =>
										setContentMd(e.target.value)
									}
									rows={16}
									className="w-full rounded-lg border border-hairline bg-canvas px-3 py-3 font-mono text-sm leading-6 text-ink outline-none transition focus:border-deep-green/40 focus:ring-2 focus:ring-deep-green/10"
									placeholder="# Lesson title&#10;&#10;Start writing markdown here..."
								/>
							</label>
						</div>
					)}

					{/* Preview tab */}
					{activeTab === 'preview' && (
						<div className="mt-4">
							{contentMd.trim() ? (
								<Suspense
									fallback={
										<div className="h-48 bg-soft-stone rounded-xl animate-pulse" />
									}
								>
									<MarkdownContent content={contentMd} />
								</Suspense>
							) : (
								<p className="text-sm text-ink">
									No markdown yet for this lesson.
								</p>
							)}
						</div>
					)}

					{/* Challenge tab */}
					{activeTab === 'challenge' && (
						<div className="mt-4 space-y-4">
							<div className="flex items-center justify-between">
								<p className="text-xs text-muted">
									{questions.length} question
									{questions.length !== 1 ? 's' : ''}
								</p>
								<button
									type="button"
									onClick={addQuestion}
									className="inline-flex items-center gap-1 rounded-lg bg-deep-green px-2.5 py-1 text-xs font-medium text-on-dark  hover:brightness-110"
								>
									<Plus className="h-3 w-3" />
									Add Question
								</button>
							</div>

							{questions.length === 0 && (
								<div className="rounded-lg border border-dashed border-hairline px-3 py-4 text-xs text-muted">
									No challenge questions yet.
								</div>
							)}

							{questions.map((q, qIndex) => (
								<div
									key={q.key}
									className="border-b border-hairline pb-4 space-y-2"
								>
									<div className="flex items-center justify-between gap-4">
										<span className="text-xs font-bold uppercase tracking-wider text-muted">
											Question {qIndex + 1}
										</span>
										<button
											type="button"
											onClick={() =>
												removeQuestion(q.key)
											}
											className="text-error  hover:text-error"
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									</div>

									<label className="space-y-1">
										<span className="text-xs text-muted">
											Question text
										</span>
										<input
											type="text"
											value={q.questionText}
											onChange={(e) =>
												updateQuestion(
													q.key,
													'questionText',
													e.target.value,
												)
											}
											placeholder="What is the first step in..."
											className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-sm text-ink outline-none transition focus:border-deep-green/40 focus:ring-2 focus:ring-deep-green/10"
										/>
									</label>

									<label className="space-y-1">
										<span className="text-xs text-muted">
											Question type
										</span>
										<select
											value={q.type}
											onChange={(e) =>
												updateQuestion(
													q.key,
													'type',
													e.target.value,
												)
											}
											className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-sm text-ink outline-none transition focus:border-deep-green/40 focus:ring-2 focus:ring-deep-green/10"
										>
											<option value="multiple_choice">
												Multiple Choice
											</option>
											<option value="flag">Flag</option>
										</select>
									</label>

									{q.type === 'flag' && (
										<label className="space-y-1">
											<span className="text-xs text-muted">
												Correct answer
											</span>
											<input
												type="text"
												value={q.correctAnswer}
												onChange={(e) =>
													updateQuestion(
														q.key,
														'correctAnswer',
														e.target.value,
													)
												}
												placeholder="FLAG{...}"
												className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 font-mono text-sm text-ink outline-none transition focus:border-deep-green/40 focus:ring-2 focus:ring-deep-green/10"
											/>
										</label>
									)}

									{q.type === 'multiple_choice' && (
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-xs text-muted">
													Options
												</span>
												<button
													type="button"
													onClick={() =>
														addOption(q.key)
													}
													className="inline-flex items-center gap-1 rounded bg-soft-stone px-2 py-0.5 text-xs text-body-muted  hover:bg-hairline"
												>
													<Plus className="h-3 w-3" />
													Add
												</button>
											</div>
											{q.options.map((opt, optIndex) => (
												<div
													key={opt.key}
													className="flex items-center gap-2"
												>
													<input
														type="radio"
														name={`correct-${q.key}`}
														checked={opt.isCorrect}
														onChange={() =>
															markCorrect(
																q.key,
																opt.key,
															)
														}
														className="shrink-0 accent-primary"
													/>
													<input
														type="text"
														value={opt.optionText}
														onChange={(e) =>
															updateOption(
																q.key,
																opt.key,
																'optionText',
																e.target.value,
															)
														}
														placeholder={`Option ${optIndex + 1}`}
														className="flex-1 rounded-lg border border-hairline bg-canvas px-2.5 py-1.5 text-sm text-ink outline-none transition focus:border-deep-green/40 focus:ring-2 focus:ring-deep-green/10"
													/>
													<button
														type="button"
														onClick={() =>
															removeOption(
																q.key,
																opt.key,
															)
														}
														className="text-muted  hover:text-error"
													>
														<Trash2 className="h-3.5 w-3.5" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</Form>
		</div>
	)
}
