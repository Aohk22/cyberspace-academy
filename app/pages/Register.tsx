import {
	GraduationCap,
	Mail,
	Lock,
	User,
	ArrowRight,
	Loader2,
} from 'lucide-react'
import { GithubIcon, ChromeIcon } from '~/components/icons/icons'
import { motion } from 'motion/react'
import { Form, Link, redirect, useNavigation } from 'react-router'
import { getSession } from '~/.server/auth/sessions'
import { register } from '~/.server/auth/register'
import type { Route } from './+types/Register'
import z from 'zod'

export async function loader({ request }: Route.LoaderArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	if (session.has('userId')) return redirect('/')
}

export async function action({ request }: Route.ActionArgs) {
	const form = await request.formData()
	const email = form.get('email')
	const username = form.get('username')
	const password = form.get('password')
	const checkbox = form.get('checkbox')

	if (!checkbox) {
		return { error: 'Must agree to terms of service' }
	}

	const registerSchema = z.object({
		email: z.string(),
		username: z.string(),
		password: z.string(),
	})

	const result = registerSchema.safeParse({ email, username, password })

	if (!result.success) {
		return { error: 'Error parsing registration form data.' }
	}

	const rowsChanged = await register(
		result.data.username,
		result.data.email,
		result.data.password,
	)

	if (rowsChanged == 1) {
		return redirect('/registration-success')
	} else {
		return { error: 'Error registering.' }
	}
}

export default function Register({ actionData }: Route.ComponentProps) {
	const error: string = actionData ? actionData.error : ''
	const navigation = useNavigation()
	const isLoading = navigation.state === 'submitting'

	return (
		<div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-200">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
				className="max-w-md w-full"
			>
				{/* Logo Area */}
				<div className="flex flex-col items-center mb-10">
					<div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-emerald-900/20">
						<GraduationCap className="text-white w-8 h-8" />
					</div>
					<h1 className="text-3xl font-bold text-white tracking-tight">
						CyberSpace Academy
					</h1>
					<p className="text-slate-400 mt-2 font-medium">
						Join thousands of learners worldwide.
					</p>
				</div>

				{/* Register Card */}
				<div className="bg-slate-900 rounded-xl shadow-2xl shadow-black/50 border border-slate-800 p-8 md:p-12">
					<div className="mb-8">
						<h2 className="text-2xl font-bold text-white">
							Create Account
						</h2>
						<p className="text-slate-400 text-sm mt-1">
							Start your 14-day free trial today.
						</p>
					</div>

					<Form method="POST" className="space-y-5">
						<div className="space-y-2">
							<label className="text-sm font-bold text-slate-300 ml-1">
								Full Name
							</label>
							<div className="relative group">
								<User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
								<input
									type="text"
									name="username"
									required
									placeholder="Alex Johnson"
									className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white focus:bg-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-bold text-slate-300 ml-1">
								Email Address
							</label>
							<div className="relative group">
								<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
								<input
									type="email"
									name="email"
									required
									placeholder="name@company.com"
									className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white focus:bg-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-bold text-slate-300 ml-1">
								Password
							</label>
							<div className="relative group">
								<Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
								<input
									type="password"
									name="password"
									required
									placeholder="••••••••"
									className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white focus:bg-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
								/>
							</div>
							<p className="text-[10px] text-slate-500 ml-1">
								Must be at least 8 characters long.
							</p>
						</div>

						<div className="flex items-start gap-2 ml-1">
							<input
								type="checkbox"
								name="checkbox"
								id="terms"
								required
								className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500"
							/>
							<label
								htmlFor="terms"
								className="text-xs text-slate-400 font-medium leading-relaxed"
							>
								I agree to the{' '}
								<button
									type="button"
									className="text-emerald-400 font-bold"
								>
									Terms of Service
								</button>{' '}
								and{' '}
								<button
									type="button"
									className="text-emerald-400 font-bold"
								>
									Privacy Policy
								</button>
								.
							</label>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className={`
								w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold 
								hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 
								active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed
								${
									error
										? 'bg-red-500 hover:bg-red-600 shadow-red-900/30'
										: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-900/30'
								}
							`}
						>
							{isLoading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : error ? (
								<p>{error}</p>
							) : (
								<>
									Create Account{' '}
									<ArrowRight className="w-5 h-5" />
								</>
							)}
						</button>
					</Form>

					<div className="mt-8">
						<div className="relative flex items-center justify-center mb-8">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-slate-800"></div>
							</div>
							<span className="relative px-4 bg-slate-900 text-xs font-bold text-slate-500 uppercase tracking-widest">
								Or sign up with
							</span>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<button className="flex items-center justify-center gap-2 py-3 border border-slate-700 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors">
								<ChromeIcon className="w-5 h-5" /> Google
							</button>
							<button className="flex items-center justify-center gap-2 py-3 border border-slate-700 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors">
								<GithubIcon className="w-5 h-5" /> GitHub
							</button>
						</div>
					</div>
				</div>

				<p className="mt-8 text-center text-slate-500 font-medium">
					Already have an account?{' '}
					<Link
						to="/login"
						className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
					>
						Sign in
					</Link>
				</p>
			</motion.div>
		</div>
	)
}
