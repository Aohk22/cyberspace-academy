import '../app/.server/env'
import { confirmWebhook } from '../app/.server/payment/provider'

async function main() {
	const webhookUrl = process.env.PAYOS_WEBHOOK_URL
	if (!webhookUrl) {
		console.error('PAYOS_WEBHOOK_URL is not set')
		process.exit(1)
	}

	console.log(`Registering webhook URL with PayOS: ${webhookUrl}`)
	const result = await confirmWebhook(webhookUrl)
	console.log('Webhook registered successfully:', result)
}

main().catch((err) => {
	console.error('Failed to register webhook:', err)
	process.exit(1)
})
