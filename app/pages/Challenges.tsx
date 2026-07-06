import { Search, Flag, CheckCircle2, XCircle, Send, Trophy, Users, X, Filter, Globe, Network, Lock, Fingerprint, Binary, Eye } from 'lucide-react'
import { useLoaderData, useSearchParams, useFetcher } from 'react-router'
import { use, useDeferredValue, useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Route } from './+types/Challenges'
import type { ChallengeView } from '~/.server/database/types'
import { getChallenges, submitFlag } from '~/.server/queries/challenges'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import { z } from 'zod'

export const handle = {
	section: {
		title: 'Challenges',
		subtitle: 'Test your skills with CTF-style challenges.',
	},
}

const CATEGORIES = [
	'web',
	'network',
	'crypto',
	'forensics',
	'binary',
	'osint',
] as const

const DIFFICULTIES = ['easy', 'medium', 'hard', 'insane'] as const

const categoryStyles: Record<string, string> = {
	web: 'text-primary bg-primary/10 border-primary/20',
	network: 'text-purple bg-purple/10 border-purple/20',
	crypto: 'text-star bg-star/10 border-star/20',
	forensics: 'text-cyan bg-cyan/10 border-cyan/20',
	binary: 'text-rose bg-rose/10 border-rose/20',
	osint: 'text-indigo bg-indigo/10 border-indigo/20',
}

const categoryIcons: Record<string, typeof Globe> = {
	web: Globe,
	network: Network,
	crypto: Lock,
	forensics: Fingerprint,
	binary: Binary,
	osint: Eye,
}

const difficultyStyles: Record<string, string> = {
	easy: 'text-primary bg-primary/10',
	medium: 'text-yellow bg-yellow/10',
	hard: 'text-orange bg-orange/10',
	insane: 'text-error bg-error/10',
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) throw new NoUserContextError('User resolved')

	const url = new URL(request.url)
	const category = url.searchParams.get('category')
	const difficulty = url.searchParams.get('difficulty')
	const search = url.searchParams.get('search')

	return {
		challenges: getChallenges({
			userId: user.id,
			category,
			difficulty,
			search,
		}),
	}
}

export async function action({ context, request }: Route.ActionArgs) {
	const user = context.get(userContext)
	if (user === null) throw new NoUserContextError('User resolved')

	const form = await request.formData()
	const intent = form.get('intent')

	if (intent === 'submit-flag') {
		const challengeId = z.coerce.number().parse(form.get('challengeId'))
		const flag = z.string().parse(form.get('flag'))

		return submitFlag({ challengeId, userId: user.id, flag })
	}

	return { error: 'Unknown intent' }
}

export default function Challenges() {
	const { challenges } = useLoaderData<typeof loader>()

	return (
		<Suspense fallback={<ChallengesSkeleton />}>
			<ChallengesContent challengesPromise={challenges} />
		</Suspense>
	)
}

function ChallengesContent({
	challengesPromise,
}: {
	challengesPromise: Promise<ChallengeView[]>
}) {
	const challenges = use(challengesPromise)

	return <ChallengesInner challenges={challenges} />
}

