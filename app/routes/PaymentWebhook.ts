import type { Route } from './+types/PaymentWebhook'
import type { Webhook, WebhookData } from '@payos/node'
import { db } from '~/.server/database/connection'
import { orders, users } from '~/.server/database/schema'
import { verifyWebhookData } from '~/.server/payment/provider'
import { eq, sql } from 'drizzle-orm'

export async function action({ request }: Route.ActionArgs) {
	if (request.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 })
	}

	const body = (await request.json()) as Webhook

	if (!body.success || body.code !== '00') {
		return Response.json({ code: '00', desc: 'ignored' })
	}

	let webhookData: WebhookData
	try {
		webhookData = await verifyWebhookData(body)
	} catch (err) {
		console.error('Webhook signature verification failed:', err)
		return Response.json(
			{ code: '01', desc: 'invalid signature' },
			{ status: 400 },
		)
	}

	if (webhookData.code !== '00') {
		return Response.json({ code: '00', desc: 'ignored' })
	}

	const [order] = await db
		.select()
		.from(orders)
		.where(eq(orders.orderCode, webhookData.orderCode))
		.limit(1)

	if (!order) {
		return Response.json({ code: '00', desc: 'order not found' })
	}

	if (order.status === 'PAID') {
		return Response.json({ code: '00', desc: 'already processed' })
	}

	await db.transaction(async (tx) => {
		await tx
			.update(orders)
			.set({
				status: 'PAID',
				updatedAt: sql`now()`,
			})
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

	return Response.json({ code: '00', desc: 'success' })
}
