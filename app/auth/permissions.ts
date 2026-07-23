import type { UserContext } from '~/context'

export type Action =
	| 'admin'
	| 'accessChallenges'
	| 'accessLearningPaths'
	| 'viewAsLearner'

export function can(user: UserContext | null, action: Action): boolean {
	if (!user) return false

	switch (action) {
		case 'admin':
			return user.role === 'staff'
		case 'accessChallenges':
			return user.role === 'lite' || user.role === 'pro'
		case 'accessLearningPaths':
			return (
				user.role === 'lite' ||
				user.role === 'pro' ||
				user.role === 'staff'
			)
		case 'viewAsLearner':
			return user.viewAsLearner === true
	}
}
