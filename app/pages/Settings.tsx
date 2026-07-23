import React, { useState } from 'react'
import { User, Shield, LogOut, CheckCircle2, AlertCircle } from 'lucide-react'
import { Form, redirect, useLoaderData, useFetcher } from 'react-router'
import {
	destroySession,
	getSession,
	commitSession,
} from '~/.server/auth/sessions'
import type { Route } from './+types/Settings'
import { userContext } from '~/context'

export const handle = {
	section: {
		title: 'Account Settings',
		subtitle: 'Manage your account and security settings.',
		contentClassName: 'mx-auto max-w-4xl',
	},
}

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new Error('User context resolved to null.')
	}
	const { getUserById } = await import('~/.server/database/utils')
	const fullUser = await getUserById(String(user.id))
	if (!fullUser) {
		throw new Error('User not found in database.')
	}
	return { user: fullUser }
}

export async function action({ request, context }: Route.ActionArgs) {
	const sessionUser = context.get(userContext)
	if (sessionUser === null) {
		throw new Error('User context resolved to null.')
	}

	const formData = await request.formData()
	const intent = formData.get('_action')

	if (intent === 'logout') {
		const session = await getSession(request.headers.get('Cookie'))
		return redirect('/login', {
			headers: {
				'Set-Cookie': await destroySession(session),
			},
		})
	}

	if (intent === 'update-profile') {
		const { updateUser } = await import('~/.server/database/utils')
		const session = await getSession(request.headers.get('Cookie'))

		const name = formData.get('name') as string
		const email = formData.get('email') as string

		await updateUser(sessionUser.id, { name, email })
		session.set('userName', name)

		return new Response(null, {
			headers: {
				'Set-Cookie': await commitSession(session),
			},
		})
	}

	if (intent === 'change-password') {
		const { updatePassword } = await import('~/.server/database/utils')
		const currentPassword = formData.get('currentPassword') as string
		const newPassword = formData.get('newPassword') as string

		const result = await updatePassword(
			sessionUser.id,
			currentPassword,
			newPassword,
		)
		return { passwordResult: result }
	}

	return null
}

export default function Settings() {
	const { user } = useLoaderData<typeof loader>()
	const passwordFetcher = useFetcher<{
		passwordResult?: { ok: boolean; error?: string }
	}>()
	const passwordResult = passwordFetcher.data?.passwordResult

	return (
		<div className="space-y-8">
			<Form method="POST" className="space-y-6">
				<input type="hidden" name="_action" value="update-profile" />
				<h2 className="text-lg font-bold text-ink">
					Account Information
				</h2>
				<div className="flex items-center gap-4 mb-6">
					<div className="w-16 h-16 rounded-full bg-soft-stone flex items-center justify-center overflow-hidden border border-hairline">
						<User className="w-8 h-8 text-muted" />
					</div>
					<h3 className="font-bold text-ink text-sm">{user.name}</h3>
				</div>

				<div className="grid sm:grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<label
							className="text-xs font-bold text-muted uppercase tracking-widest"
							htmlFor="name"
						>
							Full Name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							defaultValue={user.name}
							className="w-full px-3 py-2 bg-soft-stone/50 border border-hairline rounded-lg text-sm text-ink focus:bg-soft-stone focus:ring-2 focus:ring-deep-green/10 focus:border-deep-green outline-none transition-all"
						/>
					</div>
					<div className="space-y-1.5">
						<label
							className="text-xs font-bold text-muted uppercase tracking-widest"
							htmlFor="email"
						>
							Email Address
						</label>
						<input
							id="email"
							name="email"
							type="email"
							defaultValue={user.email}
							className="w-full px-3 py-2 bg-soft-stone/50 border border-hairline rounded-lg text-sm text-ink focus:bg-soft-stone focus:ring-2 focus:ring-deep-green/10 focus:border-deep-green outline-none transition-all"
						/>
					</div>
				</div>

				<div className="flex justify-end gap-3 pt-4 border-t border-hairline">
					<button
						type="reset"
						className="px-4 py-2 text-sm font-bold text-ink hover:text-body-muted "
					>
						Cancel
					</button>
					<button
						type="submit"
						className="px-6 py-2 bg-soft-stone text-ink rounded-lg text-sm font-bold hover:bg-hairline transition-all"
					>
						Save Changes
					</button>
				</div>
			</Form>

			<div className="space-y-6">
				<h2 className="text-lg font-bold text-ink">
					Security Settings
				</h2>

				<div className="space-y-3">
					<h4 className="font-bold text-ink text-sm">
						Change Password
					</h4>
					<passwordFetcher.Form method="POST" className="space-y-3">
						<input
							type="hidden"
							name="_action"
							value="change-password"
						/>
						<input
							type="password"
							name="currentPassword"
							required
							minLength={8}
							placeholder="Current Password"
							className="w-full px-3 py-2 bg-soft-stone/50 border border-hairline rounded-lg text-sm text-ink placeholder-muted focus:bg-soft-stone focus:ring-2 focus:ring-deep-green/10 focus:border-deep-green outline-none transition-all"
						/>
						<input
							type="password"
							name="newPassword"
							required
							minLength={8}
							placeholder="New Password (min 8 chars)"
							className="w-full px-3 py-2 bg-soft-stone/50 border border-hairline rounded-lg text-sm text-ink placeholder-muted focus:bg-soft-stone focus:ring-2 focus:ring-deep-green/10 focus:border-deep-green outline-none transition-all"
						/>
						<button
							type="submit"
							disabled={passwordFetcher.state === 'submitting'}
							className="w-full py-2 bg-soft-stone text-ink rounded-lg text-sm font-bold hover:bg-hairline transition-all disabled:opacity-50"
						>
							{passwordFetcher.state === 'submitting'
								? 'Updating...'
								: 'Update Password'}
						</button>
						{passwordResult?.ok && (
							<div className="flex items-center gap-2 text-xs text-deep-green bg-deep-green/10 rounded-lg px-3 py-2">
								<CheckCircle2 className="w-4 h-4" />
								Password updated successfully.
							</div>
						)}
						{passwordResult?.error && (
							<div className="flex items-center gap-2 text-xs text-error bg-error/10 rounded-lg px-3 py-2">
								<AlertCircle className="w-4 h-4" />
								{passwordResult.error}
							</div>
						)}
					</passwordFetcher.Form>
				</div>
			</div>

			<div className="flex justify-end pt-4 border-t border-hairline">
				<Form method="POST">
					<input type="hidden" name="_action" value="logout" />
					<button
						type="submit"
						className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-error transition-all hover:bg-error/10"
					>
						<LogOut className="w-4 h-4" />
						Sign Out
					</button>
				</Form>
			</div>
		</div>
	)
}
