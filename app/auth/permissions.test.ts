import { describe, it, expect } from 'vitest'
import { can } from '~/auth/permissions'
import type { Action } from '~/auth/permissions'
import type { UserContext } from '~/context'

function makeUser(role: string): UserContext {
	return {
		id: 1,
		name: 'x',
		role,
		isStaff: role === 'staff',
		subscriptionEndsAt: null,
		viewAsLearner: false,
	}
}

describe('can - admin', () => {
	it('grants admin for staff role', () => {
		// Arrange / Act / Assert
		expect(can(makeUser('staff'), 'admin' as Action)).toBe(true)
	})

	it('denies admin for learner role', () => {
		// Arrange / Act / Assert
		expect(can(makeUser('learner'), 'admin' as Action)).toBe(false)
	})

	it('denies admin for lite role', () => {
		// Arrange / Act / Assert
		expect(can(makeUser('lite'), 'admin' as Action)).toBe(false)
	})

	it('denies admin for pro role', () => {
		// Arrange / Act / Assert
		expect(can(makeUser('pro'), 'admin' as Action)).toBe(false)
	})

	it('denies admin for staff previewing as learner (role flipped to learner)', () => {
		// Arrange
		const user = makeUser('learner')
		// Act / Assert
		expect(can(user, 'admin' as Action)).toBe(false)
	})
})

describe('can - accessChallenges', () => {
	it('denies challenges for learner role', () => {
		// Arrange / Act / Assert
		expect(can(makeUser('learner'), 'accessChallenges' as Action)).toBe(
			false,
		)
	})

	it('grants challenges for lite role', () => {
		// Arrange / Act / Assert
		expect(can(makeUser('lite'), 'accessChallenges' as Action)).toBe(true)
	})

	it('grants challenges for pro role', () => {
		// Arrange / Act / Assert
		expect(can(makeUser('pro'), 'accessChallenges' as Action)).toBe(true)
	})

	it('denies challenges for staff role (preserve current behavior)', () => {
		// Arrange / Act / Assert
		expect(can(makeUser('staff'), 'accessChallenges' as Action)).toBe(false)
	})
})

describe('can - viewAsLearner', () => {
	it('grants viewAsLearner when flag is true', () => {
		// Arrange
		const user = { ...makeUser('staff'), viewAsLearner: true }
		// Act / Assert
		expect(can(user, 'viewAsLearner' as Action)).toBe(true)
	})

	it('denies viewAsLearner when flag is false', () => {
		// Arrange / Act / Assert
		expect(can(makeUser('staff'), 'viewAsLearner' as Action)).toBe(false)
	})
})

describe('can - defensive null handling', () => {
	it('returns false for null user on admin', () => {
		// Arrange / Act / Assert
		expect(can(null, 'admin' as Action)).toBe(false)
	})
})
