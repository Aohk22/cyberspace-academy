import { redirect } from 'react-router'
import { userContext } from '~/context'
import type { Route } from './+types/payment'
import { randomInt } from 'node:crypto'
import { db } from '~/.server/database/connection'
import { orders } from '~/.server/database/schema'
import { createPaymentLink } from '~/.server/payment/provider'
import { eq } from 'drizzle-orm'

const PLAN_PRICES: Record<string, number> = {
	Lite: 1000,
	Pro: 2000,
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	if (user === null) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'create-checkout') {
		const plan = String(formData.get('plan') ?? '')
		const amount = PLAN_PRICES[plan]

		if (!plan || !amount) {
			return Response.json({ error: 'Invalid plan' }, { status: 400 })
		}

		const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
		const description = plan === 'Pro' ? 'PRO SUB' : 'LITE SUB'
		const payosExpiredAt = Math.floor(Date.now() / 1000) + 15 * 60
		const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

		// Retry on order code collision (unique constraint)
		let orderCode: number | undefined
		for (let attempt = 0; attempt < 3; attempt++) {
			orderCode = randomInt(100_000_000, 999_999_999)
			try {
				await db.insert(orders).values({
					orderCode,
					userId: user.id,
					plan,
					amount,
					status: 'PENDING',
					expiresAt,
				})
				break
			} catch (err) {
				if (attempt === 2) throw err
			}
		}

		const result = await createPaymentLink({
			orderCode: orderCode!,
			amount,
			description,
			returnUrl: `${APP_URL}/payment/success`,
			cancelUrl: `${APP_URL}/payment/cancel`,
			buyerName: user.name,
			items: [{ name: `${plan} Plan`, quantity: 1, price: amount }],
			expiredAt: payosExpiredAt,
		})

		await db
			.update(orders)
			.set({ paymentLinkId: result.paymentLinkId })
			.where(eq(orders.orderCode, orderCode!))

		return Response.json({ checkoutUrl: result.checkoutUrl })
	}

	return Response.json({ error: 'Unknown intent' }, { status: 400 })
}
