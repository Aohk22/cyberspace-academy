const SYSTEM_PROMPT =
	'You are an AI tutor for CyberSpace Academy, a cybersecurity e-learning platform. Help students understand cybersecurity concepts clearly and concisely. Keep answers to 2-4 short paragraphs.'

function buildSystemPrompt(lessonContext?: string) {
	return lessonContext
		? `You are an AI tutor for CyberSpace Academy, a cybersecurity e-learning platform. You are helping a student who is currently studying: "${lessonContext}". Be concise, clear, and encouraging. Focus on cybersecurity concepts. Keep answers to 2-4 short paragraphs maximum.`
		: SYSTEM_PROMPT
}

export async function handleChatRequest(body: string): Promise<{
	status: number
	data: { text?: string; error?: string }
}> {
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
