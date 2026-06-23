import React from 'react'
import { User, Shield, LogOut } from 'lucide-react'
import { Form, redirect, useLoaderData } from 'react-router'
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
	const user = context.get(userContext)
	if (user === null) {
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

		await updateUser(user.id, { name, email })
		session.set('userName', name)

		return new Response(null, {
			headers: {
				'Set-Cookie': await commitSession(session),
			},
		})
	}

	return null
}

export default function Settings() {
	const { user } = useLoaderData<typeof loader>()

	return (
		<div className="space-y-8">
			<Form method="POST" className="space-y-6">
				<input type="hidden" name="_action" value="update-profile" />
				<h2 className="text-lg font-bold text-white">
					Account Information
				</h2>
				<div className="flex items-center gap-4 mb-6">
					<div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
						<User className="w-8 h-8 text-slate-600" />
					</div>
					<h3 className="font-bold text-white text-sm">
						{user.name}
					</h3>
				</div>

				<div className="grid sm:grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<label
							className="text-xs font-bold text-slate-500 uppercase tracking-widest"
							htmlFor="name"
						>
							Full Name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							defaultValue={user.name}
							className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
						/>
					</div>
					<div className="space-y-1.5">
						<label
							className="text-xs font-bold text-slate-500 uppercase tracking-widest"
							htmlFor="email"
						>
							Email Address
						</label>
						<input
							id="email"
							name="email"
							type="email"
							defaultValue={user.email}
							className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
						/>
					</div>
				</div>

				<div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
					<button
						type="reset"
						className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						className="px-6 py-2 bg-slate-100 text-slate-950 rounded-lg text-sm font-bold hover:bg-white transition-all"
					>
						Save Changes
					</button>
				</div>
			</Form>

			<div className="space-y-6">
				<h2 className="text-lg font-bold text-white">
					Security Settings
				</h2>
				<div className="flex items-center justify-between py-3 border-b border-slate-800">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
							<Shield className="w-4 h-4 text-emerald-400" />
						</div>
						<div>
							<h4 className="font-bold text-white text-sm">
								Two-Factor Authentication
							</h4>
							<p className="text-xs text-slate-500">
								Add an extra layer of security.
							</p>
						</div>
					</div>
					<button className="text-sm font-bold text-emerald-400 hover:text-emerald-300">
						Enable
					</button>
				</div>

				<div className="space-y-3">
					<h4 className="font-bold text-white text-sm">
						Change Password
					</h4>
					<div className="space-y-3">
						<input
							type="password"
							placeholder="Current Password"
							className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
						/>
						<input
							type="password"
							placeholder="New Password"
							className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
						/>
						<button className="w-full py-2 bg-slate-100 text-black rounded-lg text-sm font-bold hover:bg-white transition-all">
							Update Password
						</button>
					</div>
				</div>
			</div>

			<div className="flex justify-end pt-4 border-t border-slate-800">
				<Form method="POST">
					<input type="hidden" name="_action" value="logout" />
					<button
						type="submit"
						className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-400 transition-all hover:bg-red-400/10"
					>
						<LogOut className="w-4 h-4" />
						Sign Out
					</button>
				</Form>
			</div>
		</div>
	)
}
