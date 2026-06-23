import { Map, Clock, BookOpen } from 'lucide-react'
import { Link } from 'react-router'
import type { LearningPathWithCount } from '~/.server/database/types'
import { formatCourseLength } from '~/utils/format-course-length'

export default function PathCard({ path }: { path: LearningPathWithCount }) {
	return (
		<Link
			to={`/paths/${path.id}`}
			className="group flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors duration-300"
		>
			<div className="aspect-[16/10] overflow-hidden relative">
				{path.thumbnail ? (
					<img
						src={path.thumbnail}
						alt={path.title}
						className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
						referrerPolicy="no-referrer"
					/>
				) : (
					<div className="w-full h-full bg-slate-800 flex items-center justify-center">
						<Map className="w-12 h-12 text-slate-600" />
					</div>
				)}
			</div>

			<div className="p-6 flex-1 flex flex-col">
				<div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
					<div className="flex items-center gap-1">
						<Clock className="w-3 h-3" />
						{formatCourseLength(path.totalDuration)}
					</div>
					<div className="w-1 h-1 bg-slate-700 rounded-full" />
					<div className="flex items-center gap-1">
						<BookOpen className="w-3 h-3" />
						{path.coursesCount} courses
					</div>
				</div>

				<h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
					{path.title}
				</h3>

				{path.description && (
					<p className="text-sm text-slate-400 line-clamp-2">
						{path.description}
					</p>
				)}
			</div>
		</Link>
	)
}
