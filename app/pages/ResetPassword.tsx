import { GraduationCap, Lock, Loader2, AlertCircle } from 'lucide-react'
import {
	Form,
	Link,
	redirect,
	useActionData,
	useNavigation,
	useSearchParams,
} from 'react-router'
import bcrypt from 'bcrypt'
import { sql, eq } from 'drizzle-orm'
import type { Route } from './+types/ResetPassword'
import { db } from '~/.server/database/connection'
import { passwordResetTokens } from '~/.server/database/schema'

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const token = url.searchParams.get('token')
	if (!token) {
		throw redirect('/forgot-password')
	}
	return null
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const token = formData.get('token') as string
	const password = formData.get('password') as string

	if (!token || !password || password.length < 8) {
		return { error: 'Password must be at least 8 characters.' }
	}

	const tokens = await db
		.select()
		.from(passwordResetTokens)
		.where(eq(passwordResetTokens.token, token))

	const resetToken = tokens[0]
	if (!resetToken) {
		return { error: 'Invalid or expired reset token.' }
	}

	if (resetToken.usedAt) {
		return { error: 'This reset link has already been used.' }
	}

	if (new Date() > resetToken.expiresAt) {
		return { error: 'This reset link has expired. Request a new one.' }
	}

	const hashed = await bcrypt.hash(password, 10)
	await db.execute(
		sql`UPDATE users SET password = ${hashed} WHERE id = ${resetToken.userId}`,
	)
	await db
		.update(passwordResetTokens)
		.set({ usedAt: new Date() })
		.where(eq(passwordResetTokens.id, resetToken.id))

	return redirect('/login?reset=success')
}

export default function ResetPassword() {
	const [searchParams] = useSearchParams()
	const token = searchParams.get('token') || ''
	const actionData = useActionData<typeof action>() as
		| { error?: string }
		| undefined
	const navigation = useNavigation()
	const isLoading = navigation.state === 'submitting'

	return (
		<div data-theme="dark" className="min-h-screen bg-background flex items-center justify-center p-6">
			<div className="max-w-md w-full">
				<div className="flex flex-col items-center mb-10">
					<div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
						<GraduationCap className="text-foreground-text-hl w-8 h-8" />
					</div>
					<h1 className="text-3xl font-bold text-foreground-text-hl tracking-tight">
						New Password
					</h1>
					<p className="text-foreground-text mt-2 font-medium">
						Choose a new password for your account.
					</p>
				</div>

				<div className="bg-foreground rounded-xl shadow-2xl shadow-black/50 border border-foreground-elevated p-8 md:p-12">
					{actionData?.error && (
						<div className="mb-6 flex items-center gap-2 bg-error/10 border border-error/30 rounded-xl px-4 py-3 text-xs text-error">
							<AlertCircle className="w-4 h-4 shrink-0" />
							{actionData.error}
						</div>
					)}

					<Form method="POST" className="space-y-6">
						<input type="hidden" name="token" value={token} />

						<div className="space-y-2">
							<label className="text-sm font-bold text-foreground-text-secondary ml-1">
								New Password
							</label>
							<div className="relative group">
								<Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-text-muted group-focus-within:text-primary transition-colors" />
								<input
									type="password"
									name="password"
									required
									minLength={8}
									placeholder="••••••••"
									className="w-full pl-12 pr-4 py-4 bg-foreground-elevated border border-foreground-active rounded-2xl text-sm text-foreground-text-hl focus:bg-foreground-active focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
								/>
							</div>
							<p className="text-[10px] text-foreground-text-muted ml-1">
								Must be at least 8 characters long.
							</p>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-4 bg-primary text-foreground-text-hl rounded-2xl font-bold hover:bg-primary transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70"
						>
							{isLoading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								'Reset Password'
							)}
						</button>
					</Form>
				</div>

				<p className="mt-8 text-center text-foreground-text-muted font-medium">
					<Link
						to="/login"
						className="text-primary font-bold hover:text-primary transition-colors"
					>
						Back to Login
					</Link>
				</p>
			</div>
		</div>
	)
}
