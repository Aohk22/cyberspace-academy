import { db } from '~/.server/database/connection'
import { getSession } from '~/.server/auth/sessions'
import { canAccessAI, getAIMessageLimit } from '~/.server/payment/access'
import { sql } from 'drizzle-orm'

const SYSTEM_PROMPT =
	'You are an AI tutor for CyberSpace Academy, a cybersecurity e-learning platform. Help students understand cybersecurity concepts clearly and concisely. Keep answers to 2-4 short paragraphs.'

function buildSystemPrompt(lessonContext?: string) {
	return lessonContext
		? `You are an AI tutor for CyberSpace Academy, a cybersecurity e-learning platform. You are helping a student who is currently studying: "${lessonContext}". Be concise, clear, and encouraging. Focus on cybersecurity concepts. Keep answers to 2-4 short paragraphs maximum.`
		: SYSTEM_PROMPT
}

function getToday(): string {
	const d = new Date()
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function handleChatRequest(
	body: string,
	cookieHeader: string | null,
): Promise<{
	status: number
	data: { text?: string; error?: string }
}> {
	const session = await getSession(cookieHeader)
	const userId = session.get('userId')
	const userRole = session.get('userRole')

	if (!userId || !userRole) {
		return { status: 401, data: { error: 'Unauthorized' } }
	}

	if (!canAccessAI(userRole)) {
		return {
			status: 403,
			data: {
				error: 'AI Tutor is available on Lite and Pro plans. Please upgrade to access this feature.',
			},
		}
	}

	const today = getToday()
	const limit = getAIMessageLimit(userRole)

	if (limit !== Infinity) {
		const result = await db.execute(
			sql`SELECT count FROM cyberspace.chat_messages WHERE user_id = ${Number(userId)} AND date = ${today} LIMIT 1`,
		)

		const used =
			(result.rows[0] as { count: number } | undefined)?.count ?? 0
		if (used >= limit) {
			return {
				status: 429,
				data: {
					error: `Daily AI Tutor message limit reached (${limit}/${limit}). Upgrade to Pro for unlimited access.`,
				},
			}
		}

		await db.execute(
			sql`
				INSERT INTO cyberspace.chat_messages (user_id, date, count)
				VALUES (${Number(userId)}, ${today}, 1)
				ON CONFLICT (user_id, date)
				DO UPDATE SET count = cyberspace.chat_messages.count + 1
			`,
		)
	}

	let messages: { role: string; content: string }[]
	let lessonContext: string | undefined
	try {
		const parsed = JSON.parse(body)
		messages = parsed.messages
		lessonContext = parsed.lessonContext
	} catch {
		return { status: 400, data: { error: 'Invalid JSON' } }
	}

	const apiKey = process.env.OPENROUTER_API_KEY
	if (!apiKey) {
		return {
			status: 500,
			data: { error: 'OPENROUTER_API_KEY not set in .env' },
		}
	}

	const response = await fetch(
		'https://openrouter.ai/api/v1/chat/completions',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: 'google/gemini-2.0-flash-lite-001',
				messages: [
					{
						role: 'system',
						content: buildSystemPrompt(lessonContext),
					},
					...messages,
				],
				max_tokens: 1024,
			}),
		},
	)

	if (!response.ok) {
		const err = await response.text()
		return {
			status: response.status,
			data: { error: `OpenRouter API error: ${err}` },
		}
	}

	const data = (await response.json()) as {
		choices?: { message?: { content?: string } }[]
	}
	const text = data.choices?.[0]?.message?.content ?? 'No response received.'
	return { status: 200, data: { text } }
}
