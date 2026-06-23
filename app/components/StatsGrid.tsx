import { BookOpen, GraduationCap, Clock, Star } from 'lucide-react'
import type { DashboardData } from '~/.server/queries/dashboard'
import { formatCourseLength } from '~/utils/format-course-length'

export default function StatsGrid({ courses }: { courses: DashboardData[] }) {
	const completed = courses.filter((c) => c.completed === true)
	const learnTime = completed.reduce((acc, obj) => acc + obj.length, 0)
	return (
		<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{[
				{
					label: 'Courses in Progress',
					value: courses.length,
					icon: BookOpen,
					color: 'text-blue-400',
					bg: 'bg-blue-400/10',
				},
				{
					label: 'Completed Courses',
					value: completed.length,
					icon: GraduationCap,
					color: 'text-emerald-400',
					bg: 'bg-emerald-400/10',
				},
				{
					label: 'Learning Hours',
					value: formatCourseLength(learnTime),
					icon: Clock,
					color: 'text-amber-400',
					bg: 'bg-amber-400/10',
				},
				{
					label: 'Achievement Points',
					value: '2,450',
					icon: Star,
					color: 'text-purple-400',
					bg: 'bg-purple-400/10',
				},
			].map((stat, i) => (
				<div
					key={i}
					className="bg-slate-900 border border-slate-800 p-6 rounded-xl"
				>
					<div
						className={
							stat.bg +
							' w-10 h-10 rounded-lg flex items-center justify-center mb-4'
						}
					>
						<stat.icon className={stat.color + ' w-5 h-5'} />
					</div>
					<p className="text-slate-400 text-sm font-medium">
						{stat.label}
					</p>
					<p className="text-2xl font-bold text-white mt-1">
						{stat.value}
					</p>
				</div>
			))}
		</section>
	)
}
