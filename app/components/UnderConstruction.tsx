import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Clock3, Construction, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

type UnderConstructionProps = {
	title: string
	description: string
	label?: string
	backHref?: string
	backLabel?: string
	children?: ReactNode
}

export default function UnderConstruction({
	title,
	description,
	label = 'Page under construction',
	backHref = '/',
	backLabel = 'Back to dashboard',
	children,
}: UnderConstructionProps) {
	return (
		<div className="space-y-8 pb-10">
			<motion.section
				initial={{ opacity: 0, y: 18 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35, ease: 'easeOut' }}
				className="under-construction-shell relative overflow-hidden rounded-[2rem] border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-500/10 p-8 sm:p-10"
			>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.2),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_28%)]" />

				<div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
					<div className="max-w-2xl space-y-5">
						<div className="under-construction-badge inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
							<Construction className="h-4 w-4" />
							{label}
						</div>

						<div className="space-y-3">
							<h1 className="text-3xl font-bold text-white sm:text-4xl">
								{title}
							</h1>
							<p className="max-w-xl text-base leading-7 text-slate-300">
								{description}
							</p>
						</div>

						<div className="flex flex-wrap gap-3">
							<Link
								to={backHref}
								className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
							>
								<ArrowLeft className="h-4 w-4" />
								{backLabel}
							</Link>
							<div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-300">
								<Clock3 className="h-4 w-4 text-amber-300" />
								We&apos;re polishing this experience now
							</div>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 lg:w-[22rem]">
						<div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
							<Sparkles className="mb-3 h-5 w-5 text-emerald-300" />
							<p className="text-sm font-semibold text-white">
								Sharper progress stories
							</p>
							<p className="mt-2 text-sm leading-6 text-slate-400">
								Badge history, streaks, and milestone tracking
								are being prepared.
							</p>
						</div>
						<div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
							<Construction className="mb-3 h-5 w-5 text-amber-300" />
							<p className="text-sm font-semibold text-white">
								Still in active build
							</p>
							<p className="mt-2 text-sm leading-6 text-slate-400">
								This route is live in navigation, but the final
								experience is not ready yet.
							</p>
						</div>
					</div>
				</div>
			</motion.section>

			{children ? (
				<section className="space-y-4">
					<div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
						<div className="h-px flex-1 bg-slate-800" />
						<span>Preview</span>
						<div className="h-px flex-1 bg-slate-800" />
					</div>
					<div className="pointer-events-none relative overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950/40">
						<div className="absolute inset-0 z-10 bg-slate-950/35 backdrop-blur-[3px]" />
						<div className="relative p-6 opacity-45 sm:p-8">
							{children}
						</div>
					</div>
				</section>
			) : null}
		</div>
	)
}
