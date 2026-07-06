import { Outlet, useMatches } from 'react-router'

type SectionValue =
	| string
	| ((match: {
		data?: unknown
		params?: Record<string, string | undefined>
	}) => string)

type SectionHandle = {
	title: SectionValue
	subtitle?: SectionValue
	contentClassName?: string
}

function resolveSectionValue(
	value: SectionValue | undefined,
	match: { data?: unknown; params?: Record<string, string | undefined> },
) {
	if (typeof value === 'function') {
		return value(match)
	}

	return value
}

export default function SectionLayout() {
	const matches = useMatches()
	const activeMatch = [...matches].reverse().find((match) => {
		if (!match.handle || typeof match.handle !== 'object') {
			return false
		}

		return 'section' in match.handle
	})
	const section =
		activeMatch &&
			activeMatch.handle &&
			typeof activeMatch.handle === 'object' &&
			'section' in activeMatch.handle
			? (activeMatch.handle.section as SectionHandle)
			: null
	const title =
		section && activeMatch
			? resolveSectionValue(section.title, activeMatch)
			: null
	const subtitle =
		section && activeMatch
			? resolveSectionValue(section.subtitle, activeMatch)
			: null
	const contentClassName = section?.contentClassName ?? ''

	return (
		<div
			className={contentClassName ? `${contentClassName} pb-10` : 'pb-10'}
		>
			{title ? (
				<header className="mb-6">
					<h1 className="text-2xl font-bold">{title}</h1>
					{subtitle ? (
						<p className="text-sm">{subtitle}</p>
					) : null}
				</header>
			) : null}
			<Outlet />
		</div>
	)
}
