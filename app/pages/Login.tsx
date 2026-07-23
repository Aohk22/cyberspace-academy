import z from 'zod'
import { motion } from 'motion/react'
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import ChromeIcon from '~/components/icons/ChromeIcon'
import GithubIcon from '~/components/icons/GithubIcon'
import {
	Form,
	Link,
	redirect,
	useNavigation,
	useSearchParams,
} from 'react-router'
import { getSession, commitSession } from '~/.server/auth/sessions'
import { validateCredentials } from '~/.server/auth/login'
import type { Route } from './+types/Login'
import { useState } from 'react'

export async function loader({ request }: Route.LoaderArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	if (session.has('userId')) return redirect('/')
}

export async function action({ request }: Route.ActionArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	const form = await request.formData()
	const username = form.get('email')
	const password = form.get('password')

	const validateSchema = z.object({
		username: z.email(),
		password: z.string(),
		remember: z.string().optional(),
	})

	const result = validateSchema.safeParse({ username, password })

	if (!result.success) {
		return { error: 'Error parsing login form data.' }
	}

	const user = await validateCredentials(
		result.data.username,
		result.data.password,
	)

	if (!user) {
		return { error: "User doesn't exist." }
	} else {
		const rememberMe = result.data.remember === 'on'
		session.set('userId', String(user.id))
		session.set('userName', user.name)
		session.set('userRole', user.role)
		session.set(
			'subscriptionEndsAt',
			user.subscriptionEndsAt?.toISOString() ?? null,
		)
		const cookie = await commitSession(
			session,
			rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : undefined,
		)
		return redirect('/', {
			headers: { 'Set-Cookie': cookie },
		})
	}
}

export default function Login({ actionData }: Route.ComponentProps) {
	const error: string = actionData ? actionData.error : ''
	const navigation = useNavigation()
	const isLoading = navigation.state === 'submitting'
	const [searchParams] = useSearchParams()
	const resetSuccess = searchParams.get('reset') === 'success'

	return (
		<div
			className="
			flex items-center justify-center p-6 
			min-h-screen 
			bg-canvas text-ink
			overflow-scroll
		"
		>
			<div className="max-w-md w-full">
				{/* Header */}
				<div className="flex flex-col items-center mb-10">
					<h1 className="text-ink text-3xl font-bold tracking-tight">
						CyberSpace Academy
					</h1>
					<p className="text-ink mt-2 font-medium">
						Empowering your future, one lesson at a time.
					</p>
				</div>

				{/* Login Card */}
				<div
					className="
					bg-surface rounded-xl shadow-2xl shadow-black/50 border border-hairline p-8 md:p-12
				"
				>
					{/* TODO: Check styling for password reset */}
					{resetSuccess && (
						<div className="mb-6 flex items-center gap-2 bg-deep-green/15 border border-deep-green/30 rounded-xl px-4 py-3 text-xs text-deep-green font-medium">
							<CheckCircle2 className="w-4 h-4 shrink-0" />
							Password reset successful. Sign in with your new
							password.
						</div>
					)}

					<div className="mb-8">
						<h2 className="text-ink text-2xl font-bold">
							Welcome Back
						</h2>
						<p className="text-ink  text-sm mt-1">
							Please enter your details to sign in.
						</p>
					</div>

					<Form method="POST" className="space-y-6">
						<div className="space-y-2">
							<label className="text-ink text-sm font-bold ml-1">
								Email Address
							</label>
							<div className="relative group">
								<Mail
									className="
									absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 
									text-ink group-focus-within:text-deep-green transition-colors
								"
								/>
								<input
									type="email"
									name="email"
									required
									placeholder="name@company.com"
									className="
										w-full pl-12 pr-4 py-4 
										bg-surface border border-ink 
										rounded-2xl text-sm 
										focus:bg-canvas focus:ring-2 
										focus:ring-deep-green focus:border-deep-green 
										outline-none transition-all
								"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center ml-1">
								<label className="text-ink text-sm font-bold">
									Password
								</label>
								<Link
									to="/forgot-password"
									className="text-xs font-bold text-deep-green"
								>
									Forgot Password?
								</Link>
							</div>
							<div className="relative group">
								<Lock
									className="
									absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 
									text-ink group-focus-within:text-deep-green transition-colors
								"
								/>
								<input
									type="password"
									name="password"
									required
									placeholder="••••••••"
									className="
										w-full pl-12 pr-4 py-4 
										bg-surface border border-ink 
										rounded-2xl text-sm 
										focus:bg-canvas focus:ring-2 
										focus:ring-deep-green focus:border-deep-green 
										outline-none transition-all
									"
								/>
							</div>
						</div>

						<div className="flex items-center gap-2 ml-1">
							<input
								type="checkbox"
								name="remember"
								id="remember"
								className="
									w-4 h-4 rounded border-ink bg-canvas 
									text-deep-green focus:ring-deep-green
								"
							/>
							<label
								htmlFor="remember"
								className="text-sm text-ink font-medium cursor-pointer"
							>
								Remember for 30 days
							</label>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className={`
								w-full py-4 text-sm rounded-2xl font-semibold transition-all shadow-lg 
								flex items-center justify-center gap-2 
								disabled:opacity-70 cursor-pointer 
								text-on-primary
								${
									error
										? 'bg-error hover:bg-error shadow-error/30'
										: 'bg-deep-green hover:bg-deep-green shadow-deep-green/30'
								}
							`}
						>
							{isLoading ? (
								<>
									Signing in{' '}
									<Loader2 className="w-5 h-5 animate-spin" />
								</>
							) : error ? (
								<>
									Try Again <ArrowRight className="w-5 h-5" />
								</>
							) : (
								<>
									Sign In <ArrowRight className="w-5 h-5" />
								</>
							)}
						</button>
					</Form>

					<div className="mt-8">
						<div className="relative flex items-center justify-center mb-8">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-hairline"></div>
							</div>
							<span className="relative px-4 bg-surface text-xs font-bold text-ink uppercase tracking-widest">
								Or continue with
							</span>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<button
								type="button"
								className="
								flex items-center justify-center gap-2 py-3 border
								border-ink rounded-xl text-sm font-bold text-ink
								hover:bg-surface transition-colors
							"
							>
								<ChromeIcon className="w-5 h-5" /> Google
							</button>
							<button
								type="button"
								className="
								flex items-center justify-center gap-2 py-3 border 
								border-ink rounded-xl text-sm font-bold text-ink
								hover:bg-surface transition-colors
							"
							>
								<GithubIcon className="w-5 h-5" /> GitHub
							</button>
						</div>
					</div>
				</div>

				<p className="mt-8 text-center text-ink font-medium">
					Don't have an account?{' '}
					<Link
						to="/register"
						className="text-ink font-bold hover:text-deep-green transition-colors"
					>
						Sign up for free
					</Link>
				</p>
			</div>
		</div>
	)
}
