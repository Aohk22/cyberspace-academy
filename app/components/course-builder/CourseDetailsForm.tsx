import type { ChangeEvent } from 'react'
import type { Category } from '~/.server/database/types'
import type { CourseDraft } from './types'

type CourseDetailsFormProps = {
	categories: Category[]
	draft: CourseDraft
	isCreating: boolean
	onFieldChange: (
		field: 'title' | 'description' | 'instructor' | 'thumbnail',
		value: string,
	) => void
	onLengthChange: (value: number) => void
	onCategoryChange: (value: number | null) => void
}

export default function CourseDetailsForm({
	categories,
	draft,
	isCreating,
	onFieldChange,
	onLengthChange,
	onCategoryChange,
}: CourseDetailsFormProps) {
	function handleNumberChange(event: ChangeEvent<HTMLInputElement>) {
		onLengthChange(Number(event.target.value))
	}

	function handleCategorySelect(event: ChangeEvent<HTMLSelectElement>) {
		const value = event.target.value
		onCategoryChange(value === '' ? null : Number(value))
	}

	return (
		<div className="space-y-4">
			<h2 className="text-base font-bold text-white">
				{isCreating ? 'Create Course' : 'Edit Course'}
			</h2>

			<div className="grid gap-4 md:grid-cols-2">
				<label className="space-y-1.5">
					<span className="text-xs font-medium text-slate-400">
						Title
					</span>
					<input
						type="text"
						value={draft.title}
						onChange={(event) =>
							onFieldChange('title', event.target.value)
						}
						className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/40"
					/>
				</label>

				<label className="space-y-1.5">
					<span className="text-xs font-medium text-slate-400">
						Instructor
					</span>
					<input
						type="text"
						value={draft.instructor}
						onChange={(event) =>
							onFieldChange('instructor', event.target.value)
						}
						className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/40"
					/>
				</label>
			</div>

			<label className="space-y-1.5">
				<span className="text-xs font-medium text-slate-400">
					Description
				</span>
				<textarea
					value={draft.description}
					onChange={(event) =>
						onFieldChange('description', event.target.value)
					}
					rows={3}
					maxLength={255}
					className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/40"
				/>
			</label>

			<div className="grid gap-4 md:grid-cols-[1.5fr_0.8fr_1fr]">
				<label className="space-y-1.5">
					<span className="text-xs font-medium text-slate-400">
						Thumbnail URL
					</span>
					<input
						type="url"
						value={draft.thumbnail}
						placeholder="https://example.com/thumbnail.jpg"
						onChange={(event) =>
							onFieldChange('thumbnail', event.target.value)
						}
						className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/40"
					/>
				</label>

				<label className="space-y-1.5">
					<span className="text-xs font-medium text-slate-400">
						Length (seconds)
					</span>
					<input
						type="number"
						min={0}
						step={1}
						value={draft.length}
						onChange={handleNumberChange}
						className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/40"
					/>
				</label>

				<label className="space-y-1.5">
					<span className="text-xs font-medium text-slate-400">
						Category
					</span>
					<select
						value={
							draft.categoryId == null
								? ''
								: String(draft.categoryId)
						}
						onChange={handleCategorySelect}
						className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/40"
					>
						<option value="">Select category</option>
						{categories.map((category) => (
							<option key={category.id} value={category.id}>
								{category.name}
							</option>
						))}
					</select>
				</label>
			</div>
		</div>
	)
}
