import { useState } from 'react'
import MarkdownContent from '~/components/MarkdownContent'
import { Plus, Trash2, Flag } from 'lucide-react'
import type { ModuleDraft, ChallengeQuestionDraft } from './types'

type LessonEditorPanelProps = {
	courseId: number | null
	modules: ModuleDraft[]
	selectedModuleClientId: string | null
	selectedLessonClientId: string | null
	onSelectModule: (moduleClientId: string) => void
	onLessonFieldChange: (
		moduleClientId: string,
		lessonClientId: string,
		field: 'title' | 'contentMd',
		value: string,
	) => void
	onLessonLengthChange: (
		moduleClientId: string,
		lessonClientId: string,
		value: number,
	) => void
	onChallengeQuestionChange: (
		moduleClientId: string,
		lessonClientId: string,
		questions: ChallengeQuestionDraft[],
	) => void
}

let questionClientIdCounter = 0
function nextQuestionClientId() {
	return `challenge-question-${++questionClientIdCounter}`
}

let optionClientIdCounter = 0
function nextOptionClientId() {
	return `challenge-option-${++optionClientIdCounter}`
}

function createBlankQuestion(): ChallengeQuestionDraft {
	return {
		clientId: nextQuestionClientId(),
		id: null,
		questionText: '',
		type: 'multiple_choice',
		correctAnswer: '',
		options: [
			{
				clientId: nextOptionClientId(),
				id: null,
				optionText: '',
				isCorrect: false,
			},
			{
				clientId: nextOptionClientId(),
				id: null,
				optionText: '',
				isCorrect: false,
			},
		],
	}
}

