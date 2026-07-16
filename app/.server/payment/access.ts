export type SubscriptionRole = 'learner' | 'lite' | 'pro'

const AI_MESSAGE_LIMITS: Record<SubscriptionRole, number> = {
	learner: 0,
	lite: 20,
	pro: Infinity,
}

export function canAccessAI(role: string): boolean {
	const limit = AI_MESSAGE_LIMITS[role as SubscriptionRole] ?? 0
	return limit > 0
}

export function getAIMessageLimit(role: string): number {
	return AI_MESSAGE_LIMITS[role as SubscriptionRole] ?? 0
}
