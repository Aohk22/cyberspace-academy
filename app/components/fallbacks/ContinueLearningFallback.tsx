export default function ContinueLearningCardSkeleton() {
	return (
		<div className="bg-surface border border-hairline rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center animate-pulse">
			<div className="w-full md:w-1/3 aspect-video rounded-2xl bg-soft-stone" />
			<div className="flex-1 space-y-4 w-full">
				<div className="space-y-2">
					<div className="h-4 w-16 bg-soft-stone rounded-md" />
					<div className="h-7 w-2/3 bg-soft-stone rounded" />
				</div>
				<div className="space-y-2">
					<div className="flex justify-between">
						<div className="h-3 w-20 bg-soft-stone rounded" />
						<div className="h-3 w-16 bg-soft-stone rounded" />
					</div>
					<div className="h-2 w-full bg-soft-stone rounded-full" />
				</div>
				<div className="h-11 w-36 bg-soft-stone rounded-xl" />
			</div>
		</div>
	)
}
