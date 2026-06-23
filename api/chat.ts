import type { IncomingMessage, ServerResponse } from 'node:http'

export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	if (req.method !== 'POST') {
		res.writeHead(405, { 'Content-Type': 'application/json' })
		res.end(JSON.stringify({ error: 'Method not allowed' }))
		return
	}

	const body = await new Promise<string>((resolve) => {
		let data = ''
		req.on('data', (chunk) => (data += chunk))
		req.on('end', () => resolve(data))
	})

	let messages: { role: string; content: string }[]
	let lessonContext: string | undefined
	try {
		const parsed = JSON.parse(body)
		messages = parsed.messages
		lessonContext = parsed.lessonContext
	} catch {
		res.writeHead(400, { 'Content-Type': 'application/json' })
		res.end(JSON.stringify({ error: 'Invalid JSON' }))
		return
	}

	const apiKey = process.env.OPENROUTER_API_KEY
	if (!apiKey) {
		res.writeHead(500, { 'Content-Type': 'application/json' })
		res.end(JSON.stringify({ error: 'OPENROUTER_API_KEY not set in .env' }))
		return
	}

	const systemPrompt = lessonContext
		? `You are an AI tutor for CyberSpace Academy, a cybersecurity e-learning platform. You are helping a student who is currently studying: "${lessonContext}". Be concise, clear, and encouraging. Focus on cybersecurity concepts. Keep answers to 2–4 short paragraphs maximum.`
		: `You are an AI tutor for CyberSpace Academy, a cybersecurity e-learning platform. Help students understand cybersecurity concepts clearly and concisely. Keep answers to 2–4 short paragraphs.`

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
					{ role: 'system', content: systemPrompt },
					...messages,
				],
				max_tokens: 1024,
			}),
		},
	)

	if (!response.ok) {
		const err = await response.text()
		res.writeHead(response.status, { 'Content-Type': 'application/json' })
		res.end(JSON.stringify({ error: `OpenRouter API error: ${err}` }))
		return
	}

	const data = (await response.json()) as {
		choices?: { message?: { content?: string } }[]
	}
	const text = data.choices?.[0]?.message?.content ?? 'No response received.'
	res.writeHead(200, { 'Content-Type': 'application/json' })
	res.end(JSON.stringify({ text }))
}
