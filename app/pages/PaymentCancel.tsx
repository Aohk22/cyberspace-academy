import { Link, useLoaderData, useSearchParams } from 'react-router'
import { XCircle } from 'lucide-react'
import { sql } from 'drizzle-orm'
import { db } from '~/.server/database/connection'
import type { Route } from './+types/PaymentCancel'

export const handle = {
	section: {
		title: 'Payment Cancelled',
		subtitle: 'Your payment was not completed',
	},
}

export async function loader({ request }: Route.LoaderArgs) {
	const orderCode = new URL(request.url).searchParams.get('orderCode')
	if (orderCode && /^\d+$/.test(orderCode)) {
		await db.execute(sql`
			UPDATE cyberspace.orders
			SET status = 'CANCELLED', updated_at = now()
			WHERE order_code = ${Number(orderCode)}
				AND status = 'PENDING'
		`)
	}
	return null
}

export default function PaymentCancel() {
	const [params] = useSearchParams()
	const orderCode = params.get('orderCode')
	const status = params.get('status')
	const cancel = params.get('cancel')

	const wasCancelled = cancel === 'true' || status === 'CANCELLED'

	return (
		<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
			<div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center mb-6">
				<XCircle className="w-10 h-10 text-red-400" />
			</div>
			<h1 className="text-2xl font-bold text-ink mb-2">
				{wasCancelled ? 'Payment Cancelled' : 'Payment Incomplete'}
			</h1>
			<p className="text-body-muted text-sm mb-2">
				{wasCancelled
					? 'Your payment was cancelled. No charges were made.'
					: 'Your payment could not be completed. Please try again.'}
			</p>
			{orderCode && (
				<p className="text-xs text-muted mb-8">
					Order code: {orderCode}
				</p>
			)}
			<Link
				to="/"
				className="px-6 py-3 bg-hairline text-ink rounded-xl font-bold hover:bg-soft-stone transition-all"
			>
				Try Again
			</Link>
		</div>
	)
}
