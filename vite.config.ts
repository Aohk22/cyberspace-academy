import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import type { Connect } from 'vite'

export default defineConfig({
	plugins: [
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
		{
			name: 'chat-api',
			configureServer(server) {
				const handler: Connect.NextHandleFunction = async (
					req,
					res,
					next,
				) => {
					if (
						req.method !== 'POST' ||
						!req.url?.startsWith('/api/chat')
					) {
						return next()
					}

					let body = ''
					req.on('data', (chunk) => (body += chunk))
					req.on('end', async () => {
						try {
							const { messages, lessonContext } = JSON.parse(body)

							const apiKey = process.env.OPENROUTER_API_KEY
							if (!apiKey) {
								res.statusCode = 500
								res.end(
									JSON.stringify({
										error: 'OPENROUTER_API_KEY not set in .env',
									}),
								)
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
											{
												role: 'system',
												content: systemPrompt,
											},
											...messages,
										],
										max_tokens: 1024,
									}),
								},
							)

							if (!response.ok) {
								const err = await response.text()
								res.statusCode = response.status
								res.end(
									JSON.stringify({
										error: `OpenRouter API error: ${err}`,
									}),
								)
								return
							}

							const data = await response.json()
							const text =
								data.choices?.[0]?.message?.content ??
								'No response received.'
							res.end(JSON.stringify({ text }))
						} catch {
							res.statusCode = 500
							res.end(
								JSON.stringify({
									error: 'Internal server error',
								}),
							)
						}
					})
				}

				server.middlewares.use('/api/chat', handler)
			},
		},
	],
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:3001',
				configure: () => {},
			},
		},
	},
})
