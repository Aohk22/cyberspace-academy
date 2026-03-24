import type { Route } from './+types/ai-chat'

export async function action({ request }: Route.ActionArgs) {
	const { messages, lessonContext } = await request.json()

	const apiKey = process.env.OPENROUTER_API_KEY
	if (!apiKey) {
		return Response.json({ error: 'OPENROUTER_API_KEY not set in .env' }, { status: 500 })
	}

	const systemPrompt = lessonContext
		? `You are an AI tutor for CyberSpace Academy, a cybersecurity e-learning platform. You are helping a student who is currently studying: "${lessonContext}". Be concise, clear, and encouraging. Focus on cybersecurity concepts. Keep answers to 2–4 short paragraphs maximum.`
		: `You are an AI tutor for CyberSpace Academy, a cybersecurity e-learning platform. Help students understand cybersecurity concepts clearly and concisely. Keep answers to 2–4 short paragraphs.`

	const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: 'google/gemini-2.0-flash-lite-001',
			messages: [
				{ role: 'system', content: systemPrompt },
				...messages,
			],
			max_tokens: 1024,
		}),
	})

	if (!response.ok) {
		const err = await response.text()
		return Response.json({ error: `OpenRouter API error: ${err}` }, { status: response.status })
	}

	const data = await response.json()
	const text = data.choices?.[0]?.message?.content ?? 'No response received.'
	return Response.json({ text })
}

