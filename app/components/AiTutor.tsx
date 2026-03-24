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

export default function AiTutor({ isOpen, onClose, lessonContext }: AiTutorProps) {
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

		const newMessages: Message[] = [...messages, { role: 'user', content: text }]
		setMessages(newMessages)
		setInput('')
		setLoading(true)
		setError(null)

		try {
			const res = await fetch('/ai-chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: newMessages,
					lessonContext,
				}),
			})

			const data = await res.json()

			if (!res.ok || data.error) {
				setError(data.error ?? 'Something went wrong. Please try again.')
				// Remove the user message on error so they can retry
				setMessages(messages)
			} else {
				setMessages([...newMessages, { role: 'assistant', content: data.text }])
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
						transition={{ type: 'spring', damping: 28, stiffness: 280 }}
						className="fixed right-0 top-0 h-full w-full max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
					>
						{/* Header */}
						<div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
									<Sparkles className="w-4 h-4 text-white" />
								</div>
								<div>
									<p className="text-sm font-bold text-white">AI Tutor</p>
									{lessonContext && (
										<p className="text-[10px] text-slate-500 truncate max-w-[180px]">
											{lessonContext}
										</p>
									)}
								</div>
							</div>
							<div className="flex items-center gap-1">
								{messages.length > 0 && (
									<button
										onClick={reset}
										className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
										title="Clear chat"
									>
										<RotateCcw className="w-4 h-4" />
									</button>
								)}
								<button
									onClick={onClose}
									className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
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
										<div className="w-14 h-14 bg-emerald-600/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
											<Bot className="w-7 h-7 text-emerald-400" />
										</div>
										<p className="text-sm font-bold text-white">Ask me anything</p>
										<p className="text-xs text-slate-500 mt-1">
											{lessonContext
												? `I'm here to help with "${lessonContext}" and any cybersecurity questions.`
												: "I'm your cybersecurity tutor. Ask me anything."}
										</p>
									</div>

									<div className="space-y-2">
										<p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
											Suggested
										</p>
										{suggestedQuestions.map((q) => (
											<button
												key={q}
												onClick={() => {
													setInput(q)
													inputRef.current?.focus()
												}}
												className="w-full text-left text-xs text-slate-300 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 hover:border-emerald-500/50 hover:bg-slate-800 transition-all"
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
										className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'assistant'
												? 'bg-emerald-600/20 border border-emerald-500/30'
												: 'bg-slate-700 border border-slate-600'
											}`}
									>
										{msg.role === 'assistant' ? (
											<Bot className="w-3.5 h-3.5 text-emerald-400" />
										) : (
											<User className="w-3.5 h-3.5 text-slate-300" />
										)}
									</div>

									{/* Bubble */}
									<div
										className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant'
												? 'bg-slate-800 text-slate-200 rounded-tl-sm'
												: 'bg-emerald-600 text-white rounded-tr-sm'
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
									<div className="w-7 h-7 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
										<Bot className="w-3.5 h-3.5 text-emerald-400" />
									</div>
									<div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
										{[0, 1, 2].map((i) => (
											<motion.div
												key={i}
												animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
												transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
												className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
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
									className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 text-xs text-red-400"
								>
									{error}
								</motion.div>
							)}

							<div ref={bottomRef} />
						</div>

						{/* Input */}
						<div className="px-4 pb-4 pt-3 border-t border-slate-800 shrink-0">
							<div className="flex items-end gap-2 bg-slate-800 border border-slate-700 rounded-2xl px-3 py-2 focus-within:border-emerald-500/50 transition-colors">
								<textarea
									ref={inputRef}
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="Ask a question… (Enter to send)"
									rows={1}
									className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none resize-none max-h-28 py-1"
									style={{ fieldSizing: 'content' } as any}
								/>
								<button
									onClick={sendMessage}
									disabled={!input.trim() || loading}
									className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
								>
									{loading ? (
										<Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
									) : (
										<Send className="w-3.5 h-3.5 text-white" />
									)}
								</button>
							</div>
							<p className="text-[10px] text-slate-600 text-center mt-2">
								Shift+Enter for new line · Enter to send
							</p>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}

