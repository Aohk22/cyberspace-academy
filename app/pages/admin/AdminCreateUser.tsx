import {
	CheckCircle2,
	Loader2,
	Mail,
	Lock,
	User,
	ShieldCheck,
} from 'lucide-react'
import {
	data,
	Form,
	redirect,
	useActionData,
	useNavigation,
} from 'react-router'
import { z } from 'zod'
import { register } from '~/.server/auth/register'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import type { Route } from './+types/AdminCreateUser'

export const handle = {
	section: {
		title: 'Create User',
		subtitle: 'Add a new learner or staff account.',
	},
}

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (user.role !== 'staff') {
		throw redirect('/')
	}
	return null
}

const createUserSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	email: z.string().trim().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	role: z.enum(['learner', 'staff']),
})

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (user.role !== 'staff') {
		throw redirect('/')
	}

	const form = await request.formData()
	const parsed = createUserSchema.safeParse({
		name: form.get('name'),
		email: form.get('email'),
		password: form.get('password'),
		role: form.get('role'),
	})

	if (!parsed.success) {
		return data(
			{ error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
			{ status: 400 },
		)
	}

	const { name, email, password, role } = parsed.data
	const rowsChanged = await register(name, email, password, role)

	if (rowsChanged === 1) {
		throw redirect('/users')
	}

	return data(
		{ error: 'A user with this email already exists.' },
		{ status: 409 },
	)
}

export default function AdminCreateUser() {
	const actionData = useActionData<typeof action>() as
		| { error: string }
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
								placeholder="Alex Johnson"
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
								placeholder="name@example.com"
								className="w-full rounded-lg border border-foreground-active bg-foreground-elevated py-1.5 pl-9 pr-3 text-xs text-foreground-text-hl placeholder-foreground-text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
							/>
						</div>
					</div>

					<div className="space-y-1">
						<label
							htmlFor="password"
							className="text-xs font-semibold text-foreground-text-secondary"
						>
							Password
						</label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-text-muted" />
							<input
								id="password"
								name="password"
								type="password"
								required
								minLength={8}
								placeholder="••••••••"
								className="w-full rounded-lg border border-foreground-active bg-foreground-elevated py-1.5 pl-9 pr-3 text-xs text-foreground-text-hl placeholder-foreground-text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
							/>
						</div>
						<p className="text-[10px] text-foreground-text-muted">
							Must be at least 8 characters.
						</p>
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
								defaultValue="learner"
								className="w-full appearance-none rounded-lg border border-foreground-active bg-foreground-elevated py-1.5 pl-9 pr-8 text-xs text-foreground-text-hl outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
							>
								<option value="learner">Learner</option>
								<option value="staff">Staff</option>
							</select>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3">
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
						{isSubmitting ? 'Creating...' : 'Create User'}
					</button>
				</div>
			</Form>
		</div>
	)
}
