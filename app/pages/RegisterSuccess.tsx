import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import { motion } from 'motion/react'

export default function RegisterSuccess() {
	return (
		<div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="max-w-md w-full bg-slate-900 rounded-xl shadow-2xl border border-slate-800 p-12 text-center"
			>
				<div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
					<CheckCircle2 className="w-10 h-10 text-emerald-500" />
				</div>
				<h2 className="text-2xl font-bold text-white mb-2">
					Account Created!
				</h2>
				<p className="text-slate-400 mb-8">
					Your learning journey starts now. Welcome to CyberSpace
					Academy.
				</p>
				<Link
					to="/login"
					className="inline-flex items-center justify-center w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
				>
					Go to Login
				</Link>
			</motion.div>
		</div>
	)
}
