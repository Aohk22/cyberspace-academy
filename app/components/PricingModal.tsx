import React, { useState, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, X, Zap, Shield, Star, Sparkles } from 'lucide-react'

const CheckoutModal = lazy(() => import('./CheckoutModal'))

interface PricingModalProps {
	isOpen: boolean
	onClose: () => void
}

type Plan = {
	name: string
	price: string
	description: string
	features: string[]
	buttonText: string
	isPopular: boolean
	color: string
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
	const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null)

	const plans = [
		{
			name: 'Free',
			price: '0',
			description: 'Perfect for getting started',
			features: [
				'Theory lessons',
				'Free theory labs',
				'Limited practical labs',
				'Limited AI chat requests',
			],
			buttonText: 'Current Plan',
			isPopular: false,
			color: 'neutral',
		},
		{
			name: 'Lite',
			price: '1,000',
			description: 'Enhanced learning experience',
			features: [
				'Unlimited learning path',
				'Limited advanced labs',
				'Private environments',
				'Limited AI chat requests',
			],
			buttonText: 'Upgrade to Lite',
			isPopular: false,
			color: 'emerald',
		},
		{
			name: 'Pro',
			price: '2,000',
			description: 'Master your skills',
			features: [
				'Unlimited advanced labs',
				'Private environments',
				'Unlimited AI Tutor access',
				'Priority support',
			],
			buttonText: 'Upgrade to Pro',
			isPopular: true,
			color: 'emerald',
		},
	]

	return (
		<>
			<AnimatePresence>
				{isOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={onClose}
							className="absolute inset-0 bg-black/80 backdrop-blur-sm"
						/>

						{/* Modal Content */}
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="relative w-full max-w-6xl bg-surface rounded-xl shadow-2xl overflow-hidden border border-hairline"
						>
							<button
								onClick={onClose}
								className="absolute top-8 right-8 p-3 text-muted hover:text-ink hover:bg-soft-stone rounded-full transition-all z-10"
							>
								<X className="w-6 h-6" />
							</button>

							<div className="grid lg:grid-cols-4 h-full">
								{/* Left Side - Visual/Marketing */}
								<div className="lg:col-span-1 bg-deep-green p-8 text-on-dark flex flex-col justify-between relative overflow-hidden">
									<div className="relative z-10">
										<div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
											<Sparkles className="w-6 h-6 text-on-dark" />
										</div>
										<h2 className="text-2xl font-bold mb-4 leading-tight">
											Unlock Your Full Potential
										</h2>
										<p className="text-on-dark text-sm">
											Join 50,000+ students already
											learning with Pro features.
										</p>
									</div>

									<div className="space-y-6 relative z-10 mt-8">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
												<Zap className="w-4 h-4" />
											</div>
											<div>
												<p className="font-bold text-sm">
													Unlimited Access
												</p>
												<p className="text-[10px] text-on-dark/80">
													Premium labs & paths
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
												<Shield className="w-4 h-4" />
											</div>
											<div>
												<p className="font-bold text-sm">
													AI Tutor
												</p>
												<p className="text-[10px] text-on-dark/80">
													24/7 learning support
												</p>
											</div>
										</div>
									</div>

									{/* Abstract shapes */}
									<div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
								</div>

								{/* Right Side - Plans */}
								<div className="lg:col-span-3 p-8 bg-surface">
									<div className="grid sm:grid-cols-3 gap-4">
										{plans.map((plan) => (
											<div
												key={plan.name}
												className={`relative p-5 rounded-3xl border-2 transition-all flex flex-col ${
													plan.isPopular
														? 'bg-soft-stone border-deep-green shadow-xl shadow-deep-green/20'
														: 'bg-soft-stone border-hairline'
												}`}
											>
												{plan.isPopular && (
													<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-deep-green text-on-dark text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
														Best Value
													</div>
												)}

												<div className="mb-4">
													<h3 className="text-base font-bold text-ink">
														{plan.name}
													</h3>
													<div className="flex items-baseline gap-1 mt-1">
														<span className="text-2xl font-bold text-ink">
															{plan.price}₫
														</span>
														<span className="text-muted text-[10px]">
															/ 30 days
														</span>
													</div>
													<p className="text-body-muted text-[10px] mt-1">
														{plan.description}
													</p>
												</div>

												<ul className="space-y-2 mb-6 flex-1">
													{plan.features.map(
														(feature) => (
															<li
																key={feature}
																className="flex items-start gap-2 text-[11px] text-ink"
															>
																<Check
																	className={`w-3 h-3 mt-0.5 shrink-0 ${plan.isPopular ? 'text-coral' : 'text-muted'}`}
																/>
																<span>
																	{feature}
																</span>
															</li>
														),
													)}
												</ul>

												<button
													onClick={() =>
														plan.name !== 'Free' &&
														setCheckoutPlan(plan)
													}
													className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
														plan.name === 'Free'
															? 'bg-hairline text-body-muted cursor-default'
															: 'bg-deep-green text-on-dark hover:brightness-110 shadow-lg shadow-deep-green/20'
													}`}
												>
													{plan.buttonText}
												</button>
											</div>
										))}
									</div>

									<div className="mt-6 text-center">
										<p className="text-[10px] text-muted">
											All plans include a 7-day money-back
											guarantee. <br />
											Secure payment processing by PayOS.
										</p>
									</div>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			<Suspense fallback={null}>
				<CheckoutModal
					isOpen={checkoutPlan !== null}
					onClose={() => setCheckoutPlan(null)}
					plan={checkoutPlan}
				/>
			</Suspense>
		</>
	)
}
