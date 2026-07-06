import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import type { DashboardData } from '~/.server/queries/dashboard'

export default function ContinueLearningCard({
	course,
}: {
	course: DashboardData
}) {
	if (!course) {
		return (
			<section className="border border-foreground-text border-dashed rounded-xl p-8 text-center">
				<h2 className="text-lg font-semibold text-foreground-text mb-1">
					No courses in progress
				</h2>
				<p className="text-foreground-text-secondary text-sm mb-4">
					Ready to level up your skills? Start your first lesson
					today.
				</p>
				<Link
					to="/courses"
					className="inline-flex items-center gap-2 text-primary hover:text-primary/75 font-medium text-sm"
				>
					Browse Courses <ArrowRight className="w-4 h-4" />
				</Link>
			</section>
		)
	}
	const percent = (
		(course.lessonsCompleted / course.lessonsCount) *
		100
	).toFixed(2)
	return (
		<div className="flex flex-col sm:flex-row gap-4 p-4 border border-foreground-text rounded-xl">
			<div className="w-full sm:w-48 aspect-video rounded-lg overflow-hidden relative group shrink-0">
				<img
					src={course.thumbnail}
					alt={course.title}
					className="w-full h-full object-cover"
					referrerPolicy="no-referrer"
				/>
			</div>

			<div className="flex-1 min-w-0 space-y-3">
				<div>
					<span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/25 px-2 py-0.5 rounded">
						{course.category}
					</span>
					<h3 className="text-base font-bold text-foreground-text mt-1 truncate">
						{course.title}
					</h3>
				</div>

				<div className="space-y-1.5">
					<div className="flex justify-between text-xs">
						<span className="text-foreground-text-secondary font-medium">
							{percent}% complete
						</span>
						<span className="text-foreground-text-secondary">
							{`${course.lessonsCompleted}/${course.lessonsCount}`}{' '}
							lessons
						</span>
					</div>
					<div className="h-1.5 w-full bg-foreground-text-secondary rounded-full overflow-hidden">
						<div
							className="h-full bg-primary/50 rounded-full"
							style={{ width: `${percent}%` }}
						/>
					</div>
				</div>

				<Link
					to={`/courses/${course.id}`}
					className="inline-flex items-center justify-center px-4 py-2 bg-primary/75 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
				>
					Resume Lesson
				</Link>
			</div>
		</div>
	)
}
