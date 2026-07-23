import { sql } from 'drizzle-orm'
import { Receipt, Search } from 'lucide-react'
import { Form, Link, redirect, useLoaderData } from 'react-router'
import { z } from 'zod'
import { db } from '~/.server/database/connection'
import { userContext } from '~/context'
import { NoUserContextError } from '~/error'
import { can } from '~/auth/permissions'
import type { Route } from './+types/AdminPayments'

export const handle = {
	section: {
		title: 'Payments',
		subtitle: 'View all subscription and course orders.',
	},
}

const orderRowSchema = z.object({
	id: z.coerce.number(),
	orderCode: z.coerce.number(),
	userName: z.string(),
	userEmail: z.string(),
	plan: z.string(),
	amount: z.coerce.number(),
	status: z.string(),
	createdAt: z.string(),
})

function formatCurrency(value: number) {
	return new Intl.NumberFormat('en-VN', {
		style: 'currency',
		currency: 'VND',
		maximumFractionDigits: 0,
	}).format(value)
}

function statusTone(status: string) {
	switch (status) {
		case 'PAID':
			return 'bg-deep-green/10 text-deep-green'
		case 'CANCELLED':
			return 'bg-error/10 text-error'
		case 'EXPIRED':
			return 'bg-coral/10 text-coral'
		default:
			return 'bg-hairline text-body-muted'
	}
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	if (user === null) {
		throw new NoUserContextError('User context resolved to null.')
	}
	if (!can(user, 'admin')) {
		throw redirect('/')
	}

	const url = new URL(request.url)
	const search = url.searchParams.get('search') || ''
	const statusFilter = url.searchParams.get('status') || ''

	let query = sql`
		SELECT
			o.id,
			o.order_code AS "orderCode",
			u.name AS "userName",
			u.email AS "userEmail",
			o.plan,
			o.amount,
			o.status,
			o.created_at AS "createdAt"
		FROM cyberspace.orders o
		JOIN users u ON u.id = o.user_id
		WHERE 1=1
	`
	const params: string[] = []

	if (search) {
		query = sql`${query} AND (u.name ILIKE ${'%' + search + '%'} OR u.email ILIKE ${'%' + search + '%'} OR o.order_code::text ILIKE ${'%' + search + '%'})`
	}
	if (['PENDING', 'PAID', 'CANCELLED', 'EXPIRED'].includes(statusFilter)) {
		query = sql`${query} AND o.status = ${statusFilter}`
	}

	query = sql`${query} ORDER BY o.created_at DESC`

	const result = await db.execute(query)
	const orders = z.array(orderRowSchema).parse(result.rows)

	const countResult = await db.execute(sql`
		SELECT COUNT(*)::int AS count FROM cyberspace.orders
	`)
	const total = (countResult.rows[0] as { count: number }).count

	return { orders, total, search, statusFilter }
}

export default function AdminPayments() {
	const { orders, total, search, statusFilter } =
		useLoaderData<typeof loader>()

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<p className="text-xs text-muted">
					{total} total order{total !== 1 ? 's' : ''}
				</p>
			</div>

			<Form method="GET" className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
					<input
						type="text"
						name="search"
						defaultValue={search}
						placeholder="Search by user, email, or order code..."
						className="w-full rounded-lg border border-hairline bg-soft-stone py-1.5 pl-9 pr-3 text-xs text-ink placeholder-muted outline-none  focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
					/>
				</div>
				<select
					name="status"
					defaultValue={statusFilter}
					className="rounded-lg border border-hairline bg-soft-stone py-1.5 px-3 text-xs text-ink outline-none  focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
				>
					<option value="">All statuses</option>
					<option value="PENDING">Pending</option>
					<option value="PAID">Paid</option>
					<option value="CANCELLED">Cancelled</option>
					<option value="EXPIRED">Expired</option>
				</select>
				<button
					type="submit"
					className="rounded-lg bg-deep-green px-3 py-1.5 text-xs font-bold text-on-dark hover:brightness-110"
				>
					Search
				</button>
				{search || statusFilter ? (
					<Link
						to="/admin/payments"
						className="flex items-center gap-1 rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink hover:text-body-muted"
					>
						Clear
					</Link>
				) : null}
			</Form>

			<div className="overflow-hidden rounded-lg border border-hairline">
				<table className="w-full text-left text-xs">
					<thead className="bg-soft-stone/50 text-[10px] uppercase tracking-widest text-muted">
						<tr>
							<th className="px-3 py-2">Order</th>
							<th className="px-3 py-2">User</th>
							<th className="px-3 py-2">Plan</th>
							<th className="px-3 py-2">Amount</th>
							<th className="px-3 py-2">Status</th>
							<th className="px-3 py-2">Created</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-hairline">
						{orders.map((o) => (
							<tr key={o.id}>
								<td className="px-3 py-2 font-medium text-ink">
									#{o.orderCode}
								</td>
								<td className="px-3 py-2">
									<p className="font-medium text-ink">
										{o.userName}
									</p>
									<p className="text-muted">{o.userEmail}</p>
								</td>
								<td className="px-3 py-2 text-ink">{o.plan}</td>
								<td className="px-3 py-2 font-medium text-ink">
									{formatCurrency(o.amount)}
								</td>
								<td className="px-3 py-2">
									<span
										className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusTone(
											o.status,
										)}`}
									>
										{o.status}
									</span>
								</td>
								<td className="px-3 py-2 text-muted">
									{new Date(o.createdAt).toLocaleDateString()}
								</td>
							</tr>
						))}
						{orders.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="px-3 py-6 text-center text-muted"
								>
									No orders found.
								</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
		</div>
	)
}
