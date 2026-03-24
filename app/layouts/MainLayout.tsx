import { Outlet, Link, useLocation, useMatches } from 'react-router'
import {
	LayoutDashboard,
	BookOpen,
	GraduationCap,
	Settings,
	Bell,
	Search,
	Zap,
	Sun,
	Moon,
	SquarePen,
	MessageCircle,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import PricingModal from '~/components/PricingModal'
import type { User } from '~/.server/database/schema'
import AiTutor from '~/components/AiTutor'

const baseNavItems = [
	{ label: 'Dashboard', href: '/', icon: LayoutDashboard },
	{ label: 'My Courses', href: '/courses', icon: BookOpen },
	{ label: 'Achievements', href: '/achievements', icon: GraduationCap },
	{ label: 'Settings', href: '/settings', icon: Settings },
]

export default function MainLayout() {
	const location = useLocation()
	const matches = useMatches()
	const [isPricingOpen, setIsPricingOpen] = useState(false)
	const [aiOpen, setAiOpen] = useState(false)
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
	const [sidebarWidth, setSidebarWidth] = useState(256)
	const [theme, setTheme] = useState<'light' | 'dark'>('dark')
	const resizeStateRef = useRef({
		isResizing: false,
		lastExpandedWidth: 256,
	})
	const currentUser = matches
		.map((match) => {
			if (
				match.data &&
				typeof match.data === 'object' &&
				'user' in match.data
			) {
				return match.data.user as User
			}

			return null
		})
		.find((user) => user !== null)
	const navItems =
		currentUser?.role === 'staff'
			? [
				...baseNavItems,
				{
					label: 'Course Builder',
					href: '/course-builder',
					icon: SquarePen,
				},
			]
			: baseNavItems

	useEffect(() => {
		const storedTheme = window.localStorage.getItem('theme')
		const nextTheme =
			storedTheme === 'light' || storedTheme === 'dark'
				? storedTheme
				: window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light'

		setTheme(nextTheme)
	}, [])

	useEffect(() => {
		function handleMouseMove(event: MouseEvent) {
			if (!resizeStateRef.current.isResizing) {
				return
			}

			const collapseThreshold = 170
			const minExpandedWidth = 220
			const maxExpandedWidth = 420

			if (event.clientX < collapseThreshold) {
				setIsSidebarCollapsed(true)
				return
			}

			const nextWidth = Math.min(
				Math.max(event.clientX, minExpandedWidth),
				maxExpandedWidth,
			)

			resizeStateRef.current.lastExpandedWidth = nextWidth
			setSidebarWidth(nextWidth)
			setIsSidebarCollapsed(false)
		}

		function handleMouseUp() {
			resizeStateRef.current.isResizing = false
			document.body.style.userSelect = ''
			document.body.style.cursor = ''
		}

		window.addEventListener('mousemove', handleMouseMove)
		window.addEventListener('mouseup', handleMouseUp)

		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}
	}, [])

	function startResize() {
		resizeStateRef.current.isResizing = true
		document.body.style.userSelect = 'none'
		document.body.style.cursor = 'col-resize'
	}

	function toggleTheme() {
		const nextTheme = theme === 'dark' ? 'light' : 'dark'
		setTheme(nextTheme)
		window.localStorage.setItem('theme', nextTheme)
		document.documentElement.dataset.theme = nextTheme
		document.documentElement.style.colorScheme = nextTheme
	}

	return (
		<div className="flex min-h-screen bg-slate-950 text-slate-200 transition-colors">
			{/* Sidebar */}
			<aside
				className="border-r border-slate-800 bg-slate-900 hidden md:flex flex-col sticky top-0 h-screen relative shrink-0"
				style={{ width: isSidebarCollapsed ? 88 : sidebarWidth }}
			>
				<div className="p-6">
					<div className="flex items-center justify-center">
						<Link
							to="/"
							className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'gap-3 min-w-0'}`}
						>
							<div className="h-8 w-8 shrink-0 bg-emerald-600 rounded-lg flex items-center justify-center">
								<GraduationCap className="text-white w-5 h-5" />
							</div>
							{!isSidebarCollapsed && (
								<span className="min-w-0 text-xl font-bold tracking-tight text-white leading-tight break-words">
									CyberSpace Academy
								</span>
							)}
						</Link>
					</div>
				</div>

				<nav className="flex-1">
					{navItems.map((item) => {
						const isActive = location.pathname === item.href
						return (
							<Link
								key={item.href}
								to={item.href}
								className={
									`flex items-center px-6 py-3 text-sm font-medium transition-colors relative ${isSidebarCollapsed
										? 'justify-center'
										: 'gap-3'
									} ` +
									(isActive
										? 'bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-500'
										: 'text-slate-400 hover:bg-slate-800 hover:text-white')
								}
								title={
									isSidebarCollapsed ? item.label : undefined
								}
							>
								<item.icon className="w-5 h-5" />
								{!isSidebarCollapsed && item.label}
							</Link>
						)
					})}

					{/* Pro Upgrade Card in Sidebar */}
					{!isSidebarCollapsed && currentUser?.role !== 'staff' && (
						<div className="mt-8 px-2">
							<div className="bg-emerald-600 rounded-xl p-4 text-white relative overflow-hidden group">
								<div className="relative z-10">
									<div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-3">
										<Zap className="w-4 h-4" />
									</div>
									<p className="font-bold text-sm mb-1">
										Go Pro
									</p>
									<p className="text-[10px] text-emerald-100 mb-3">
										Unlock all premium courses and
										certificates.
									</p>
									<button
										onClick={() => setIsPricingOpen(true)}
										className="w-full py-2 bg-white text-emerald-600 rounded-xl text-[10px] font-bold hover:bg-emerald-50 transition-colors"
									>
										Upgrade Now
									</button>
								</div>
								<div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
							</div>
						</div>
					)}
				</nav>

				<div
					role="separator"
					aria-orientation="vertical"
					aria-label="Resize sidebar"
					onMouseDown={startResize}
					className="absolute top-0 right-0 h-full w-2 cursor-col-resize bg-transparent hover:bg-emerald-500/15"
				/>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex flex-col min-w-0">
				{/* Header */}
				<header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
					<div className="flex-1 max-w-md relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
						<input
							type="text"
							placeholder="Search courses, lessons..."
							className="w-full pl-10 pr-4 py-2 bg-slate-800 border-transparent rounded-xl text-sm text-white focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
						/>
					</div>

					<div className="ml-6 flex items-center gap-4">
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={toggleTheme}
								className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors"
								aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
							>
								{theme === 'dark' ? (
									<Sun className="w-4 h-4" />
								) : (
									<Moon className="w-4 h-4" />
								)}
							</button>

							<button className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors relative">
								<Bell className="w-5 h-5" />
								<span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
							</button>
						</div>
					</div>
				</header>

				<PricingModal
					isOpen={isPricingOpen}
					onClose={() => setIsPricingOpen(false)}
				/>

				{/* Page Content */}
				<div className="p-6 md:p-10 max-w-7xl w-full mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						<Outlet />
					</motion.div>
				</div>
			</main>

			<button
				onClick={() => setAiOpen(true)}
				style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 8px 32px rgba(5,150,105,0.5)' }}
			>
				<MessageCircle style={{ width: 16, height: 16 }} />
				AI Tutor
			</button>
			<AiTutor isOpen={aiOpen} onClose={() => setAiOpen(false)} />
		</div>
	)
}
