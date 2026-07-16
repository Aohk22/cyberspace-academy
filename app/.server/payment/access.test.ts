import { describe, it, expect } from 'vitest'
import {
	canAccessAI,
	getAIMessageLimit,
	canAccessChallenges,
} from '~/.server/payment/access'

describe('canAccessAI', () => {
	it('denies AI access for learner role', () => {
		// Arrange
		const role = 'learner'
		// Act
		const result = canAccessAI(role)
		// Assert
		expect(result).toBe(false)
	})

	it('grants AI access for lite role', () => {
		// Arrange
		const role = 'lite'
		// Act
		const result = canAccessAI(role)
		// Assert
		expect(result).toBe(true)
	})

	it('grants AI access for pro role', () => {
		// Arrange
		const role = 'pro'
		// Act
		const result = canAccessAI(role)
		// Assert
		expect(result).toBe(true)
	})

	it('denies AI access for an unknown role (defaults to learner)', () => {
		// Arrange
		const role = 'unknown'
		// Act
		const result = canAccessAI(role)
		// Assert
		expect(result).toBe(false)
	})
})

describe('getAIMessageLimit', () => {
	it('returns 0 for learner', () => {
		// Arrange / Act / Assert
		expect(getAIMessageLimit('learner')).toBe(0)
	})

	it('returns 20 for lite', () => {
		// Arrange / Act / Assert
		expect(getAIMessageLimit('lite')).toBe(20)
	})

	it('returns Infinity for pro', () => {
		// Arrange / Act / Assert
		expect(getAIMessageLimit('pro')).toBe(Infinity)
	})

	it('returns 0 for an unknown role', () => {
		// Arrange / Act / Assert
		expect(getAIMessageLimit('bogus')).toBe(0)
	})
})

describe('canAccessChallenges', () => {
	it('denies challenge access for learner', () => {
		// Arrange / Act / Assert
		expect(canAccessChallenges('learner')).toBe(false)
	})

	it('grants challenge access for lite', () => {
		// Arrange / Act / Assert
		expect(canAccessChallenges('lite')).toBe(true)
	})

	it('grants challenge access for pro', () => {
		// Arrange / Act / Assert
		expect(canAccessChallenges('pro')).toBe(true)
	})

	it('denies challenge access for an unknown role', () => {
		// Arrange / Act / Assert
		expect(canAccessChallenges('nope')).toBe(false)
	})
})
