import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import { motion } from 'motion/react'

export default function RegisterSuccess() {
	return (
		<div className="min-h-screen bg-canvas flex items-center justify-center p-6">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="max-w-md w-full bg-surface rounded-xl shadow-2xl border border-hairline p-12 text-center"
			>
				<div className="w-20 h-20 bg-deep-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
					<CheckCircle2 className="w-10 h-10 text-deep-green" />
				</div>
				<h2 className="text-2xl font-bold text-ink mb-2">
					Account Created!
				</h2>
				<p className="text-ink mb-8">
					Your learning journey starts now. Welcome to CyberSpace
					Academy.
				</p>
				<Link
					to="/login"
					className="inline-flex items-center justify-center w-full py-4 bg-deep-green text-on-dark rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-deep-green/20"
				>
					Go to Login
				</Link>
			</motion.div>
		</div>
	)
}
