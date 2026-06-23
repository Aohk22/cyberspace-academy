import React, { useState } from 'react'
import {
	User,
	Trophy,
	CreditCard,
	History,
	Camera,
	Star,
	Flame,
	Award,
	Zap,
	ChevronRight,
	Clock,
	BookOpen,
} from 'lucide-react'
import { motion } from 'motion/react'

export const handle = {
	section: {
		title: 'Profile',
		subtitle: 'Manage your personal information and track your journey.',
		contentClassName: 'mx-auto max-w-5xl',
	},
}

export default function Profile() {
	const [activeTab, setActiveTab] = useState('profile')

	const tabs = [
		{ id: 'profile', label: 'Profile', icon: User },
		{ id: 'certificates', label: 'Certificates', icon: Award },
		{ id: 'transactions', label: 'Transactions', icon: CreditCard },
		{ id: 'learning', label: 'Learning History', icon: History },
	]

	const transactions = [
		{
			id: 'TX-12345',
			date: 'Mar 10, 2026',
			amount: '$49.00',
			status: 'Completed',
			item: 'Pro Monthly Subscription',
		},
		{
			id: 'TX-12344',
			date: 'Feb 10, 2026',
			amount: '$49.00',
			status: 'Completed',
			item: 'Pro Monthly Subscription',
		},
		{
			id: 'TX-12343',
			date: 'Jan 15, 2026',
			amount: '$19.00',
			status: 'Completed',
			item: 'Advanced Network Security Course',
		},
	]

	const learningHistory = [
		{
			id: 1,
			course: 'Network Defense & Hardening',
			lesson: 'Module 3: Firewalls',
			date: 'Today, 10:30 AM',
			duration: '45m',
		},
		{
			id: 2,
			course: 'Ethical Hacking Essentials',
			lesson: 'Final Exam',
			date: 'Yesterday',
			duration: '2h 15m',
		},
		{
			id: 3,
			course: 'Cloud Security Fundamentals',
			lesson: 'Module 1: Intro to AWS',
			date: 'Mar 12, 2026',
			duration: '30m',
		},
	]

	return (
		<div className="space-y-6">
			{/* Navigation Tabs */}
			<nav className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-slate-800">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={
							'flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2' +
							(activeTab === tab.id
								? 'border-emerald-500 text-emerald-400'
								: 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50')
						}
					>
						<tab.icon className="w-4 h-4" />
						{tab.label}
					</button>
				))}
			</nav>

			{/* Content Area */}
			<motion.div
				key={activeTab}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="bg-slate-900 rounded-[1.75rem] border border-slate-800 p-8 md:p-10 shadow-sm"
			>
				{activeTab === 'profile' && (
					<div className="space-y-8">
						<div>
							<h2 className="text-xl font-bold text-white mb-6">
								Personal Information
							</h2>
							<div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
								<div className="relative group">
									<div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-slate-900 shadow-md">
										<User className="w-12 h-12 text-slate-600" />
									</div>
									<button className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all">
										<Camera className="w-4 h-4" />
									</button>
								</div>
								<div className="text-center sm:text-left">
									<h3 className="font-bold text-white text-lg">
										Alex Johnson
									</h3>
									<p className="text-sm text-slate-400">
										Pro Learner since Oct 2025
									</p>
									<div className="flex items-center gap-4 mt-3">
										<div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg">
											<Star className="w-3 h-3 fill-current" />{' '}
											2,450 XP
										</div>
										<div className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded-lg">
											<Flame className="w-3 h-3 fill-current" />{' '}
											15 Day Streak
										</div>
									</div>
								</div>
							</div>

							<div className="grid sm:grid-cols-2 gap-6">
								<div className="space-y-2">
									<label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
										Full Name
									</label>
									<input
										type="text"
										defaultValue="Alex Johnson"
										className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white focus:bg-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
									/>
								</div>
								<div className="space-y-2">
									<label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
										Email Address
									</label>
									<input
										type="email"
										defaultValue="alex.j@example.com"
										className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white focus:bg-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
									/>
								</div>
								<div className="sm:col-span-2 space-y-2">
									<label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
										Bio
									</label>
									<textarea
										rows={4}
										placeholder="Tell us about yourself..."
										defaultValue="Passionate about cybersecurity and ethical hacking. Currently mastering network defense strategies."
										className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white focus:bg-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"
									/>
								</div>
							</div>
						</div>

						<div className="pt-6 border-t border-slate-800 flex justify-end gap-4">
							<button className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all">
								Save Changes
							</button>
						</div>
					</div>
				)}

				{activeTab === 'certificates' && (
					<div className="space-y-8">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-bold text-white">
								Your Certificates
							</h2>
							<div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
								<Award className="w-5 h-5" /> 3 Certificates
								Earned
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4">
							{[
								{
									title: 'Ethical Hacking Professional',
									date: 'Mar 12, 2026',
									issuer: 'CyberSpace Academy',
									id: 'CERT-EH-9921',
								},
								{
									title: 'Network Defense Specialist',
									date: 'Feb 28, 2026',
									issuer: 'CyberSpace Academy',
									id: 'CERT-ND-8812',
								},
								{
									title: 'Cloud Security Fundamentals',
									date: 'Jan 15, 2026',
									issuer: 'CyberSpace Academy',
									id: 'CERT-CS-7734',
								},
							].map((cert) => (
								<div
									key={cert.id}
									className="p-6 bg-slate-800/50 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500/50 transition-all group"
								>
									<div className="flex items-center gap-4">
										<div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-700 group-hover:scale-110 transition-transform">
											<Award className="w-8 h-8 text-emerald-500" />
										</div>
										<div>
											<h4 className="font-bold text-white text-base">
												{cert.title}
											</h4>
											<p className="text-xs text-slate-400">
												Issued by {cert.issuer} •{' '}
												{cert.date}
											</p>
											<p className="text-[10px] font-mono text-slate-500 mt-1">
												ID: {cert.id}
											</p>
										</div>
									</div>
									<button className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center justify-center gap-2">
										View Certificate{' '}
										<ChevronRight className="w-4 h-4" />
									</button>
								</div>
							))}
						</div>

						<div className="pt-6 border-t border-slate-800">
							<div className="bg-emerald-500/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
								<div className="text-center md:text-left">
									<h3 className="font-bold text-emerald-400 mb-1">
										Earn more certificates
									</h3>
									<p className="text-sm text-emerald-300/70">
										Complete courses and pass final exams to
										validate your skills.
									</p>
								</div>
								<button className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20">
									Browse Courses
								</button>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'transactions' && (
					<div className="space-y-8">
						<h2 className="text-xl font-bold text-white mb-6">
							Transaction History
						</h2>
						<div className="overflow-x-auto">
							<table className="w-full text-left">
								<thead>
									<tr className="border-b border-slate-800">
										<th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
											Item
										</th>
										<th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
											Date
										</th>
										<th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
											Amount
										</th>
										<th className="pb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
											Status
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-800/50">
									{transactions.map((tx) => (
										<tr key={tx.id} className="group">
											<td className="py-4">
												<p className="text-sm font-bold text-white">
													{tx.item}
												</p>
												<p className="text-[10px] text-slate-500">
													{tx.id}
												</p>
											</td>
											<td className="py-4 text-sm text-slate-400">
												{tx.date}
											</td>
											<td className="py-4 text-sm font-bold text-white">
												{tx.amount}
											</td>
											<td className="py-4">
												<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
													{tx.status}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{activeTab === 'learning' && (
					<div className="space-y-8">
						<h2 className="text-xl font-bold text-white mb-6">
							Learning History
						</h2>
						<div className="space-y-4">
							{learningHistory.map((log) => (
								<div
									key={log.id}
									className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-emerald-500/30 transition-colors"
								>
									<div className="flex items-center gap-4">
										<div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
											<BookOpen className="w-5 h-5 text-emerald-500" />
										</div>
										<div>
											<h4 className="font-bold text-white text-sm">
												{log.course}
											</h4>
											<p className="text-xs text-slate-400">
												{log.lesson}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-xs font-bold text-white">
											{log.date}
										</p>
										<div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 mt-1">
											<Clock className="w-3 h-3" />{' '}
											{log.duration}
										</div>
									</div>
								</div>
							))}
						</div>
						<button className="w-full py-3 bg-slate-800 text-slate-400 rounded-2xl text-sm font-bold hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center gap-2">
							Download Learning Report{' '}
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				)}
			</motion.div>
		</div>
	)
}
