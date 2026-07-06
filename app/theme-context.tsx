import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
	theme: Theme
	toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('theme')
			if (saved === 'light' || saved === 'dark') return saved
		}
		return 'light'
	})

	useEffect(() => {
		localStorage.setItem('theme', theme)
		document.documentElement.dataset.theme = theme
	}, [theme])

	function toggleTheme() {
		setTheme((curr) => (curr === 'light' ? 'dark' : 'light'))
	}

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const ctx = useContext(ThemeContext)
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
	return ctx
}
