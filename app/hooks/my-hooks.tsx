import { useState, useEffect } from 'react'

export function usePrefersDark() {
	const [prefersDark, setPrefersDark] = useState(false) // safe default for SSR

	useEffect(() => {
		const mql = window.matchMedia('(prefers-color-scheme: dark)')
		setPrefersDark(mql.matches) // set real value after mount

		const handler = (e: any) => setPrefersDark(e.matches)
		mql.addEventListener('change', handler)
		return () => mql.removeEventListener('change', handler)
	}, [])

	return prefersDark
}
