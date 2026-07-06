import { BookOpen, Clock, GraduationCap } from 'lucide-react'
import { Await, redirect } from 'react-router'
import { userContext } from '~/context'
import type { Route } from './+types/Dashboard'
import ContinueLearningCard from '~/components/ContinueLearning'
import RecommendedCourseCard from '~/components/RecommendedCourseCard'
import { NoUserContextError } from '~/error'
import {
	getDashboardData,
	type DashboardData,
} from '~/.server/queries/dashboard'
import React from 'react'
import StatCard from '~/components/StatCard'
import ContinueLearningFallback from '~/components/fallbacks/ContinueLearningFallback'
import RecommendedCourseFallback from '~/components/fallbacks/RecommendedCourseFallback'

export const handle = {
	section: {
		title: 'User Home',
		subtitle: 'Keep track of your learning.'
	}
}

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null)
		throw new NoUserContextError('User context resolved to null.')

	return { courses: getDashboardData(user.id) }
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
	let { courses } = loaderData

	const stats = courses.then((cs) => {
		let inProgress = 0
		let completed = 0
		let totalHours = 0
		for (const c of cs) {
			if (c.completed) {
				completed++
				totalHours += c.length
			} else {
				inProgress++
			}
		}
		return { inProgress, completed, totalHours }
	})

	return (
		<div className="space-y-8">
			<section className="grid grid-cols-3 gap-3">
				<StatCard
					label="Courses in Progress"
					value={stats.then((s) => s.inProgress)}
					icon={BookOpen}
				/>

				<StatCard
					label="Completed Courses"
					value={stats.then((s) => s.completed)}
					icon={GraduationCap}
				/>

				<StatCard
					label="Total learning hours"
					value={stats.then((s) => s.totalHours)}
					icon={Clock}
				/>
			</section>

			<section>
				<h2 className="
					text-lg font-semibold
					text-background-text
					mb-4
				">
					Continue Learning
				</h2>
				<React.Suspense fallback={<ContinueLearningFallback />}>
					<Await resolve={courses}>
						{(value) => <ContinueLearningCard course={value[0]} />}
					</Await>
				</React.Suspense>
			</section>

			<section>
				<h2 className="
					text-lg font-semibold text-background-text mb-4
				">
					All enrolled courses
				</h2>
				<React.Suspense fallback={<RecommendedCourseFallback />}>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<Await resolve={courses}>
							{(courses: DashboardData[]) =>
								courses.map((c) => (
									<RecommendedCourseCard course={c} />
								))
							}
						</Await>
					</div>
				</React.Suspense>
			</section>
		</div>
	)
}
