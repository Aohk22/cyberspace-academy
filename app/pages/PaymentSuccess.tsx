import { redirect } from 'react-router'
import { Link, useLoaderData, useRevalidator, useSearchParams } from 'react-router'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { getSession, commitSession } from '~/.server/auth/sessions'
import { getUserById } from '~/.server/database/utils'
import { db } from '~/.server/database/connection'
import { orders, users } from '~/.server/database/schema'
import { getPaymentLink } from '~/.server/payment/provider'
import { eq, sql } from 'drizzle-orm'
import { useEffect, useRef } from 'react'
import type { Route } from './+types/PaymentSuccess'

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const orderCode = Number(url.searchParams.get('orderCode'))
	if (!orderCode) return { status: 'NOT_FOUND', orderCode: null } as const

	const [order] = await db
		.select()
		.from(orders)
		.where(eq(orders.orderCode, orderCode))
		.limit(1)

	if (!order) return { status: 'NOT_FOUND', orderCode } as const

	if (order.status === 'PAID') {
		const session = await getSession(request.headers.get('Cookie'))
		const userId = session.get('userId')
		if (userId) {
			const user = await getUserById(userId)
			if (user && session.get('userRole') !== user.role) {
				session.set('userRole', user.role)
				session.set(
					'subscriptionEndsAt',
					user.subscriptionEndsAt?.toISOString() ?? null,
				)
				const cookie = await commitSession(session)
				const currentUrl = new URL(request.url)
				throw redirect(currentUrl.pathname + currentUrl.search, {
					headers: { 'Set-Cookie': cookie },
				})
			}
		}
		return { status: 'PAID', orderCode } as const
	}

	if (order.status === 'CANCELLED') {
		const cancelUrl = new URL('/payment/cancel', url.origin)
		cancelUrl.searchParams.set('orderCode', String(orderCode))
		throw redirect(cancelUrl.pathname + cancelUrl.search)
	}

	try {
		const payosLink = await getPaymentLink(orderCode)
		const payosStatus = payosLink.status

		if (payosStatus === 'PAID') {
			await db.transaction(async (tx) => {
				await tx
					.update(orders)
					.set({ status: 'PAID', updatedAt: sql`now()` })
					.where(eq(orders.id, order.id))

				const [existingUser] = await tx
					.select({
						role: users.role,
						subscriptionEndsAt: users.subscriptionEndsAt,
					})
					.from(users)
					.where(eq(users.id, order.userId))
					.limit(1)

				const base = existingUser?.subscriptionEndsAt ?? new Date()
				const newEnd = base < new Date() ? new Date() : base
				newEnd.setDate(newEnd.getDate() + 30)

				const planRole = order.plan === 'Pro' ? 'pro' : 'lite'

				await tx
					.update(users)
					.set({
						role: existingUser?.role === 'staff' ? 'staff' : planRole,
						subscriptionEndsAt: newEnd,
					})
					.where(eq(users.id, order.userId))
			})

			const session = await getSession(request.headers.get('Cookie'))
			const userId = session.get('userId')
			if (userId) {
				const user = await getUserById(userId)
				if (user) {
					session.set('userRole', user.role)
					session.set(
						'subscriptionEndsAt',
						user.subscriptionEndsAt?.toISOString() ?? null,
					)
					const cookie = await commitSession(session)
					const currentUrl = new URL(request.url)
					throw redirect(currentUrl.pathname + currentUrl.search, {
						headers: { 'Set-Cookie': cookie },
					})
				}
			}

			return { status: 'PAID', orderCode } as const
		}

		if (payosStatus === 'CANCELLED') {
			await db
				.update(orders)
				.set({ status: 'CANCELLED' })
				.where(eq(orders.id, order.id))

			const cancelUrl = new URL('/payment/cancel', url.origin)
			cancelUrl.searchParams.set('orderCode', String(orderCode))
			throw redirect(cancelUrl.pathname + cancelUrl.search)
		}
	} catch {
		// PayOS API unreachable or order not found there — keep polling
	}

	return { status: 'PENDING', orderCode } as const
}

export const handle = {
	section: {
		title: 'Payment Successful',
		subtitle: 'Your upgrade is complete',
	},
}

export default function PaymentSuccess() {
	const data = useLoaderData<typeof loader>()
	const revalidator = useRevalidator()
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		if (data.status === 'PENDING' && !intervalRef.current) {
			intervalRef.current = setInterval(() => {
				revalidator.revalidate()
			}, 3000)
		}

		if (data.status !== 'PENDING' && intervalRef.current) {
			clearInterval(intervalRef.current)
			intervalRef.current = null
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
				intervalRef.current = null
			}
		}
	}, [data.status, revalidator])

	if (data.status === 'PENDING') {
		return (
			<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
				<div className="relative mb-6">
					<div className="w-16 h-16 rounded-full border-4 border-hairline" />
					<div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-deep-green animate-spin" />
				</div>
				<h1 className="text-2xl font-bold text-ink mb-2">
					Verifying Payment
				</h1>
				<p className="text-body-muted text-sm mb-2">
					Your payment is being processed. This should only take a
					moment.
				</p>
				{data.orderCode && (
					<p className="text-xs text-muted">
						Order code: {data.orderCode}
					</p>
				)}
			</div>
		)
	}

	if (data.status === 'NOT_FOUND') {
		return (
			<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
				<h1 className="text-2xl font-bold text-ink mb-2">
					Order Not Found
				</h1>
				<p className="text-body-muted text-sm mb-8">
					We couldn't find this order. Please try again.
				</p>
				<Link
					to="/"
					className="px-6 py-3 bg-deep-green text-on-dark rounded-xl font-bold hover:brightness-110 transition-all"
				>
					Go Home
				</Link>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
			<div className="w-20 h-20 bg-deep-green/15 rounded-full flex items-center justify-center mb-6">
				<CheckCircle2 className="w-10 h-10 text-coral" />
			</div>
			<h1 className="text-2xl font-bold text-ink mb-2">
				Payment Successful!
			</h1>
			<p className="text-body-muted text-sm mb-2">
				Your payment has been processed. Your account is now upgraded.
			</p>
			{data.orderCode && (
				<p className="text-xs text-muted mb-8">
					Order code: {data.orderCode}
				</p>
			)}
			<Link
				to="/dashboard"
				className="px-6 py-3 bg-deep-green text-on-dark rounded-xl font-bold hover:brightness-110 transition-all"
			>
				Go to Dashboard
			</Link>
		</div>
	)
}
