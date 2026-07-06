import React from 'react'
import {
	Trophy,
	Star,
	Zap,
	Target,
	Award,
	Flame,
	TrendingUp,
	ChevronRight,
} from 'lucide-react'

export const handle = {
	section: {
		title: 'Achievements',
		subtitle: 'Track your progress and showcase your skills.',
	},
}

export default function Achievements() {
	const stats = [
		{
			label: 'Total XP',
			value: '12,450',
			icon: Star,
			color: 'text-star',
			bg: 'bg-star/10',
		},
		{
			label: 'Current Streak',
			value: '15 Days',
			icon: Flame,
			color: 'text-orange',
			bg: 'bg-orange/10',
		},
		{
			label: 'Courses Completed',
			value: '8',
			icon: Award,
			color: 'text-primary',
			bg: 'bg-primary/10',
		},
		{
			label: 'Skill Points',
			value: '850',
			icon: Zap,
			color: 'text-info',
			bg: 'bg-info/10',
		},
	]

	const badges = [
		{
			id: 1,
			title: 'Early Bird',
			description: 'Completed 5 lessons before 8 AM',
			icon: '🌅',
			date: 'Oct 12, 2025',
			rarity: 'Common',
		},
		{
			id: 2,
			title: 'Code Ninja',
			description: 'Solved 50 practical labs',
			icon: '🥷',
			date: 'Nov 05, 2025',
			rarity: 'Rare',
		},
		{
			id: 3,
			title: 'Fast Learner',
			description: 'Finished a course in under 3 days',
			icon: '⚡',
			date: 'Dec 20, 2025',
			rarity: 'Epic',
		},
		{
			id: 4,
			title: 'Community Hero',
			description: 'Helped 10 students in forums',
			icon: '🤝',
			date: 'Jan 15, 2026',
			rarity: 'Rare',
		},
		{
			id: 5,
			title: 'Perfect Score',
			description: '100% on a final exam',
			icon: '💯',
			date: 'Feb 02, 2026',
			rarity: 'Legendary',
		},
		{
			id: 6,
			title: 'Consistent',
			description: '30 day learning streak',
			icon: '📅',
			date: 'Feb 28, 2026',
			rarity: 'Epic',
		},
	]

	const milestones = [
		{
			title: 'Master Architect',
			progress: 75,
			target: 'Complete 5 Advanced Labs',
			current: '3/5',
		},
		{
			title: 'Knowledge Seeker',
			progress: 40,
			target: 'Read 20 Theory Lessons',
			current: '8/20',
		},
		{
			title: 'AI Specialist',
			progress: 90,
			target: 'Use AI Tutor 50 times',
			current: '45/50',
		},
	]

	return (
		<div className="space-y-10">
			{/* Stats Overview */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{stats.map((stat, idx) => (
					<div
						key={stat.label}
						className="bg-foreground p-6 rounded-xl border border-foreground-elevated"
					>
						<div
							className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center mb-4`}
						>
							<stat.icon className={`w-6 h-6 ${stat.color}`} />
						</div>
						<p className="text-sm font-medium text-foreground-text">
							{stat.label}
						</p>
						<h3 className="text-2xl font-bold text-foreground-text-hl mt-1">
							{stat.value}
						</h3>
					</div>
				))}
			</div>

			<div className="grid lg:grid-cols-3 gap-10">
				{/* Badges Grid */}
				<div className="lg:col-span-2 space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-bold text-foreground-text-hl flex items-center gap-2">
							<Trophy className="w-5 h-5 text-star" />
							Your Badges
						</h2>
						<button className="text-sm font-bold text-primary hover:text-primary">
							View All
						</button>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{badges.map((badge) => (
							<div
								key={badge.id}
								className="bg-foreground p-5 rounded-xl border border-foreground-elevated flex items-center gap-4 hover:border-primary/30 transition-colors group cursor-default"
							>
								<div className="w-16 h-16 bg-foreground-elevated rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
									{badge.icon}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between mb-1">
										<h4 className="font-bold text-foreground-text-hl truncate">
											{badge.title}
										</h4>
										<span
											className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
												badge.rarity === 'Legendary'
													? 'bg-star/10 text-star'
													: badge.rarity === 'Epic'
														? 'bg-purple/10 text-purple'
														: badge.rarity ===
															  'Rare'
															? 'bg-info/10 text-info'
															: 'bg-foreground-elevated text-foreground-text'
											}`}
										>
											{badge.rarity}
										</span>
									</div>
									<p className="text-xs text-foreground-text line-clamp-1">
										{badge.description}
									</p>
									<p className="text-[10px] text-foreground-text-muted mt-2">
										Earned on {badge.date}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Milestones & Progress */}
				<div className="space-y-6">
					<h2 className="text-xl font-bold text-foreground-text-hl flex items-center gap-2">
						<Target className="w-5 h-5 text-primary" />
						Next Milestones
					</h2>

					<div className="bg-foreground p-6 rounded-xl border border-foreground-elevated space-y-8">
						{milestones.map((milestone) => (
							<div key={milestone.title} className="space-y-3">
								<div className="flex justify-between items-end">
									<div>
										<h4 className="font-bold text-foreground-text-hl text-sm">
											{milestone.title}
										</h4>
										<p className="text-xs text-foreground-text mt-0.5">
											{milestone.target}
										</p>
									</div>
									<span className="text-xs font-bold text-primary">
										{milestone.current}
									</span>
								</div>
								<div className="h-2 bg-foreground-elevated rounded-full overflow-hidden">
									<div
										className="h-full bg-primary rounded-full"
										style={{
											width: `${milestone.progress}%`,
										}}
									/>
								</div>
							</div>
						))}

						<button className="w-full py-3 bg-foreground-elevated text-foreground-text-secondary rounded-2xl text-sm font-bold hover:bg-foreground-active transition-colors flex items-center justify-center gap-2">
							View All Milestones{' '}
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>

					{/* Leaderboard Preview */}
					<div className="bg-primary rounded-xl p-6 text-white overflow-hidden relative">
						<div className="relative z-10">
							<div className="flex items-center gap-2 mb-4">
								<TrendingUp className="w-5 h-5" />
								<h3 className="font-bold">Leaderboard</h3>
							</div>
							<p className="text-sm text-emerald-100 mb-4">
								You are in the top 5% of learners this month!
							</p>
							<div className="space-y-3">
								{[1, 2, 3].map((pos) => (
									<div
										key={pos}
										className="flex items-center justify-between bg-white/10 p-2 rounded-xl backdrop-blur-sm"
									>
										<div className="flex items-center gap-3">
											<span className="text-xs font-bold w-4">
												{pos}
											</span>
											<div className="w-6 h-6 rounded-full bg-white/20" />
											<span className="text-xs font-medium">
												Learner #{pos * 123}
											</span>
										</div>
										<span className="text-xs font-bold">
											{15000 - pos * 1000} XP
										</span>
									</div>
								))}
							</div>
						</div>
						<div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
					</div>
				</div>
			</div>
		</div>
	)
}
