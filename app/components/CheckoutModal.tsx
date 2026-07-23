import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useFetcher } from 'react-router'
import { X, Lock, CheckCircle2, ShieldCheck, Sparkles, Zap } from 'lucide-react'

interface CheckoutModalProps {
	isOpen: boolean
	onClose: () => void
	plan: {
		name: string
		price: string
		features: string[]
	} | null
}

export default function CheckoutModal({
	isOpen,
	onClose,
	plan,
}: CheckoutModalProps) {
	const fetcher = useFetcher<{ checkoutUrl?: string; error?: string }>()

	useEffect(() => {
		if (fetcher.data?.checkoutUrl) {
			window.location.href = fetcher.data.checkoutUrl
		}
	}, [fetcher.data])

	function handleClose() {
		if (fetcher.state !== 'idle') return
		onClose()
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!plan) return
		fetcher.submit(
			{ intent: 'create-checkout', plan: plan.name },
			{ method: 'POST', action: '/payment' },
		)
	}

	const isRedirecting = fetcher.state !== 'idle'

	return (
		<AnimatePresence>
			{isOpen && plan && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[60] flex items-center justify-center p-4"
				>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={handleClose}
						className="absolute inset-0 bg-black/80 backdrop-blur-sm"
					/>

					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 24 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 24 }}
						transition={{
							type: 'spring',
							damping: 28,
							stiffness: 320,
						}}
						className="relative w-full max-w-md bg-surface rounded-[1.75rem] border border-hairline shadow-2xl overflow-hidden"
					>
						<button
							onClick={handleClose}
							disabled={isRedirecting}
							className="absolute top-5 right-5 z-10 p-2 text-muted hover:text-ink hover:bg-soft-stone rounded-full transition-all"
						>
							<X className="w-5 h-5" />
						</button>

						{isRedirecting ? (
							<div className="flex flex-col items-center justify-center py-24 px-8 text-center">
								<div className="relative mb-6">
									<div className="w-16 h-16 rounded-full border-4 border-hairline" />
									<motion.div
										animate={{ rotate: 360 }}
										transition={{
											duration: 1,
											repeat: Infinity,
											ease: 'linear',
										}}
										className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-deep-green"
									/>
								</div>
								<p className="text-ink font-bold text-lg">
									Redirecting to payOS...
								</p>
								<p className="text-body-muted text-sm mt-1">
									You'll be redirected to the secure checkout
									page
								</p>
							</div>
						) : (
							<>
								<div className="px-8 pt-8 pb-6 border-b border-hairline">
									<div className="flex items-center gap-3 mb-1">
										<div className="w-8 h-8 bg-soft-stone rounded-xl flex items-center justify-center">
											{plan.name === 'Pro' ? (
												<Sparkles className="w-4 h-4 text-ink" />
											) : (
												<Zap className="w-4 h-4 text-ink" />
											)}
										</div>
										<h2 className="text-lg font-bold text-ink">
											Upgrade to {plan.name}
										</h2>
									</div>
									<p className="text-body-muted text-sm ml-11">
										<span className="text-ink font-bold text-xl">
											{plan.price}₫
										</span>
										<span className="text-muted">
											{' '}
											/month
										</span>
									</p>
								</div>

								<div className="px-8 pt-6 pb-8">
									<div className="bg-soft-stone/60 rounded-2xl p-4 mb-6 space-y-2">
										{plan.features.map((f) => (
											<div
												key={f}
												className="flex items-center gap-2 text-sm text-ink"
											>
												<CheckCircle2 className="w-4 h-4 text-coral shrink-0" />
												{f}
											</div>
										))}
									</div>

									<form onSubmit={handleSubmit}>
										<button
											type="submit"
											className="w-full py-3.5 bg-deep-green text-on-dark rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-deep-green/30 active:scale-[0.98] flex items-center justify-center gap-2"
										>
											<Lock className="w-4 h-4" />
											Pay {plan.price}₫/month with payOS
										</button>
									</form>

									{fetcher.data?.error && (
										<p className="text-error text-xs text-center mt-3">
											{fetcher.data.error}
										</p>
									)}

									<div className="flex items-center justify-center gap-2 text-[11px] text-muted mt-4">
										<ShieldCheck className="w-3.5 h-3.5" />
										Secured by payOS
									</div>
								</div>
							</>
						)}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
