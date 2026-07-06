import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import { motion } from 'motion/react'

export default function RegisterSuccess() {
	return (
		<div data-theme="dark" className="min-h-screen bg-background flex items-center justify-center p-6">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="max-w-md w-full bg-foreground rounded-xl shadow-2xl border border-foreground-elevated p-12 text-center"
			>
				<div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
					<CheckCircle2 className="w-10 h-10 text-primary" />
				</div>
				<h2 className="text-2xl font-bold text-foreground-text-hl mb-2">
					Account Created!
				</h2>
				<p className="text-foreground-text mb-8">
					Your learning journey starts now. Welcome to CyberSpace
					Academy.
				</p>
				<Link
					to="/login"
					className="inline-flex items-center justify-center w-full py-4 bg-primary text-foreground-text-hl rounded-2xl font-bold hover:bg-primary transition-all shadow-lg"
				>
					Go to Login
				</Link>
			</motion.div>
		</div>
	)
}