function ChallengesInner({ challenges }: { challenges: ChallengeView[] }) {
	const [searchParams, setSearchParams] = useSearchParams()
	const activeCategory = searchParams.get('category') ?? ''
	const activeDifficulty = searchParams.get('difficulty') ?? ''
	const [searchQuery, setSearchQuery] = useState(
		searchParams.get('search') ?? '',
	)
	const deferredSearchQuery = useDeferredValue(searchQuery)
	const [selectedChallenge, setSelectedChallenge] =
		useState<ChallengeView | null>(null)
	const [filterOpen, setFilterOpen] = useState(false)

	function setParam(key: string, value: string) {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev)
			if (value) {
				next.set(key, value)
			} else {
				next.delete(key)
			}
			return next
		})
	}

	const normalizedSearch = deferredSearchQuery.trim().toLowerCase()
	const filtered = normalizedSearch
		? challenges.filter((c) =>
			c.name.toLowerCase().includes(normalizedSearch),
		)
		: challenges

	const solvedCount = challenges.filter((c) => c.completed).length
	const totalPoints = challenges
		.filter((c) => c.completed)
		.reduce((sum, c) => sum + c.points, 0)

	const hasActiveFilters = activeCategory || activeDifficulty

	return (
		<>
			<div className="flex items-center gap-3 mb-4">
				{/* Completion statistics. */}
				<div className="flex items-center gap-4 text-sm shrink-0">
					<div className="flex items-center gap-1.5">
						<CheckCircle2 className="w-4 h-4 text-primary" />
						<span>
							<span className="font-semibold">
								{solvedCount}
							</span>
							/{challenges.length}
						</span>
					</div>
					<div className="flex items-center gap-1.5">
						<Trophy className="w-4 h-4" />
						<span>
							<span className="font-semibold">
								{totalPoints}
							</span>{' '}
							pts
						</span>
					</div>
				</div>

				{/* Search bar. */}
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-text-muted" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value)
							setSearchParams((prev) => {
								const next = new URLSearchParams(prev)
								if (e.target.value) {
									next.set('search', e.target.value)
								} else {
									next.delete('search')
								}
								return next
							})
						}}
						placeholder="Search by title..."
						className="
							w-full pl-9 pr-3 py-2 
							bg-foreground border border-background-text
							rounded-lg text-sm 
							placeholder-foreground-text outline-none 
							focus:border-primary
						"
					/>
				</div>

				{/* Filter button. */}
				<div className="relative">
					<button
						onClick={() => setFilterOpen(!filterOpen)}
						className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${hasActiveFilters
							? 'bg-foreground-elevated border-foreground-active text-foreground-text'
							: 'bg-foreground border-foreground-elevated text-foreground-text hover:text-foreground-text-secondary hover:border-foreground-active'
							}`}
					>
						<Filter className="w-3.5 h-3.5" />
						Filters
						{hasActiveFilters && (
							<span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
						)}
					</button>

					{filterOpen && (
						<>
							<div
								className="fixed inset-0 z-40"
								onClick={() => setFilterOpen(false)}
							/>
							<div className="absolute right-0 top-full mt-1 z-50 w-64 bg-foreground border border-foreground-elevated rounded-xl shadow-2xl p-4 space-y-4">
								<div>
									<h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground-text-muted mb-2">
										Category
									</h4>
									<div className="flex flex-wrap gap-1.5">
										<button
											onClick={() =>
												setParam('category', '')
											}
											className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${!activeCategory
												? 'bg-foreground-active text-foreground-text'
												: 'text-foreground-text hover:text-foreground-text-secondary'
												}`}
										>
											All
										</button>
										{CATEGORIES.map((cat) => (
											<button
												key={cat}
												onClick={() =>
													setParam(
														'category',
														activeCategory === cat
															? ''
															: cat,
													)
												}
												className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize border transition-all ${activeCategory === cat
													? `${categoryStyles[cat]}`
													: 'border-transparent text-foreground-text hover:text-foreground-text-secondary'
													}`}
											>
												{cat}
											</button>
										))}
									</div>
								</div>

								<div>
									<h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground-text-muted mb-2">
										Difficulty
									</h4>
									<div className="flex flex-wrap gap-1.5">
										<button
											onClick={() =>
												setParam('difficulty', '')
											}
											className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${!activeDifficulty
												? 'bg-foreground-active text-foreground-text'
												: 'text-foreground-text hover:text-foreground-text-secondary'
												}`}
										>
											All
										</button>
										{DIFFICULTIES.map((diff) => (
											<button
												key={diff}
												onClick={() =>
													setParam(
														'difficulty',
														activeDifficulty ===
															diff
															? ''
															: diff,
													)
												}
												className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${activeDifficulty === diff
													? `${difficultyStyles[diff]}`
													: 'text-foreground-text hover:text-foreground-text-secondary'
													}`}
											>
												{diff}
											</button>
										))}
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Active Filter Pills */}
			{hasActiveFilters && (
				<div className="flex flex-wrap items-center gap-1.5 mb-4">
					{activeCategory && (
						<span
							className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${categoryStyles[activeCategory]}`}
						>
							{activeCategory}
							<button
								onClick={() => setParam('category', '')}
								className="hover:text-foreground-text "
							>
								<X className="w-2.5 h-2.5" />
							</button>
						</span>
					)}
					{activeDifficulty && (
						<span
							className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${difficultyStyles[activeDifficulty]}`}
						>
							{activeDifficulty}
							<button
								onClick={() => setParam('difficulty', '')}
								className="hover:text-foreground-text "
							>
								<X className="w-2.5 h-2.5" />
							</button>
						</span>
					)}
				</div>
			)}

			{/* Challenge List */}
			{filtered.length > 0 ? (
				<div className="space-y-3">
					{filtered.map((challenge) => (
						<ChallengeCard
							key={challenge.id}
							challenge={challenge}
							onClick={() =>
								setSelectedChallenge(challenge)
							}
						/>
					))}
				</div>
			) : (
				<div className="border border-dashed border-foreground-elevated rounded-xl px-6 py-10 text-center">
					<h2 className="text-base font-bold text-foreground-text">
						No challenges found
					</h2>
					<p className="mt-1 text-sm text-foreground-text">
						Try adjusting your filters.
					</p>
				</div>
			)}

			{/* Challenge Popup */}
			<ChallengePopup
				challenge={selectedChallenge}
				onClose={() => setSelectedChallenge(null)}
			/>
		</>
	)
}

function ChallengeCard({
	challenge,
	onClick,
}: {
	challenge: ChallengeView
	onClick: () => void
}) {
	return (
		<button
			onClick={onClick}
			className={`w-full text-left rounded-xl border p-4 transition-all 
				hover:border-foreground-active 
				hover:bg-foreground/80 
				active:bg-foreground/20
				${challenge.completed
					? 'border-primary/30 bg-primary/5'
					: 'border-foreground-elevated bg-foreground/50'
				}`}
		>
			<div className="flex items-start gap-4">
				{/* Category Icon */}
				<div
					className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${categoryStyles[challenge.category] ||
						'text-foreground-text bg-foreground-elevated'
						}`}
				>
					{(() => {
						const Icon = categoryIcons[challenge.category]
						return Icon ? <Icon className="w-5 h-5" /> : null
					})()}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="text-sm font-bold text-foreground-text">
							{challenge.name}
						</h3>
						<span
							className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${difficultyStyles[challenge.difficulty]
								}`}
						>
							{challenge.difficulty}
						</span>
					</div>
					<p className="text-xs text-foreground-text leading-relaxed line-clamp-1 mb-1">
						{challenge.description}
					</p>
					<div className="flex items-center gap-3 text-[11px] text-foreground-text-muted">
						<span className="capitalize">
							{challenge.category}
						</span>
						<span className="text-foreground-text-muted">|</span>
						<span>
							{challenge.solveCount} solve
							{challenge.solveCount !== 1 ? 's' : ''}
						</span>
					</div>
				</div>

				<div className="text-right shrink-0">
					<div className="text-sm font-bold text-star">
						{challenge.points}
						<span className="text-[10px] text-foreground-text-muted font-medium">
							pts
						</span>
					</div>
					{challenge.completed && (
						<CheckCircle2 className="w-4 h-4 text-primary mt-1 ml-auto" />
					)}
				</div>
			</div>
		</button>
	)
}

function ChallengePopup({
	challenge,
	onClose,
}: {
	challenge: ChallengeView | null
	onClose: () => void
}) {
	const fetcher = useFetcher()
	const isSubmitting = fetcher.state !== 'idle'
	const result = fetcher.data as
		| { correct: boolean; points?: number }
		| { error: string }
		| null
	const isCorrect =
		result && 'correct' in result ? result.correct : null

	return (
		<AnimatePresence>
			{challenge && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-black/80 backdrop-blur-sm"
					/>
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className="relative w-full max-w-2xl bg-foreground rounded-xl shadow-2xl border border-foreground-elevated max-h-[85vh] overflow-y-auto"
					>
						{/* Header */}
						<div className="flex items-start justify-between gap-4 p-6 border-b border-foreground-elevated">
							<div className="flex items-center gap-3">
								<div
									className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryStyles[challenge.category]
										}`}
								>
									{(() => {
										const Icon = categoryIcons[challenge.category]
										return Icon ? <Icon className="w-6 h-6" /> : null
									})()}
								</div>
								<div>
									<h2 className="text-lg font-bold text-foreground-text">
										{challenge.name}
									</h2>
									<div className="flex items-center gap-2 mt-1">
										<span
											className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize border ${categoryStyles[challenge.category]
												}`}
										>
											{challenge.category}
										</span>
										<span
											className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${difficultyStyles[challenge.difficulty]
												}`}
										>
											{challenge.difficulty}
										</span>
									</div>
								</div>
							</div>
							<button
								onClick={onClose}
								className="p-1.5 text-foreground-text-muted hover:text-foreground-text hover:bg-foreground-elevated rounded-lg transition-all"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Body */}
						<div className="p-6 space-y-6">
							{/* Metadata */}
							<div className="flex items-center gap-4 text-sm">
								<div className="flex items-center gap-1.5 text-star">
									<Trophy className="w-4 h-4" />
									<span className="font-semibold">
										{challenge.points}
									</span>
									<span className="text-foreground-text-muted">
										points
									</span>
								</div>
								<div className="flex items-center gap-1.5 text-foreground-text">
									<Users className="w-4 h-4" />
									<span>
										{challenge.solveCount} solve
										{challenge.solveCount !== 1 ? 's' : ''}
									</span>
								</div>
							</div>

							{/* Tags */}
							{challenge.tags.length > 0 && (
								<div className="flex flex-wrap gap-1.5">
									{challenge.tags.map((tag) => (
										<span
											key={tag}
											className="text-[11px] text-foreground-text-muted bg-foreground-elevated px-2 py-0.5 rounded"
										>
											#{tag}
										</span>
									))}
								</div>
							)}

							{/* Problem Statement */}
							<div>
								<h3 className="text-sm font-bold text-foreground-text mb-2">
									Challenge
								</h3>
								<p className="text-sm text-foreground-text-secondary leading-relaxed whitespace-pre-wrap">
									{challenge.description}
								</p>
							</div>

							{/* Feedback Messages */}
							{isCorrect === true && (
								<div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4" />
									<span>
										Correct! +
										{result && 'points' in result
											? result.points
											: challenge.points}{' '}
										pts
									</span>
								</div>
							)}
							{isCorrect === false && (
								<div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error flex items-center gap-2">
									<XCircle className="w-4 h-4" />
									<span>Incorrect flag. Try again.</span>
								</div>
							)}
							{result && 'error' in result && (
								<div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error flex items-center gap-2">
									<XCircle className="w-4 h-4" />
									<span>{result.error}</span>
								</div>
							)}
							{challenge.completed && (
								<div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4" />
									<span>
										You have already solved this
										challenge.
									</span>
								</div>
							)}

							{/* Flag Submission */}
							{!challenge.completed && (
								<fetcher.Form
									method="post"
									className="space-y-3"
								>
									<input
										type="hidden"
										name="intent"
										value="submit-flag"
									/>
									<input
										type="hidden"
										name="challengeId"
										value={challenge.id}
									/>
									<div>
										<label className="block text-xs font-medium text-foreground-text mb-1.5">
											Flag
										</label>
										<div className="flex items-center gap-2">
											<input
												type="text"
												name="flag"
												placeholder="flag{...}"
												required
												disabled={isSubmitting}
												className="flex-1 rounded-lg border border-foreground-active bg-background px-3 py-2.5 text-sm text-foreground-text outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:opacity-50 font-mono"
											/>
											<button
												type="submit"
												disabled={isSubmitting}
												className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-foreground-text hover:bg-primary  disabled:opacity-40"
											>
												<Send className="w-4 h-4" />
												{isSubmitting
													? '...'
													: 'Submit'}
											</button>
										</div>
									</div>
								</fetcher.Form>
							)}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	)
}

function ChallengesSkeleton() {
	return (
		<div className="space-y-4 animate-pulse">
			<div className="flex items-center gap-3">
				<div className="h-4 w-32 bg-foreground-elevated rounded" />
				<div className="flex-1 h-9 bg-foreground-elevated rounded-lg" />
				<div className="h-9 w-24 bg-foreground-elevated rounded-lg" />
			</div>
			{[1, 2, 3].map((i) => (
				<div
					key={i}
					className="h-24 bg-foreground-elevated rounded-xl"
				/>
			))}
		</div>
	)
}