export default function LessonEditorPanel({
	courseId,
	modules,
	selectedModuleClientId,
	selectedLessonClientId,
	onSelectModule,
	onLessonFieldChange,
	onLessonLengthChange,
	onChallengeQuestionChange,
}: LessonEditorPanelProps) {
	const selectedModule =
		modules.find((module) => module.clientId === selectedModuleClientId) ??
		null
	const selectedLesson =
		selectedModule?.lessons.find(
			(lesson) => lesson.clientId === selectedLessonClientId,
		) ?? null
	const [activeTab, setActiveTab] = useState<
		'write' | 'preview' | 'challenge'
	>('write')

	const challengeQuestions = selectedLesson?.challengeQuestions ?? []

	function updateQuestions(questions: ChallengeQuestionDraft[]) {
		if (!selectedModule || !selectedLesson) return
		onChallengeQuestionChange(
			selectedModule.clientId,
			selectedLesson.clientId,
			questions,
		)
	}

	function addQuestion() {
		updateQuestions([...challengeQuestions, createBlankQuestion()])
	}

	function removeQuestion(clientId: string) {
		updateQuestions(
			challengeQuestions.filter((q) => q.clientId !== clientId),
		)
	}

	function updateQuestion(
		clientId: string,
		field: keyof ChallengeQuestionDraft,
		value: any,
	) {
		updateQuestions(
			challengeQuestions.map((q) =>
				q.clientId === clientId ? { ...q, [field]: value } : q,
			),
		)
	}

	function addOption(questionClientId: string) {
		updateQuestions(
			challengeQuestions.map((q) =>
				q.clientId === questionClientId
					? {
							...q,
							options: [
								...q.options,
								{
									clientId: nextOptionClientId(),
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

	function removeOption(questionClientId: string, optionClientId: string) {
		updateQuestions(
			challengeQuestions.map((q) =>
				q.clientId === questionClientId
					? {
							...q,
							options: q.options.filter(
								(o) => o.clientId !== optionClientId,
							),
						}
					: q,
			),
		)
	}

	function updateOption(
		questionClientId: string,
		optionClientId: string,
		field: string,
		value: any,
	) {
		updateQuestions(
			challengeQuestions.map((q) =>
				q.clientId === questionClientId
					? {
							...q,
							options: q.options.map((o) =>
								o.clientId === optionClientId
									? { ...o, [field]: value }
									: o,
							),
						}
					: q,
			),
		)
	}

	return (
		<div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="text-base font-bold text-white">
						Lesson Editor
					</h2>
					<p className="mt-1 text-xs text-slate-400">
						Write markdown freely. Nothing is submitted until you
						save the draft.
					</p>
				</div>
				{courseId != null && selectedLesson?.id != null ? (
					<a
						href={`/courses/${courseId}/lessons/${selectedLesson.id}`}
						className="rounded-xl border border-slate-800 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
					>
						Open Lesson
					</a>
				) : null}
			</div>

			{selectedModule && selectedLesson ? (
				<>
					<div className="mt-5 flex items-center gap-2 border-b border-slate-800">
						<button
							type="button"
							onClick={() => setActiveTab('write')}
							className={`rounded-t-xl px-4 py-2 text-sm font-medium transition-colors ${
								activeTab === 'write'
									? 'bg-slate-950 text-white border border-slate-800 border-b-slate-950'
									: 'text-slate-400 hover:text-slate-200'
							}`}
						>
							Write
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('preview')}
							className={`rounded-t-xl px-4 py-2 text-sm font-medium transition-colors ${
								activeTab === 'preview'
									? 'bg-slate-950 text-white border border-slate-800 border-b-slate-950'
									: 'text-slate-400 hover:text-slate-200'
							}`}
						>
							Preview
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('challenge')}
							className={`rounded-t-xl px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
								activeTab === 'challenge'
									? 'bg-slate-950 text-white border border-slate-800 border-b-slate-950'
									: 'text-slate-400 hover:text-slate-200'
							}`}
						>
							<Flag className="w-3.5 h-3.5" />
							Challenge
						</button>
					</div>

					{activeTab === 'write' && (
						<div className="mt-4 space-y-4">
							<div className="grid gap-4 md:grid-cols-[1.2fr_0.7fr]">
								<label className="space-y-2">
									<span className="text-sm font-medium text-slate-300">
										Lesson title
									</span>
									<input
										type="text"
										value={selectedLesson.title}
										onChange={(event) =>
											onLessonFieldChange(
												selectedModule.clientId,
												selectedLesson.clientId,
												'title',
												event.target.value,
											)
										}
										className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
									/>
								</label>

								<label className="space-y-2">
									<span className="text-sm font-medium text-slate-300">
										Length (seconds)
									</span>
									<input
										type="number"
										min={0}
										step={1}
										value={selectedLesson.length}
										onChange={(event) =>
											onLessonLengthChange(
												selectedModule.clientId,
												selectedLesson.clientId,
												Number(event.target.value),
											)
										}
										className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
									/>
								</label>
							</div>

							<label className="space-y-2">
								<span className="text-sm font-medium text-slate-300">
									Module
								</span>
								<select
									value={selectedModule.clientId}
									onChange={(event) =>
										onSelectModule(event.target.value)
									}
									className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
								>
									{modules.map((module) => (
										<option
											key={module.clientId}
											value={module.clientId}
										>
											{module.title || 'Untitled module'}
										</option>
									))}
								</select>
							</label>

							<label className="space-y-2">
								<span className="text-sm font-medium text-slate-300">
									Markdown
								</span>
								<textarea
									value={selectedLesson.contentMd}
									onChange={(event) =>
										onLessonFieldChange(
											selectedModule.clientId,
											selectedLesson.clientId,
											'contentMd',
											event.target.value,
										)
									}
									rows={18}
									className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-4 font-mono text-sm leading-6 text-slate-100 outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
									placeholder="# Lesson title&#10;&#10;Start writing markdown here..."
								/>
							</label>
						</div>
					)}

					{activeTab === 'preview' && (
						<div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
							{selectedLesson.contentMd.trim() ? (
								<MarkdownContent
									content={selectedLesson.contentMd}
								/>
							) : (
								<p className="text-sm text-slate-400">
									No markdown yet for this lesson.
								</p>
							)}
						</div>
					)}

					{activeTab === 'challenge' && (
						<div className="mt-4 space-y-6">
							<div className="flex items-center justify-between">
								<p className="text-sm text-slate-400">
									{challengeQuestions.length} question
									{challengeQuestions.length !== 1 ? 's' : ''}
								</p>
								<button
									type="button"
									onClick={addQuestion}
									className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
								>
									<Plus className="w-3 h-3" />
									Add Question
								</button>
							</div>

							{challengeQuestions.length === 0 && (
								<div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-6 text-sm text-slate-400">
									No challenge questions yet. Add one to test
									learners.
								</div>
							)}

							{challengeQuestions.map((q, qIndex) => (
								<div
									key={q.clientId}
									className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-4"
								>
									<div className="flex items-center justify-between gap-4">
										<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
											Question {qIndex + 1}
										</span>
										<button
											type="button"
											onClick={() =>
												removeQuestion(q.clientId)
											}
											className="text-red-400 hover:text-red-300 transition-colors"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>

									<label className="space-y-1.5">
										<span className="text-xs font-medium text-slate-400">
											Question text
										</span>
										<input
											type="text"
											value={q.questionText}
											onChange={(e) =>
												updateQuestion(
													q.clientId,
													'questionText',
													e.target.value,
												)
											}
											placeholder="What is the first step in..."
											className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
										/>
									</label>

									<label className="space-y-1.5">
										<span className="text-xs font-medium text-slate-400">
											Question type
										</span>
										<select
											value={q.type}
											onChange={(e) =>
												updateQuestion(
													q.clientId,
													'type',
													e.target.value,
												)
											}
											className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
										>
											<option value="multiple_choice">
												Multiple Choice
											</option>
											<option value="flag">Flag</option>
										</select>
									</label>

									{q.type === 'flag' && (
										<label className="space-y-1.5">
											<span className="text-xs font-medium text-slate-400">
												Correct answer
											</span>
											<input
												type="text"
												value={q.correctAnswer}
												onChange={(e) =>
													updateQuestion(
														q.clientId,
														'correctAnswer',
														e.target.value,
													)
												}
												placeholder="FLAG{...}"
												className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white font-mono outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
											/>
										</label>
									)}

									{q.type === 'multiple_choice' && (
										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<span className="text-xs font-medium text-slate-400">
													Options
												</span>
												<button
													type="button"
													onClick={() =>
														addOption(q.clientId)
													}
													className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
												>
													<Plus className="w-3 h-3" />
													Add Option
												</button>
											</div>
											{q.options.map((opt, optIndex) => (
												<div
													key={opt.clientId}
													className="flex items-center gap-3"
												>
													<input
														type="radio"
														name={`correct-${q.clientId}`}
														checked={opt.isCorrect}
														onChange={() =>
															updateQuestion(
																q.clientId,
																'options',
																q.options.map(
																	(o) =>
																		o.clientId ===
																		opt.clientId
																			? {
																					...o,
																					isCorrect: true,
																				}
																			: {
																					...o,
																					isCorrect: false,
																				},
																),
															)
														}
														className="accent-emerald-500 shrink-0"
													/>
													<input
														type="text"
														value={opt.optionText}
														onChange={(e) =>
															updateOption(
																q.clientId,
																opt.clientId,
																'optionText',
																e.target.value,
															)
														}
														placeholder={`Option ${optIndex + 1}`}
														className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
													/>
													<button
														type="button"
														onClick={() =>
															removeOption(
																q.clientId,
																opt.clientId,
															)
														}
														className="text-slate-500 hover:text-red-400 transition-colors"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</>
			) : (
				<div className="mt-5 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-6 text-sm text-slate-400">
					Select a lesson to edit its markdown.
				</div>
			)}
		</div>
	)
}
