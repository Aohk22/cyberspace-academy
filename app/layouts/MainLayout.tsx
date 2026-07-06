import {
	Outlet,
	Link,
	useLocation,
	useLoaderData,
} from 'react-router'
import {
	LayoutDashboard,
	GraduationCap,
	Settings,
	Zap,
	SquarePen,
	MessageCircle,
	Map,
	Users,
	BookMarked,
	Book,
	Swords,
	Moon,
	Sun,
} from 'lucide-react'
import { useState, lazy, Suspense } from 'react'
import { userContext } from '~/context'
import { useTheme } from '~/theme-context'
import type { Route } from './+types/MainLayout'
import { NoUserContextError } from '~/error'

const PricingModal = lazy(() => import('~/components/PricingModal'))
const AiTutor = lazy(() => import('~/components/AiTutor'))

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> }

const userNavItems: NavItem[] = [
	{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ label: 'Challenges', href: '/challenges', icon: Swords },
	{ label: 'Courses', href: '/courses', icon: Book },
	{ label: 'Learning Paths', href: '/learning-path', icon: Map },
	{ label: 'Achievements', href: '/achievements', icon: GraduationCap },
]

const staffNavItems: NavItem[] = [
	{ label: 'Admin Panel', href: '/admin', icon: LayoutDashboard },
	{ label: 'Course Builder', href: '/course-builder', icon: SquarePen },
	{ label: 'Users', href: '/users', icon: Users },
	{ label: 'Categories', href: '/categories', icon: BookMarked },
	{ label: 'Paths', href: '/paths-admin', icon: Map },
	{ label: 'Settings', href: '/settings', icon: Settings },
]

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null)
		throw new NoUserContextError('User context resolved to null.')

	return { user }
}

export default function MainLayout() {
	const { user } = useLoaderData()
	const location = useLocation()
	const [role, setRole] = useState(user.role)
	const [activeLink, setActiveLink] = useState(location.pathname)
	const [isPricingOpen, setIsPricingOpen] = useState(false)
	const [aiOpen, setAiOpen] = useState(false)
	const { theme, toggleTheme } = useTheme()
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

	function NavItem({ nav }: { nav: NavItem }) {
		return (
			<Link
				key={nav.href}
				to={nav.href}
				onClick={() => setActiveLink(nav.href)}
				className={
					`
					flex items-center
					${sidebarCollapsed ? 'justify-center px-0 py-2' : 'pl-4 pr-4 pt-2 pb-2 gap-2'}
					text-sm
					hover:text-foreground-text-hl
					hover:bg-foreground-text-hl-bg

					${(activeLink === nav.href) ?
						`
						border-primary border-r-5
						text-primary
					` :
						''
					}
					`
				}
				title={sidebarCollapsed ? nav.label : undefined}
			>
				<nav.icon className="" />
				{!sidebarCollapsed && nav.label}
			</Link>
		)
	}

	// TODO: remove colors
	function SubscriptionCard() {
		return (
			<div className="m-2">
				<div className="
				p-4 rounded-xl 
				max-w-50
				">
					<div className="relative z-10">
						<div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-3">
							<Zap className="w-4 h-4" />
						</div>
						<p className="font-bold text-sm mb-1">
							Go Pro
						</p>
						<p className="text-[10px] text-white mb-3">
							Unlock all premium courses and
							certificates.
						</p>
						<button
							onClick={() => setIsPricingOpen(true)}
							className="w-full py-2 bg-white  rounded-xl text-[10px] font-bold transition-colors"
						>
							Upgrade Now
						</button>
					</div>
					<div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
				</div>
			</div>
		)
	}

	return (
		<div data-theme={theme} className="
			flex min-h-screen
			w-full
			h-screen
			max-w-full
			overflow-hidden
		">
			<aside className={`
				relative flex-col border-r
				h-full
				bg-foreground
				text-foreground-text
				transition-all duration-150
				${sidebarCollapsed ? 'min-w-16 max-w-16' : 'min-w-52 max-w-52'}
			`}>
				<div className="p-4">
					<div className="flex items-center justify-center">
						<Link to="/" className="flex items-center justify-center">
							{sidebarCollapsed ? (
								<h1 className='font-bold text-xs'>CS</h1>
							) : (
								<h1 className='font-bold'>CyberSpace<br />Academy</h1>
							)}
						</Link>
					</div>
				</div>

				<nav className="flex-1">
					{userNavItems.map((item) => (
						<NavItem nav={item} />
					))}

					{role === 'staff' && (
						<>
							<hr className="my-3 border-t border-black" />

							{staffNavItems.map((item) => (
								<NavItem nav={item} />
							))}
						</>
					)}

					{role !== 'staff' && (
						<SubscriptionCard />
					)}

				</nav>

				<button
					type="button"
					onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
					className="
						absolute right-0 top-0
						w-3 cursor-col-resize
						h-full
						hover:bg-foreground-text-hl-bg
						flex items-center justify-center
					"
					title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				/>
			</aside>

			<main className="
				flex-1 flex flex-col min-w-0
			">
				<header className="
					h-16 min-h-16
					border-b sticky px-6 flex items-center justify-end gap-2
					bg-foreground
				">
					<button
						type="button"
						onClick={toggleTheme}
						className="p-2  hover: rounded-full"
						aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
					>
						{theme === 'dark' ? (
							<Sun className="w-4 h-4 text-foreground-text" />
						) : (
							<Moon className="w-4 h-4 text-foreground-text" />
						)}
					</button>
				</header>

				<div className="
					p-6 md:p-10 max-w-7xl w-full mx-auto
					h-full
					bg-background
					text-background-text
					overflow-scroll
				">
					<Outlet />
				</div>
			</main>

			<button onClick={() => setAiOpen(true)} className='
				flex fixed gap-2
				left-6 bottom-6
				p-2
				bg-primary
				text-white
				border
				border-black
				rounded-2xl
				ring-0
				ring-black
				z-999
			'>
				<MessageCircle />
				AI Tutor
			</button>

			<Suspense fallback={null}>
				<AiTutor
					isOpen={aiOpen}
					onClose={() => setAiOpen(false)}
				/>
			</Suspense>

			<Suspense fallback={null}>
				<PricingModal
					isOpen={isPricingOpen}
					onClose={() => setIsPricingOpen(false)}
				/>
			</Suspense>

		</div>
	)
}
