import { Await, useLoaderData } from 'react-router'
import { Suspense } from 'react'
import type { Route } from './+types/Paths'
import { getLearningPaths } from '~/.server/queries/learning-paths'
import type { LearningPathWithCount } from '~/.server/database/types'
import PathCard from '~/components/PathCard'

export const handle = {
	section: {
		title: 'Learning Paths',
		subtitle: 'Follow a curated sequence of courses to master a topic.',
	},
}

export async function loader(_: Route.LoaderArgs) {
	return { paths: getLearningPaths() }
}

export default function Paths() {
	const { paths } = useLoaderData<typeof loader>()

	return (
		<div className="space-y-8">
			<Suspense fallback={<PathsSkeleton />}>
				<Await resolve={paths}>
					{(resolvedPaths) => (
						<PathsInner
							paths={resolvedPaths as LearningPathWithCount[]}
						/>
					)}
				</Await>
			</Suspense>
		</div>
	)
}

function PathsInner({ paths }: { paths: LearningPathWithCount[] }) {
	return paths.length > 0 ? (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{paths.map((path) => (
				<PathCard key={path.id} path={path} />
			))}
		</div>
	) : (
		<div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-12 text-center">
			<h2 className="text-lg font-bold text-white">
				No learning paths yet
			</h2>
			<p className="mt-2 text-sm text-slate-400">
				Check back soon for curated learning paths.
			</p>
		</div>
	)
}

function PathsSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{[1, 2, 3].map((i) => (
				<div
					key={i}
					className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-pulse"
				>
					<div className="aspect-[16/10] bg-slate-800" />
					<div className="p-6 space-y-3">
						<div className="h-5 w-3/4 bg-slate-800 rounded" />
						<div className="h-4 w-full bg-slate-800 rounded" />
						<div className="h-4 w-2/3 bg-slate-800 rounded" />
					</div>
				</div>
			))}
		</div>
	)
}
