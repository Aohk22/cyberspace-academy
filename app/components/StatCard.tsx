import type { LucideIcon } from 'lucide-react'
import { use } from 'react'
import { Suspense } from 'react'

type StatCardProps = {
	label: string
	value: Promise<string | number> | string | number
	icon: LucideIcon
}

function StatValue({
	value,
}: {
	value: Promise<string | number> | string | number
}) {
	const resolved = value instanceof Promise ? use(value) : value
	return <p className="text-xl font-bold">{resolved}</p>
}

function StatValueSkeleton() {
	return <div className="
		h-5 w-14 bg-foreground rounded animate-pulse
	" />
}

export default function StatCard({
	label,
	value,
	icon: Icon,
}: StatCardProps) {
	return (
		<div className="flex items-center gap-3 p-3">
			<div
				className='
					flex items-center justify-center
					w-9 h-9
					rounded-lg shrink-0 
				'
			>
				<Icon className='w-4 h-4' />
			</div>
			<div className="min-w-0">
				<p className="
					text-xs font-medium
				">{label}</p>
				<Suspense fallback={<StatValueSkeleton />}>
					<StatValue value={value} />
				</Suspense>
			</div>
		</div>
	)
}
