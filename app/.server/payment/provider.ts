import '~/.server/env'
import { PayOS, type Webhook } from '@payos/node'

const payOS = new PayOS({
	clientId: process.env.PAYOS_CLIENT_ID,
	apiKey: process.env.PAYOS_API_KEY,
	checksumKey: process.env.PAYOS_CHECKSUM_KEY,
})

export async function createPaymentLink(data: {
	orderCode: number
	amount: number
	description: string
	returnUrl: string
	cancelUrl: string
	items?: { name: string; quantity: number; price: number }[]
	buyerName?: string
	buyerEmail?: string
	buyerPhone?: string
	expiredAt?: number
}) {
	return payOS.paymentRequests.create(data)
}

export async function getPaymentLink(orderCode: number) {
	return payOS.paymentRequests.get(orderCode)
}

export async function cancelPaymentLink(orderCode: number, reason?: string) {
	return payOS.paymentRequests.cancel(orderCode, reason)
}

export async function verifyWebhookData(body: Webhook) {
	return payOS.webhooks.verify(body)
}

export async function confirmWebhook(webhookUrl: string) {
	return payOS.webhooks.confirm(webhookUrl)
}
