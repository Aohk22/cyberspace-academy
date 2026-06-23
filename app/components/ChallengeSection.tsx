import { useFetcher } from 'react-router'
import { CheckCircle2, XCircle, Send, Flag } from 'lucide-react'
import type { ChallengeQuestionWithOptions } from '~/.server/queries/challenge'

type ChallengeSectionProps = {
	questions: ChallengeQuestionWithOptions[]
	lessonId: number
}

export default function ChallengeSection({
	questions,
	lessonId,
}: ChallengeSectionProps) {
	const correctCount = questions.filter((q) => q.submission?.isCorrect).length
	const totalCount = questions.length
	const allCorrect = correctCount === totalCount && totalCount > 0

	return (
		<div className="mt-10 border-t border-slate-800 pt-8">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center">
						<Flag className="w-4 h-4 text-amber-400" />
					</div>
					<h2 className="text-lg font-bold text-white">Challenge</h2>
				</div>
				<span className="text-sm text-slate-400">
					{correctCount}/{totalCount} correct
				</span>
			</div>

			{allCorrect && (
				<div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
					<CheckCircle2 className="w-4 h-4" />
					<span>All questions answered correctly!</span>
				</div>
			)}

			<div className="space-y-6">
				{questions.map((question, index) => (
					<QuestionCard
						key={question.id}
						question={question}
						index={index}
						lessonId={lessonId}
					/>
				))}
			</div>
		</div>
	)
}

function QuestionCard({
	question,
	index,
	lessonId,
}: {
	question: ChallengeQuestionWithOptions
	index: number
	lessonId: number
}) {
	const fetcher = useFetcher()
	const isSubmitting = fetcher.state !== 'idle'
	const submission = question.submission
	const isCorrect = submission?.isCorrect ?? false
	const hasSubmitted = submission != null

	const error =
		fetcher.data &&
		typeof fetcher.data === 'object' &&
		'error' in fetcher.data
			? (fetcher.data as { error: string }).error
			: null

	return (
		<div
			className={`rounded-2xl border p-5 transition-colors ${
				hasSubmitted
					? isCorrect
						? 'border-emerald-500/30 bg-emerald-500/5'
						: 'border-red-500/30 bg-red-500/5'
					: 'border-slate-800 bg-slate-900'
			}`}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-3 min-w-0">
					<span className="shrink-0 w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
						{index + 1}
					</span>
					<p className="text-sm font-medium text-slate-200 pt-1">
						{question.questionText}
					</p>
				</div>
				{hasSubmitted && (
					<div className="shrink-0 mt-1">
						{isCorrect ? (
							<CheckCircle2 className="w-5 h-5 text-emerald-400" />
						) : (
							<XCircle className="w-5 h-5 text-red-400" />
						)}
					</div>
				)}
			</div>

			<div className="mt-4 ml-10">
				{question.type === 'multiple_choice' ? (
					<MultipleChoiceInput
						question={question}
						lessonId={lessonId}
						disabled={isCorrect}
						fetcher={fetcher}
					/>
				) : (
					<FlagInput
						question={question}
						lessonId={lessonId}
						disabled={isCorrect}
						fetcher={fetcher}
					/>
				)}

				{hasSubmitted && !isCorrect && (
					<p className="mt-2 text-xs text-red-400">
						Incorrect. Try again.
					</p>
				)}

				{error && <p className="mt-2 text-xs text-red-400">{error}</p>}
			</div>
		</div>
	)
}

function MultipleChoiceInput({
	question,
	lessonId,
	disabled,
	fetcher,
}: {
	question: ChallengeQuestionWithOptions
	lessonId: number
	disabled: boolean
	fetcher: ReturnType<typeof useFetcher>
}) {
	return (
		<fetcher.Form method="post" className="space-y-2">
			<input type="hidden" name="intent" value="submit-challenge" />
			<input type="hidden" name="lessonId" value={lessonId} />
			<input type="hidden" name="questionId" value={question.id} />
			{question.options.map((opt) => (
				<label
					key={opt.id}
					className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
						disabled
							? 'border-emerald-800/50 bg-emerald-900/20 opacity-60 cursor-not-allowed'
							: 'border-slate-800 bg-slate-950 hover:border-emerald-500/40'
					}`}
				>
					<input
						type="radio"
						name="answer"
						value={String(opt.id)}
						disabled={disabled}
						className="accent-emerald-500"
					/>
					<span className="text-sm text-slate-300">
						{opt.optionText}
					</span>
				</label>
			))}
			{!disabled && (
				<button
					type="submit"
					disabled={fetcher.state !== 'idle'}
					className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-40"
				>
					<Send className="w-3 h-3" />
					Submit
				</button>
			)}
		</fetcher.Form>
	)
}

function FlagInput({
	question,
	lessonId,
	disabled,
	fetcher,
}: {
	question: ChallengeQuestionWithOptions
	lessonId: number
	disabled: boolean
	fetcher: ReturnType<typeof useFetcher>
}) {
	return (
		<fetcher.Form method="post" className="space-y-2">
			<input type="hidden" name="intent" value="submit-challenge" />
			<input type="hidden" name="lessonId" value={lessonId} />
			<input type="hidden" name="questionId" value={question.id} />
			<div className="flex items-center gap-2">
				<input
					type="text"
					name="answer"
					placeholder="Enter your answer..."
					disabled={disabled}
					className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50"
				/>
				{!disabled && (
					<button
						type="submit"
						disabled={fetcher.state !== 'idle'}
						className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-40"
					>
						<Send className="w-3 h-3" />
						Submit
					</button>
				)}
			</div>
		</fetcher.Form>
	)
}
