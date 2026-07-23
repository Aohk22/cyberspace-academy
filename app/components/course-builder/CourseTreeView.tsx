import { useState } from 'react'
import {
	ChevronRight,
	ChevronDown,
	ExternalLink,
	FileText,
	Folder,
	Plus,
	Trash2,
} from 'lucide-react'
import { Link } from 'react-router'
import type { ModuleDraft } from './types'

type CourseTreeViewProps = {
	modules: ModuleDraft[]
	courseId: number | null
	selectedModuleClientId: string | null
	onSelectModule: (moduleClientId: string) => void
	onAddModule: () => void
	onAddLesson: (moduleClientId: string) => void
	onUpdateModuleTitle: (moduleClientId: string, title: string) => void
	onUpdateLessonTitle: (
		moduleClientId: string,
		lessonClientId: string,
		title: string,
	) => void
	onDeleteModule: (moduleClientId: string) => void
	onDeleteLesson: (moduleClientId: string, lessonClientId: string) => void
}

export default function CourseTreeView({
	modules,
	courseId,
	selectedModuleClientId,
	onSelectModule,
	onAddModule,
	onAddLesson,
	onUpdateModuleTitle,
	onUpdateLessonTitle,
	onDeleteModule,
	onDeleteLesson,
}: CourseTreeViewProps) {
	const [expandedModules, setExpandedModules] = useState<Set<string>>(
		() => new Set(modules.map((m) => m.clientId)),
	)

	function toggleModule(moduleClientId: string) {
		setExpandedModules((prev) => {
			const next = new Set(prev)
			if (next.has(moduleClientId)) {
				next.delete(moduleClientId)
			} else {
				next.add(moduleClientId)
			}
			return next
		})
	}

	return (
		<div className="select-none">
			<div className="flex items-center justify-between gap-2">
				<p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
					Curriculum
				</p>
				<button
					type="button"
					onClick={onAddModule}
					className="inline-flex items-center gap-1 rounded-md border border-hairline px-1.5 py-0.5 text-[10px] font-medium text-body-muted  hover:bg-soft-stone hover:text-ink"
				>
					<Plus className="h-3 w-3" />
					Add Module
				</button>
			</div>

			<div className="mt-2 space-y-0.5">
				{modules.length === 0 ? (
					<div className="px-1 py-4 text-xs text-muted text-center">
						No modules yet. Add one to start structuring this
						course.
					</div>
				) : (
					modules.map((module) => {
						const isModuleSelected =
							selectedModuleClientId === module.clientId
						const isExpanded = expandedModules.has(module.clientId)

						return (
							<div key={module.clientId}>
								{/* Module row */}
								<div
									className={`group flex items-center gap-1 rounded-md px-1.5 py-1 text-sm  ${
										isModuleSelected
											? 'bg-deep-green/10 text-deep-green'
											: 'text-body-muted hover:bg-soft-stone'
									}`}
								>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											if (module.lessons.length > 0) {
												toggleModule(module.clientId)
											}
										}}
										className="shrink-0 p-0.5"
									>
										{module.lessons.length > 0 ? (
											isExpanded ? (
												<ChevronDown className="h-3.5 w-3.5 text-muted" />
											) : (
												<ChevronRight className="h-3.5 w-3.5 text-muted" />
											)
										) : (
											<span className="inline-block w-4" />
										)}
									</button>

									<Folder className="h-4 w-4 shrink-0 text-coral" />

									<input
										type="text"
										value={module.title}
										onFocus={() =>
											onSelectModule(module.clientId)
										}
										onClick={() =>
											onSelectModule(module.clientId)
										}
										onChange={(e) =>
											onUpdateModuleTitle(
												module.clientId,
												e.target.value,
											)
										}
										className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-ink outline-none  group-hover:border-hairline cursor-text placeholder:text-muted"
										placeholder="Module title"
									/>

									<span className="hidden shrink-0 text-[11px] text-muted group-hover:hidden">
										{module.lessons.length}
									</span>

									<div className="hidden group-hover:flex items-center gap-0.5">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation()
												onAddLesson(module.clientId)
											}}
											className="rounded-md p-1 text-muted hover:bg-hairline hover:text-ink "
											title="Add lesson"
										>
											<Plus className="h-3.5 w-3.5" />
										</button>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation()
												onDeleteModule(module.clientId)
											}}
											className="rounded-md p-1 text-muted hover:bg-error/20 hover:text-error "
											title="Delete module"
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									</div>
								</div>

								{/* Lessons */}
								{isExpanded && module.lessons.length > 0 && (
									<div className="ml-3 border-l border-hairline pl-2 space-y-0.5">
										{module.lessons.map((lesson) => {
											const lessonUrl =
												courseId != null &&
												lesson.id != null
													? `/course-builder/${courseId}/lessons/${lesson.id}`
													: null

											return (
												<div
													key={lesson.clientId}
													className="group flex items-center gap-1 rounded-md px-1.5 py-1 text-sm text-muted  hover:bg-soft-stone hover:text-ink"
												>
													<FileText className="h-4 w-4 shrink-0 text-muted" />

													<input
														type="text"
														value={lesson.title}
														onChange={(e) =>
															onUpdateLessonTitle(
																module.clientId,
																lesson.clientId,
																e.target.value,
															)
														}
														className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-ink outline-none  group-hover:border-hairline cursor-text placeholder:text-muted"
														placeholder="Untitled lesson"
													/>

													{lessonUrl ? (
														<Link
															to={lessonUrl}
															className="rounded-md p-1 text-muted opacity-0 group-hover:opacity-100 hover:bg-hairline hover:text-ink transition-all"
															title="Open lesson"
															onClick={(e) =>
																e.stopPropagation()
															}
														>
															<ExternalLink className="h-3.5 w-3.5" />
														</Link>
													) : null}

													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation()
															onDeleteLesson(
																module.clientId,
																lesson.clientId,
															)
														}}
														className="rounded-md p-1 text-muted opacity-0 group-hover:opacity-100 hover:bg-error/20 hover:text-error transition-all"
														title="Delete lesson"
													>
														<Trash2 className="h-3.5 w-3.5" />
													</button>
												</div>
											)
										})}
									</div>
								)}
							</div>
						)
					})
				)}
			</div>
		</div>
	)
}
