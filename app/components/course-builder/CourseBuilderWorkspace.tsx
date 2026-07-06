import { Save, BookOpen, Download, Upload, Trash2, ExternalLink } from 'lucide-react'
import { Form, Link, useNavigate, useNavigation, useSubmit } from 'react-router'
import { useRef, useState } from 'react'
import type { Category } from '~/.server/database/types'
import CourseDetailsForm from './CourseDetailsForm'
import CourseTreeView from './CourseTreeView'
import type {
	BuilderCourse,
	CourseDraft,
	CurriculumModule,
	LessonDraft,
	ModuleDraft,
} from './types'

type CourseBuilderWorkspaceProps = {
	courses: BuilderCourse[]
	categories: Category[]
	selectedCourse: BuilderCourse | null
	curriculum: CurriculumModule[]
}

function createClientId(prefix: string) {
	return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function toLessonDraft(
	lesson: CurriculumModule['lessons'][number],
): LessonDraft {
	const rawQuestions: any[] = (lesson as any).challengeQuestions ?? []
	return {
		clientId: `lesson-${lesson.id}`,
		id: lesson.id,
		title: lesson.title,
		length: lesson.length,
		contentMd: lesson.contentMd,
		challengeQuestions: rawQuestions.map((q) => ({
			clientId: `chq-${q.id}`,
			id: q.id,
			questionText: q.questionText,
			type: q.type,
			correctAnswer: q.correctAnswer ?? '',
			options: (q.options ?? []).map((o: any) => ({
				clientId: `cho-${o.id}`,
				id: o.id,
				optionText: o.optionText,
				isCorrect: o.isCorrect,
			})),
		})),
	}
}

function toModuleDraft(module: CurriculumModule): ModuleDraft {
	return {
		clientId: `module-${module.id}`,
		id: module.id,
		title: module.title,
		lessons: module.lessons.map(toLessonDraft),
	}
}

function buildInitialDraft(
	selectedCourse: BuilderCourse | null,
	curriculum: CurriculumModule[],
	selectedModuleId: number | null,
): CourseDraft {
	const modules = curriculum.map(toModuleDraft)
	const initialSelectedModule =
		modules.find((module) => module.id === selectedModuleId) ??
		modules[0] ??
		null

	return {
		id: selectedCourse?.id ?? null,
		title: selectedCourse?.title ?? '',
		description: selectedCourse?.description ?? '',
		instructor: selectedCourse?.instructor ?? '',
		thumbnail: selectedCourse?.thumbnail ?? '',
		length: selectedCourse?.length ?? 0,
		categoryId: selectedCourse?.categoryId ?? null,
		modules,
		selectedModuleClientId: initialSelectedModule?.clientId ?? null,
		selectedLessonClientId: null,
	}
}

export default function CourseBuilderWorkspace({
	courses,
	categories,
	selectedCourse,
	curriculum,
}: CourseBuilderWorkspaceProps) {
	const navigate = useNavigate()
	const navigation = useNavigation()
	const submit = useSubmit()
	const importFileRef = useRef<HTMLInputElement>(null)
	const [draft, setDraft] = useState(() =>
		buildInitialDraft(selectedCourse, curriculum, null),
	)
	const isSaving = navigation.state === 'submitting'
	const hasSelection = selectedCourse != null || draft.id != null

	function updateDraft(updater: (current: CourseDraft) => CourseDraft) {
		setDraft((current) => updater(current))
	}

	function handleCourseFieldChange(
		field: 'title' | 'description' | 'instructor' | 'thumbnail',
		value: string,
	) {
		updateDraft((current) => ({ ...current, [field]: value }))
	}

	function handleLengthChange(value: number) {
		updateDraft((current) => ({
			...current,
			length: Number.isFinite(value) ? value : 0,
		}))
	}

	function handleCategoryChange(value: number | null) {
		updateDraft((current) => ({ ...current, categoryId: value }))
	}

	function handleSelectModule(moduleClientId: string) {
		updateDraft((current) => ({
			...current,
			selectedModuleClientId: moduleClientId,
		}))
	}

	function handleAddModule() {
		const moduleClientId = createClientId('module')
		updateDraft((current) => ({
			...current,
			modules: [
				...current.modules,
				{
					clientId: moduleClientId,
					id: null,
					title: '',
					lessons: [],
				},
			],
			selectedModuleClientId: moduleClientId,
		}))
	}

	function handleUpdateModuleTitle(moduleClientId: string, title: string) {
		updateDraft((current) => ({
			...current,
			modules: current.modules.map((module) =>
				module.clientId === moduleClientId
					? { ...module, title }
					: module,
			),
		}))
	}

	function handleAddLesson(moduleClientId: string) {
		const lessonClientId = createClientId('lesson')
		updateDraft((current) => ({
			...current,
			modules: current.modules.map((module) =>
				module.clientId === moduleClientId
					? {
						...module,
						lessons: [
							...module.lessons,
							{
								clientId: lessonClientId,
								id: null,
								title: '',
								length: 0,
								contentMd: '',
								challengeQuestions: [],
							},
						],
					}
					: module,
			),
			selectedModuleClientId: moduleClientId,
		}))
	}

	function handleDeleteModule(moduleClientId: string) {
		updateDraft((current) => {
			const moduleIndex = current.modules.findIndex(
				(m) => m.clientId === moduleClientId,
			)
			const nextModules = current.modules.filter(
				(m) => m.clientId !== moduleClientId,
			)
			let nextSelectedModule = current.selectedModuleClientId

			if (current.selectedModuleClientId === moduleClientId) {
				const newIndex = Math.min(moduleIndex, nextModules.length - 1)
				const target = nextModules[newIndex] ?? null
				nextSelectedModule = target?.clientId ?? null
			}

			return {
				...current,
				modules: nextModules,
				selectedModuleClientId: nextSelectedModule,
			}
		})
	}

	function handleUpdateLessonTitle(
		moduleClientId: string,
		lessonClientId: string,
		title: string,
	) {
		updateDraft((current) => ({
			...current,
			modules: current.modules.map((module) =>
				module.clientId === moduleClientId
					? {
						...module,
						lessons: module.lessons.map((lesson) =>
							lesson.clientId === lessonClientId
								? { ...lesson, title }
								: lesson,
						),
					}
					: module,
			),
		}))
	}

	function handleDeleteLesson(
		moduleClientId: string,
		lessonClientId: string,
	) {
		updateDraft((current) => ({
			...current,
			modules: current.modules.map((module) =>
				module.clientId === moduleClientId
					? {
						...module,
						lessons: module.lessons.filter(
							(l) => l.clientId !== lessonClientId,
						),
					}
					: module,
			),
		}))
	}

	function handleCourseChange(event: React.ChangeEvent<HTMLSelectElement>) {
		const value = event.target.value
		if (value === '__new__') {
			navigate('/course-builder')
		} else if (value) {
			navigate(`/course-builder?courseId=${value}`)
		}
	}

	function handleImportClick() {
		importFileRef.current?.click()
	}

	function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = () => {
			submit(
				{
					intent: 'import-course',
					importJson: reader.result as string,
				},
				{ method: 'post' },
			)
		}
		reader.readAsText(file)
		e.target.value = ''
	}

	function handleRemoveCourse() {
		const courseId = selectedCourse?.id ?? draft.id
		if (courseId == null) return
		if (
			!window.confirm(
				'Remove this course permanently? This cannot be undone.',
			)
		)
			return
		submit(
			{ intent: 'delete-course', courseId: String(courseId) },
			{ method: 'post' },
		)
	}

	const totalLessons = draft.modules.reduce(
		(total, m) => total + m.lessons.length,
		0,
	)

	return (
		<Form method="post" className="space-y-6">
			<input type="hidden" name="intent" value="save-draft" />
			<input
				type="hidden"
				name="draftJson"
				value={JSON.stringify(draft)}
			/>

			<div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
				{/* Left panel — tree sidebar */}
				<aside className="xl:sticky xl:top-24 h-fit space-y-3">
					{/* Course selector */}
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-widest text-foreground-text-muted">
							Course
						</p>
						<select
							value={selectedCourse?.id ?? '__new__'}
							onChange={handleCourseChange}
							className="mt-1.5 w-full rounded-lg border border-foreground-elevated bg-foreground px-2 py-1.5 text-sm text-foreground-text outline-none transition focus:border-primary/40"
						>
							<option value="__new__">New Course</option>
							{courses.map((course) => (
								<option key={course.id} value={course.id}>
									{course.title}
								</option>
							))}
						</select>
					</div>

					{/* Tree */}
					{hasSelection && (
						<CourseTreeView
							modules={draft.modules}
							courseId={selectedCourse?.id ?? null}
							selectedModuleClientId={
								draft.selectedModuleClientId
							}
							onSelectModule={handleSelectModule}
							onAddModule={handleAddModule}
							onAddLesson={handleAddLesson}
							onUpdateModuleTitle={handleUpdateModuleTitle}
							onUpdateLessonTitle={handleUpdateLessonTitle}
							onDeleteModule={handleDeleteModule}
							onDeleteLesson={handleDeleteLesson}
						/>
					)}

					{/* Stats */}
					<div className="border-t border-foreground-elevated pt-2 text-[11px] text-foreground-text-muted">
						{draft.modules.length} module
						{draft.modules.length !== 1 ? 's' : ''}, {totalLessons}{' '}
						lesson{totalLessons !== 1 ? 's' : ''}
					</div>

					{/* Import / Export */}
					<div className="flex gap-2">
						{selectedCourse != null ? (
							<Link
								to={`/course-builder/${selectedCourse.id}/export`}
								className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-foreground-active bg-foreground px-3 py-2 text-xs font-semibold text-foreground-text-secondary transition-colors hover:bg-foreground-elevated"
							>
								<Download className="h-3.5 w-3.5" />
								Export
							</Link>
						) : null}
						<button
							type="button"
							onClick={handleImportClick}
							className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-foreground-active bg-foreground px-3 py-2 text-xs font-semibold text-foreground-text-secondary transition-colors hover:bg-foreground-elevated"
						>
							<Upload className="h-3.5 w-3.5" />
							Import
						</button>
					</div>
					<input
						ref={importFileRef}
						type="file"
						accept=".json"
						onChange={handleImportFileChange}
						className="hidden"
					/>

					{/* View on site */}
					{selectedCourse != null ? (
						<Link
							to={`/courses/${selectedCourse.id}`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-foreground-active bg-foreground px-3 py-2 text-xs font-semibold text-foreground-text-secondary transition-colors hover:bg-foreground-elevated"
						>
							<ExternalLink className="h-3.5 w-3.5" />
							View as user
						</Link>
					) : null}

					{/* Remove course */}
					{selectedCourse != null ? (
						<button
							type="button"
							onClick={handleRemoveCourse}
							className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose/20 bg-rose/8 px-3 py-2 text-xs font-semibold text-rose transition-colors hover:bg-rose/16"
						>
							<Trash2 className="h-3.5 w-3.5" />
							Remove Course
						</button>
					) : null}

					{/* Save */}
					<button
						type="submit"
						className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
						disabled={isSaving}
					>
						<Save className="h-3.5 w-3.5" />
						{isSaving ? 'Saving...' : 'Save All Changes'}
					</button>
				</aside>

				<div className="min-w-0">
					{selectedCourse != null || draft.id == null ? (
						<CourseDetailsForm
							categories={categories}
							draft={draft}
							isCreating={selectedCourse == null}
							onFieldChange={handleCourseFieldChange}
							onLengthChange={handleLengthChange}
							onCategoryChange={handleCategoryChange}
						/>
					) : (
						<div className="p-6 text-center">
							<p className="mt-3 text-sm font-medium text-foreground-text">
								Select a Course
							</p>
							<p className="mt-1 text-xs text-foreground-text-muted">
								Choose an existing course from the dropdown or
								start a new one.
							</p>
						</div>
					)}
				</div>
			</div>
		</Form>
	)
}
