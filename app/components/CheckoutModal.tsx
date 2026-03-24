import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
	X,
	CreditCard,
	Lock,
	CheckCircle2,
	ArrowLeft,
	Loader2,
	ShieldCheck,
	Sparkles,
	Zap,
} from 'lucide-react'

interface CheckoutModalProps {
	isOpen: boolean
	onClose: () => void
	plan: {
		name: string
		price: string
		features: string[]
	} | null
}

type Step = 'details' | 'processing' | 'success'

function formatCardNumber(value: string) {
	return value
		.replace(/\D/g, '')
		.slice(0, 16)
		.replace(/(.{4})/g, '$1 ')
		.trim()
}

function formatExpiry(value: string) {
	const digits = value.replace(/\D/g, '').slice(0, 4)
	if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
	return digits
}

export default function CheckoutModal({ isOpen, onClose, plan }: CheckoutModalProps) {
	const [step, setStep] = useState<Step>('details')
	const [cardNumber, setCardNumber] = useState('')
	const [cardName, setCardName] = useState('')
	const [expiry, setExpiry] = useState('')
	const [cvv, setCvv] = useState('')
	const [focusedField, setFocusedField] = useState<string | null>(null)

	function handleClose() {
		onClose()
		setTimeout(() => {
			setStep('details')
			setCardNumber('')
			setCardName('')
			setExpiry('')
			setCvv('')
		}, 400)
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setStep('processing')
		setTimeout(() => setStep('success'), 2200)
	}

	const isCardFlipped = focusedField === 'cvv'

	return (
		<AnimatePresence>
			{isOpen && plan && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={handleClose}
						className="absolute inset-0 bg-black/80 backdrop-blur-sm"
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 24 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 24 }}
						transition={{ type: 'spring', damping: 28, stiffness: 320 }}
						className="relative w-full max-w-md bg-slate-900 rounded-[1.75rem] border border-slate-800 shadow-2xl overflow-hidden"
					>
						{/* Close button */}
						<button
							onClick={handleClose}
							className="absolute top-5 right-5 z-10 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all"
						>
							<X className="w-5 h-5" />
						</button>

						<AnimatePresence mode="wait">
							{step === 'details' && (
								<motion.div
									key="details"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{ duration: 0.22 }}
								>
									{/* Header */}
									<div className="px-8 pt-8 pb-6 border-b border-slate-800">
										<div className="flex items-center gap-3 mb-1">
											<div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
												{plan.name === 'Pro' ? (
													<Sparkles className="w-4 h-4 text-white" />
												) : (
													<Zap className="w-4 h-4 text-white" />
												)}
											</div>
											<h2 className="text-lg font-bold text-white">
												Upgrade to {plan.name}
											</h2>
										</div>
										<p className="text-slate-400 text-sm ml-11">
											<span className="text-white font-bold text-xl">${plan.price}</span>
											<span className="text-slate-500"> /month</span>
										</p>
									</div>

									{/* Card preview */}
									<div className="px-8 pt-6">
										<div className="relative h-[130px] perspective-1000 mb-6">
											<motion.div
												animate={{ rotateY: isCardFlipped ? 180 : 0 }}
												transition={{ duration: 0.5, type: 'spring', damping: 20 }}
												style={{ transformStyle: 'preserve-3d' }}
												className="w-full h-full relative"
											>
												{/* Card front */}
												<div
													style={{ backfaceVisibility: 'hidden' }}
													className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-5 shadow-xl shadow-emerald-900/30"
												>
													<div className="flex justify-between items-start">
														<div className="w-10 h-7 bg-amber-400/90 rounded-md" />
														<div className="flex gap-1">
															{[...Array(3)].map((_, i) => (
																<div key={i} className="w-2 h-2 rounded-full bg-white/30" />
															))}
														</div>
													</div>
													<div className="mt-4">
														<p className="text-white font-mono text-base tracking-[0.2em] font-medium">
															{cardNumber || '•••• •••• •••• ••••'}
														</p>
													</div>
													<div className="flex items-end justify-between mt-3">
														<div>
															<p className="text-[9px] text-white/50 uppercase tracking-widest">Card holder</p>
															<p className="text-white text-xs font-medium mt-0.5 truncate max-w-[120px]">
																{cardName || 'Your Name'}
															</p>
														</div>
														<div className="text-right">
															<p className="text-[9px] text-white/50 uppercase tracking-widest">Expires</p>
															<p className="text-white text-xs font-medium mt-0.5">{expiry || 'MM/YY'}</p>
														</div>
													</div>
												</div>

												{/* Card back */}
												<div
													style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
													className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-xl overflow-hidden"
												>
													<div className="h-10 bg-slate-900/80 mt-5" />
													<div className="px-5 mt-4">
														<div className="h-8 bg-slate-600/50 rounded flex items-center justify-end px-3">
															<p className="text-white font-mono text-sm tracking-widest">
																{cvv || '•••'}
															</p>
														</div>
														<p className="text-[9px] text-slate-500 mt-1.5 text-right uppercase tracking-widest">CVV</p>
													</div>
												</div>
											</motion.div>
										</div>

										{/* Form */}
										<form onSubmit={handleSubmit} className="space-y-4 pb-8">
											<div className="space-y-1.5">
												<label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
													Cardholder Name
												</label>
												<input
													type="text"
													placeholder="Alex Johnson"
													value={cardName}
													onChange={(e) => setCardName(e.target.value)}
													onFocus={() => setFocusedField('name')}
													onBlur={() => setFocusedField(null)}
													required
													className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
												/>
											</div>

											<div className="space-y-1.5">
												<label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
													Card Number
												</label>
												<div className="relative">
													<CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
													<input
														type="text"
														inputMode="numeric"
														placeholder="1234 5678 9012 3456"
														value={cardNumber}
														onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
														onFocus={() => setFocusedField('number')}
														onBlur={() => setFocusedField(null)}
														required
														className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white font-mono placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
													/>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-3">
												<div className="space-y-1.5">
													<label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
														Expiry
													</label>
													<input
														type="text"
														inputMode="numeric"
														placeholder="MM/YY"
														value={expiry}
														onChange={(e) => setExpiry(formatExpiry(e.target.value))}
														onFocus={() => setFocusedField('expiry')}
														onBlur={() => setFocusedField(null)}
														required
														className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white font-mono placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
													/>
												</div>
												<div className="space-y-1.5">
													<label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
														CVV
													</label>
													<input
														type="text"
														inputMode="numeric"
														placeholder="•••"
														maxLength={4}
														value={cvv}
														onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
														onFocus={() => setFocusedField('cvv')}
														onBlur={() => setFocusedField(null)}
														required
														className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white font-mono placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
													/>
												</div>
											</div>

											<button
												type="submit"
												className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/30 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
											>
												<Lock className="w-4 h-4" />
												Pay ${plan.price}/month
											</button>

											<div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
												<ShieldCheck className="w-3.5 h-3.5" />
												Secured by Stripe · 256-bit SSL
											</div>
										</form>
									</div>
								</motion.div>
							)}

							{step === 'processing' && (
								<motion.div
									key="processing"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="flex flex-col items-center justify-center py-24 px-8 text-center"
								>
									<div className="relative mb-6">
										<div className="w-16 h-16 rounded-full border-4 border-slate-700" />
										<motion.div
											animate={{ rotate: 360 }}
											transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
											className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-500"
										/>
									</div>
									<p className="text-white font-bold text-lg">Processing payment…</p>
									<p className="text-slate-400 text-sm mt-1">Please don't close this window</p>
								</motion.div>
							)}

							{step === 'success' && (
								<motion.div
									key="success"
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0 }}
									className="flex flex-col items-center justify-center py-16 px-8 text-center"
								>
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{ type: 'spring', damping: 14, stiffness: 260, delay: 0.1 }}
										className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mb-6"
									>
										<CheckCircle2 className="w-10 h-10 text-emerald-400" />
									</motion.div>

									<motion.div
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.25 }}
									>
										<h3 className="text-2xl font-bold text-white mb-2">
											You're on {plan.name}!
										</h3>
										<p className="text-slate-400 text-sm mb-8">
											Welcome to the next level. Your features are active now.
										</p>

										<div className="bg-slate-800/60 rounded-2xl p-4 mb-8 text-left space-y-2">
											{plan.features.map((f) => (
												<div key={f} className="flex items-center gap-2 text-sm text-slate-300">
													<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
													{f}
												</div>
											))}
										</div>

										<button
											onClick={handleClose}
											className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/30"
										>
											Start Learning
										</button>
									</motion.div>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	)
}

