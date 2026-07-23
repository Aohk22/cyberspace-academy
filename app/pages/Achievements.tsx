import React from 'react'
import {
	Trophy,
	Star,
	Target,
	Award,
	Zap,
	Flame,
	BookOpen,
	GraduationCap,
	TrendingUp,
	CheckCircle2,
	Lock,
	ChevronRight,
} from 'lucide-react'
import { Await } from 'react-router'
import { userContext } from '~/context'
import type { Route } from './+types/Achievements'
import { NoUserContextError } from '~/error'
import {
	getAchievementsData,
	type AchievementsData,
	type AchievementBadge,
} from '~/.server/queries/achievements'

export const handle = {
	section: {
		title: 'Achievements',
		subtitle: 'Track your progress and showcase your skills.',
	},
}

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null)
		throw new NoUserContextError('User context resolved to null.')

	return { data: getAchievementsData(user.id) }
}

const rarityStyles: Record<string, string> = {
	legendary: 'bg-coral/10 text-coral',
	epic: 'bg-purple/10 text-purple',
	rare: 'bg-deep-green/10 text-deep-green',
	common: 'bg-soft-stone text-ink',
}

function formatDate(value: Date | string | null): string {
	if (!value) return ''
	const d = typeof value === 'string' ? new Date(value) : value
	return d.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

function BadgeCard({ badge }: { badge: AchievementBadge }) {
	const pct = Math.min(
		100,
		Math.round((badge.progress / badge.criteriaValue) * 100),
	)

	return (
		<div
			className={`p-5 rounded-xl border flex items-center gap-4 transition-colors ${
				badge.earned
					? 'bg-surface border-deep-green/30'
					: 'bg-surface border-hairline'
			}`}
		>
			<div
				className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
					badge.earned ? 'bg-soft-stone' : 'bg-soft-stone opacity-50'
				}`}
			>
				{badge.earned ? (
					badge.icon
				) : (
					<Lock className="w-6 h-6 text-muted" />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between mb-1">
					<h4 className="font-bold text-ink truncate flex items-center gap-2">
						{badge.name}
						{badge.earned ? (
							<CheckCircle2 className="w-4 h-4 text-deep-green shrink-0" />
						) : null}
					</h4>
					<span
						className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
							rarityStyles[badge.rarity] ?? rarityStyles.common
						}`}
					>
						{badge.rarity}
					</span>
				</div>
				<p className="text-xs text-ink line-clamp-1">
					{badge.description}
				</p>
				{badge.earned ? (
					<p className="text-[10px] text-muted mt-2">
						Earned on {formatDate(badge.awardedAt)}
					</p>
				) : (
					<div className="mt-2">
						<div className="h-1.5 bg-soft-stone rounded-full overflow-hidden">
							<div
								className="h-full bg-primary rounded-full"
								style={{ width: `${pct}%` }}
							/>
						</div>
						<p className="text-[10px] text-muted mt-1">
							{badge.progress}/{badge.criteriaValue}
						</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default function Achievements({ loaderData }: Route.ComponentProps) {
	const { data } = loaderData

	const stats = data.then((d) => d.stats)
	const earnedCount = data.then(
		(d) => d.badges.filter((b) => b.earned).length,
	)
	const totalCount = data.then((d) => d.badges.length)

	return (
		<div className="space-y-10">
			{/* Stats Overview */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<StatTile
					label="Achievement Points"
					value={stats.then((s) => s.points)}
					icon={Star}
					color="text-coral"
					bg="bg-coral/10"
				/>
				<StatTile
					label="Challenges Solved"
					value={stats.then((s) => s.challengesSolved)}
					icon={Target}
					color="text-deep-green"
					bg="bg-deep-green/10"
				/>
				<StatTile
					label="Lessons Completed"
					value={stats.then((s) => s.lessonsCompleted)}
					icon={BookOpen}
					color="text-deep-green"
					bg="bg-deep-green/10"
				/>
				<StatTile
					label="Courses Completed"
					value={stats.then((s) => s.coursesCompleted)}
					icon={GraduationCap}
					color="text-purple"
					bg="bg-purple/10"
				/>
			</div>

			<div className="grid lg:grid-cols-3 gap-10">
				{/* Badges Grid */}
				<div className="lg:col-span-2 space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-bold text-ink flex items-center gap-2">
							<Trophy className="w-5 h-5 text-coral" />
							Your Badges
						</h2>
						<Await resolve={earnedCount}>
							{(earned) => (
								<Await resolve={totalCount}>
									{(total) => (
										<span className="text-sm font-bold text-deep-green">
											{earned}/{total} earned
										</span>
									)}
								</Await>
							)}
						</Await>
					</div>

					<React.Suspense
						fallback={
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{Array.from({ length: 6 }).map((_, i) => (
									<div
										key={i}
										className="h-24 bg-surface rounded-xl border border-hairline animate-pulse"
									/>
								))}
							</div>
						}
					>
						<Await resolve={data}>
							{(value: AchievementsData) => (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{value.badges.map((badge) => (
										<BadgeCard
											key={badge.id}
											badge={badge}
										/>
									))}
								</div>
							)}
						</Await>
					</React.Suspense>
				</div>

				{/* Recent Activity & Leaderboard */}
				<div className="space-y-6">
					<h2 className="text-xl font-bold text-ink flex items-center gap-2">
						<Flame className="w-5 h-5 text-orange" />
						Recent Activity
					</h2>

					<div className="bg-surface p-6 rounded-xl border border-hairline">
						<React.Suspense
							fallback={
								<div className="space-y-3">
									{Array.from({ length: 4 }).map((_, i) => (
										<div
											key={i}
											className="h-10 bg-soft-stone rounded-lg animate-pulse"
										/>
									))}
								</div>
							}
						>
							<Await resolve={data}>
								{(value: AchievementsData) =>
									value.recentActivity.length === 0 ? (
										<p className="text-xs text-muted">
											No challenges solved yet. Start with
											the challenges tab!
										</p>
									) : (
										<div className="space-y-3">
											{value.recentActivity.map((a) => (
												<div
													key={a.id}
													className="flex items-center gap-3"
												>
													<div className="w-8 h-8 rounded-lg bg-deep-green/10 flex items-center justify-center shrink-0">
														<CheckCircle2 className="w-4 h-4 text-deep-green" />
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-xs font-medium text-ink truncate">
															{a.name}
														</p>
														<p className="text-[10px] text-muted capitalize">
															{a.category} ·{' '}
															{formatDate(
																a.completedAt,
															)}
														</p>
													</div>
													<span className="text-xs font-bold text-coral">
														+{a.points}
													</span>
												</div>
											))}
										</div>
									)
								}
							</Await>
						</React.Suspense>
					</div>

					{/* Leaderboard */}
					<div className="bg-primary rounded-xl p-6 text-on-primary overflow-hidden relative">
						<div className="relative z-10">
							<div className="flex items-center gap-2 mb-4">
								<TrendingUp className="w-5 h-5" />
								<h3 className="font-bold">Leaderboard</h3>
							</div>
							<React.Suspense
								fallback={
									<div className="space-y-3">
										{Array.from({ length: 3 }).map(
											(_, i) => (
												<div
													key={i}
													className="h-8 bg-white/10 rounded-xl animate-pulse"
												/>
											),
										)}
									</div>
								}
							>
								<Await resolve={data}>
									{(value: AchievementsData) => (
										<div className="space-y-3">
											{value.leaderboard.map((entry) => (
												<div
													key={entry.id}
													className={`flex items-center justify-between p-2 rounded-xl ${
														entry.isCurrentUser
															? 'bg-white/25'
															: 'bg-white/10'
													}`}
												>
													<div className="flex items-center gap-3">
														<span className="text-xs font-bold w-4">
															{entry.rank}
														</span>
														<div className="w-6 h-6 rounded-full bg-white/20" />
														<span className="text-xs font-medium truncate max-w-[100px]">
															{entry.isCurrentUser
																? 'You'
																: entry.name}
														</span>
													</div>
													<span className="text-xs font-bold">
														{entry.points} pts
													</span>
												</div>
											))}
										</div>
									)}
								</Await>
							</React.Suspense>
						</div>
						<div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
					</div>
				</div>
			</div>
		</div>
	)
}

function StatTile({
	label,
	value,
	icon: Icon,
	color,
	bg,
}: {
	label: string
	value: Promise<number>
	icon: typeof Star
	color: string
	bg: string
}) {
	return (
		<div className="bg-surface p-6 rounded-xl border border-hairline">
			<div
				className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center mb-4`}
			>
				<Icon className={`w-6 h-6 ${color}`} />
			</div>
			<p className="text-sm font-medium text-ink">{label}</p>
			<React.Suspense
				fallback={
					<div className="h-8 w-16 bg-soft-stone rounded animate-pulse mt-1" />
				}
			>
				<Await resolve={value}>
					{(v: number) => (
						<h3 className="text-2xl font-bold text-ink mt-1">
							{v.toLocaleString()}
						</h3>
					)}
				</Await>
			</React.Suspense>
		</div>
	)
}
