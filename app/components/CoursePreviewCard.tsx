import { useEffect, useRef, useState } from 'react'
import { Form, Link } from 'react-router'
import { Play, Share2 } from 'lucide-react'
import type { CourseDetails } from '~/.server/queries/course-detail'

type CoursePreviewCardProps = {
	course: CourseDetails
	continuePath: string
	enrolled: boolean
	isSubmittingEnrollment: boolean
}

export default function CoursePreviewCard({
	course,
	continuePath,
	enrolled,
	isSubmittingEnrollment,
}: CoursePreviewCardProps) {
	const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>(
		'idle',
	)
	const [isCollapsed, setIsCollapsed] = useState(false)
	const cardRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		if (shareState === 'idle') {
			return
		}

		const timeoutId = window.setTimeout(() => {
			setShareState('idle')
		}, 2000)

		return () => window.clearTimeout(timeoutId)
	}, [shareState])

	useEffect(() => {
		if (isCollapsed) {
			return
		}

		const timeoutId = window.setTimeout(() => {
			const card = cardRef.current
			if (card == null) {
				return
			}

			const rect = card.getBoundingClientRect()
			const viewportPadding = 24

			if (rect.bottom > window.innerHeight - viewportPadding) {
				window.scrollBy({
					top: rect.bottom - window.innerHeight + viewportPadding,
					behavior: 'smooth',
				})
			} else if (rect.top < viewportPadding) {
				window.scrollBy({
					top: rect.top - viewportPadding,
					behavior: 'smooth',
				})
			}
		}, 320)

		return () => window.clearTimeout(timeoutId)
	}, [isCollapsed])

	async function copyCourseAddress() {
		try {
			await navigator.clipboard.writeText(window.location.href)
			setShareState('copied')
		} catch {
			setShareState('error')
		}
	}

	return (
		<div
			ref={cardRef}
			className="bg-primary border border-hairline rounded-xl shadow-xl shadow-black/20 overflow-hidden"
		>
			<button
				type="button"
				onClick={() => setIsCollapsed((collapsed) => !collapsed)}
				aria-expanded={!isCollapsed}
				aria-label={
					isCollapsed
						? 'Expand course preview'
						: 'Collapse course preview'
				}
				className="group flex w-full justify-center border-b border-hairline bg-soft-stone/50 px-6 py-3 transition-colors hover:bg-soft-stone/70"
			>
				<span className="block h-1 w-16 rounded-full bg-muted/80 transition-colors group-hover:bg-on-primary" />
			</button>

			<div
				className={`grid transition-all duration-300 ease-out ${
					isCollapsed
						? 'grid-rows-[0fr] opacity-0'
						: 'grid-rows-[1fr] opacity-100'
				}`}
			>
				<div className="space-y-6 overflow-hidden p-6">
					<div className="aspect-video rounded-2xl overflow-hidden relative group">
						<img
							src={
								course?.thumbnail ??
								'https://picsum.photos/seed/course/1280/720'
							}
							alt={course?.title ?? 'Course'}
							className="w-full h-full object-cover"
							referrerPolicy="no-referrer"
						/>
						<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
							<div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
								<Play className="w-6 h-6 text-deep-green fill-deep-green ml-1" />
							</div>
						</div>
					</div>

					<div className="space-y-4">
						{enrolled ? (
							<Link
								to={continuePath}
								className="flex w-full items-center justify-center py-4 bg-deep-green text-on-dark rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-deep-green/20 active:scale-[0.98]"
							>
								Continue
							</Link>
						) : (
							<Form method="post">
								<button
									type="submit"
									disabled={isSubmittingEnrollment}
									className="w-full py-4 bg-deep-green text-on-dark rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-deep-green/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
								>
									{isSubmittingEnrollment
										? 'Enrolling...'
										: 'Enroll Now'}
								</button>
							</Form>
						)}

						<div className="grid grid-cols-1 gap-2">
							<button
								type="button"
								onClick={copyCourseAddress}
								className="w-full py-4 flex items-center justify-center gap-2 border border-hairline rounded-2xl text-sm font-medium text-ink hover:bg-soft-stone transition-colors"
							>
								<Share2 className="w-4 h-4" />
								{shareState === 'copied'
									? 'Copied'
									: shareState === 'error'
										? 'Copy Failed'
										: 'Share'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
