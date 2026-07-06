import { sql } from 'drizzle-orm'
import {
	CheckCircle2,
	Loader2,
	Lock,
	Mail,
	ShieldCheck,
	Trash2,
	User,
} from 'lucide-react'
import {
	data,
	Form,
	redirect,
	useActionData,
	useLoaderData,
	useNavigation,
} from 'react-router'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import type { Route } from './+types/AdminUserEdit'

export const handle = {
	section: {
		title: 'Edit User',
		subtitle: 'Update account details or change role.',
	},
}

const userSchema = z.object({
	id: z.coerce.number(),
	name: z.string(),
	email: z.string(),
	role: z.string(),
})

const updateSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	email: z.string().trim().email('Invalid email address'),
	password: z.string().optional(),
	role: z.enum(['learner', 'staff']),
})

export async function loader({ params, context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (user.role !== 'staff') {
		throw redirect('/')
	}

	const result = await db.execute(
		sql`SELECT id, name, email, role FROM users WHERE id = ${params.userId}`,
	)
	if (result.rows.length === 0) {
		throw redirect('/users')
	}

	return { user: userSchema.parse(result.rows[0]) }
}

export async function action({ request, params, context }: Route.ActionArgs) {
	const staffUser = context.get(userContext)
	if (staffUser === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (staffUser.role !== 'staff') {
		throw redirect('/')
	}

	const form = await request.formData()
	const intent = form.get('intent')

	if (intent === 'delete-user') {
		await db.execute(sql`DELETE FROM users WHERE id = ${params.userId}`)
		throw redirect('/users')
	}

	if (intent === 'update-user') {
		const parsed = updateSchema.safeParse({
			name: form.get('name'),
			email: form.get('email'),
			password: form.get('password') || undefined,
			role: form.get('role'),
		})

		if (!parsed.success) {
			return data(
				{ error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
				{ status: 400 },
			)
		}

		const { name, email, password, role } = parsed.data

		if (password) {
			const bcrypt = await import('bcrypt')
			const hashed = await bcrypt.hash(password, 10)
			await db.execute(
				sql`UPDATE users SET name = ${name}, email = ${email}, role = ${role}, password = ${hashed} WHERE id = ${params.userId}`,
			)
		} else {
			await db.execute(
				sql`UPDATE users SET name = ${name}, email = ${email}, role = ${role} WHERE id = ${params.userId}`,
			)
		}

		return data({ success: true, error: null })
	}

	return data({ error: 'Invalid intent.' }, { status: 400 })
}

export default function AdminUserEdit() {
	const { user } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>() as
		| { error: string; success?: undefined }
		| { success: true; error: null }
		| undefined
	const navigation = useNavigation()
	const isSubmitting = navigation.state === 'submitting'

	return (
		<div className="max-w-md">
			{actionData?.error ? (
				<div className="mb-4 rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">
					{actionData.error}
				</div>
			) : null}
			{actionData?.success ? (
				<div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
					<CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
					<span>User updated successfully.</span>
				</div>
			) : null}

			<div className="flex items-center justify-between gap-3 mb-4">
				<Form
					method="POST"
					onSubmit={(e) => {
						if (
							!window.confirm(
								`Delete user "${user.name}"? This cannot be undone.`,
							)
						) {
							e.preventDefault()
						}
					}}
				>
					<input
						type="hidden"
						name="intent"
						value="delete-user"
					/>
					<button
						type="submit"
						className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-xs font-bold text-error transition-colors hover:bg-error/20"
					>
						<Trash2 className="h-3.5 w-3.5" />
						Delete
					</button>
				</Form>
			</div>

			<Form method="POST" className="space-y-4">
				<div className="rounded-lg border border-foreground-elevated bg-foreground p-4 space-y-3">
					<div className="space-y-1">
						<label
							htmlFor="name"
							className="text-xs font-semibold text-foreground-text-secondary"
						>
							Full Name
						</label>
						<div className="relative">
							<User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-text-muted" />
							<input
								id="name"
								name="name"
								type="text"
								required
								defaultValue={user.name}
								className="w-full rounded-lg border border-foreground-active bg-foreground-elevated py-1.5 pl-9 pr-3 text-xs text-foreground-text-hl placeholder-foreground-text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
							/>
						</div>
					</div>

					<div className="space-y-1">
						<label
							htmlFor="email"
							className="text-xs font-semibold text-foreground-text-secondary"
						>
							Email Address
						</label>
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-text-muted" />
							<input
								id="email"
								name="email"
								type="email"
								required
								defaultValue={user.email}
								className="w-full rounded-lg border border-foreground-active bg-foreground-elevated py-1.5 pl-9 pr-3 text-xs text-foreground-text-hl placeholder-foreground-text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
							/>
						</div>
					</div>

					<div className="space-y-1">
						<label
							htmlFor="password"
							className="text-xs font-semibold text-foreground-text-secondary"
						>
							New Password
						</label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-text-muted" />
							<input
								id="password"
								name="password"
								type="password"
								placeholder="Leave blank to keep current"
								className="w-full rounded-lg border border-foreground-active bg-foreground-elevated py-1.5 pl-9 pr-3 text-xs text-foreground-text-hl placeholder-foreground-text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
							/>
						</div>
					</div>

					<div className="space-y-1">
						<label
							htmlFor="role"
							className="text-xs font-semibold text-foreground-text-secondary"
						>
							Role
						</label>
						<div className="relative">
							<ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-text-muted pointer-events-none" />
							<select
								id="role"
								name="role"
								required
								defaultValue={user.role}
								className="w-full appearance-none rounded-lg border border-foreground-active bg-foreground-elevated py-1.5 pl-9 pr-8 text-xs text-foreground-text-hl outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
							>
								<option value="learner">Learner</option>
								<option value="staff">Staff</option>
							</select>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3">
					<input type="hidden" name="intent" value="update-user" />
					<button
						type="submit"
						disabled={isSubmitting}
						className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-foreground-text-hl transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isSubmitting ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<CheckCircle2 className="h-3.5 w-3.5" />
						)}
						{isSubmitting ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</Form>
		</div>
	)
}
