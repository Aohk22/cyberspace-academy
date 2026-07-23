import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Send, Bot, User, Loader2, Sparkles, RotateCcw } from 'lucide-react'

type Message = {
	role: 'user' | 'assistant'
	content: string
}

interface AiTutorProps {
	isOpen: boolean
	onClose: () => void
	lessonContext?: string // e.g. "Legal & Ethical Considerations" — passed from the lesson page
}

export default function AiTutor({
	isOpen,
	onClose,
	lessonContext,
}: AiTutorProps) {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLTextAreaElement>(null)

	// Scroll to bottom on new messages
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages, loading])

	// Focus input when opened
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 100)
		}
	}, [isOpen])

	async function sendMessage() {
		const text = input.trim()
		if (!text || loading) return

		const newMessages: Message[] = [
			...messages,
			{ role: 'user', content: text },
		]
		setMessages(newMessages)
		setInput('')
		setLoading(true)
		setError(null)

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: newMessages,
					lessonContext,
				}),
			})

			const data = await res.json()

			if (!res.ok || data.error) {
				setError(
					data.error ?? 'Something went wrong. Please try again.',
				)
				// Remove the user message on error so they can retry
				setMessages(messages)
			} else {
				setMessages([
					...newMessages,
					{ role: 'assistant', content: data.text },
				])
			}
		} catch (e) {
			setError('Network error. Check your connection and try again.')
			setMessages(messages)
		} finally {
			setLoading(false)
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			sendMessage()
		}
	}

	function reset() {
		setMessages([])
		setError(null)
		setInput('')
	}

	const suggestedQuestions = lessonContext
		? [
				`What is the most important concept in ${lessonContext}?`,
				'Can you give me a real-world example?',
				'What should I study next?',
			]
		: [
				'What is ethical hacking?',
				'How do I get started in cybersecurity?',
				'What tools should I learn first?',
			]

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop (mobile only) */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/50 z-40 lg:hidden"
					/>

					{/* Chat panel */}
					<motion.div
						initial={{ opacity: 0, x: 400 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 400 }}
						transition={{
							type: 'spring',
							damping: 28,
							stiffness: 280,
						}}
						className="fixed right-0 top-0 h-full w-full max-w-sm bg-surface border-l border-hairline shadow-2xl z-50 flex flex-col"
					>
						{/* Header */}
						<div className="flex items-center justify-between px-5 py-4 bg-deep-green border-b border-white/15 shrink-0">
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
									<Sparkles className="w-4 h-4 text-on-dark" />
								</div>
								<div>
									<p className="text-sm font-bold text-on-dark">
										AI Tutor
									</p>
									{lessonContext && (
										<p className="text-[10px] text-muted truncate max-w-[180px]">
											{lessonContext}
										</p>
									)}
								</div>
							</div>
							<div className="flex items-center gap-1">
								{messages.length > 0 && (
									<button
										onClick={reset}
										className="p-2 text-on-dark/70 hover:text-on-dark hover:bg-white/15 rounded-lg transition-colors"
										title="Clear chat"
									>
										<RotateCcw className="w-4 h-4" />
									</button>
								)}
								<button
									onClick={onClose}
									className="p-2 text-on-dark/70 hover:text-on-dark hover:bg-white/15 rounded-lg transition-colors"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
						</div>

						{/* Messages */}
						<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
							{messages.length === 0 && (
								<div className="space-y-5">
									<div className="text-center pt-6">
										<div className="w-14 h-14 bg-deep-green/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
											<Bot className="w-7 h-7 text-coral" />
										</div>
										<p className="text-sm font-bold text-ink">
											Ask me anything
										</p>
										<p className="text-xs text-muted mt-1">
											{lessonContext
												? `I'm here to help with "${lessonContext}" and any cybersecurity questions.`
												: "I'm your cybersecurity tutor. Ask me anything."}
										</p>
									</div>

									<div className="space-y-2">
										<p className="text-[10px] font-bold text-muted uppercase tracking-widest">
											Suggested
										</p>
										{suggestedQuestions.map((q) => (
											<button
												key={q}
												onClick={() => {
													setInput(q)
													inputRef.current?.focus()
												}}
												className="w-full text-left text-xs text-body-muted bg-soft-stone/50 border border-hairline rounded-xl px-3 py-2.5 hover:border-deep-green/50 hover:bg-soft-stone transition-all"
											>
												{q}
											</button>
										))}
									</div>
								</div>
							)}

							{messages.map((msg, i) => (
								<motion.div
									key={i}
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
								>
									{/* Avatar */}
									<div
										className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
											msg.role === 'assistant'
												? 'bg-deep-green/20 border border-deep-green/30'
												: 'bg-hairline border border-hairline'
										}`}
									>
										{msg.role === 'assistant' ? (
											<Bot className="w-3.5 h-3.5 text-coral" />
										) : (
											<User className="w-3.5 h-3.5 text-muted" />
										)}
									</div>

									{/* Bubble */}
									<div
										className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
											msg.role === 'assistant'
												? 'bg-soft-stone text-ink rounded-tl-sm'
												: 'bg-deep-green text-on-dark rounded-tr-sm'
										}`}
									>
										{msg.content}
									</div>
								</motion.div>
							))}

							{/* Loading indicator */}
							{loading && (
								<motion.div
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									className="flex gap-2.5"
								>
									<div className="w-7 h-7 rounded-full bg-deep-green/20 border border-deep-green/30 flex items-center justify-center shrink-0">
										<Bot className="w-3.5 h-3.5 text-coral" />
									</div>
									<div className="bg-soft-stone rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
										{[0, 1, 2].map((i) => (
											<motion.div
												key={i}
												animate={{
													scale: [1, 1.4, 1],
													opacity: [0.4, 1, 0.4],
												}}
												transition={{
													duration: 0.8,
													repeat: Infinity,
													delay: i * 0.15,
												}}
												className="w-1.5 h-1.5 bg-coral rounded-full"
											/>
										))}
									</div>
								</motion.div>
							)}

							{/* Error */}
							{error && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="bg-error/10 border border-error/30 rounded-xl px-3 py-2.5 text-xs text-error"
								>
									{error}
								</motion.div>
							)}

							<div ref={bottomRef} />
						</div>

						{/* Input */}
						<div className="px-4 pb-4 pt-3 border-t border-hairline shrink-0">
							<div className="flex items-center gap-2 bg-soft-stone border border-hairline rounded-2xl px-3 py-2 focus-within:border-deep-green/50 transition-colors">
								<textarea
									ref={inputRef}
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="Ask a question… (Enter to send)"
									rows={1}
									className="flex-1 bg-transparent text-sm text-ink placeholder-muted outline-none resize-none max-h-28 py-1"
									style={{ fieldSizing: 'content' } as any}
								/>
								<button
									onClick={sendMessage}
									disabled={!input.trim() || loading}
									className="w-8 h-8 bg-deep-green rounded-xl flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
								>
									{loading ? (
										<Loader2 className="w-3.5 h-3.5 text-on-dark animate-spin" />
									) : (
										<Send className="w-3.5 h-3.5 text-on-dark" />
									)}
								</button>
							</div>
							<p className="text-[10px] text-muted text-center mt-2">
								Shift+Enter for new line · Enter to send
							</p>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}
