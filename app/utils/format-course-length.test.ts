import { describe, it, expect } from 'vitest'
import {
	formatCourseLength,
	formatLessonLength,
} from '~/utils/format-course-length'

describe('formatCourseLength', () => {
	it('formats a whole number of hours without decimals', () => {
		// Arrange
		const seconds = 3600
		// Act
		const result = formatCourseLength(seconds)
		// Assert
		expect(result).toBe('1h')
	})

	it('formats a fractional hour with one decimal', () => {
		// Arrange
		const seconds = 5400
		// Act
		const result = formatCourseLength(seconds)
		// Assert
		expect(result).toBe('1.5h')
	})

	it('formats zero seconds as 0h', () => {
		// Arrange
		const seconds = 0
		// Act
		const result = formatCourseLength(seconds)
		// Assert
		expect(result).toBe('0h')
	})

	it('rounds to one decimal for non-terminating fractions', () => {
		// Arrange
		const seconds = 4500 // 1.25h
		// Act
		const result = formatCourseLength(seconds)
		// Assert
		expect(result).toBe('1.3h')
	})
})

describe('formatLessonLength', () => {
	it('formats an exact minute count', () => {
		// Arrange
		const seconds = 300
		// Act
		const result = formatLessonLength(seconds)
		// Assert
		expect(result).toBe('5 min')
	})

	it('rounds up partial minutes via ceil', () => {
		// Arrange
		const seconds = 59 // < 1 min
		// Act
		const result = formatLessonLength(seconds)
		// Assert
		expect(result).toBe('1 min')
	})

	it('rounds up fractions of a minute', () => {
		// Arrange
		const seconds = 61 // 1.016 min
		// Act
		const result = formatLessonLength(seconds)
		// Assert
		expect(result).toBe('2 min')
	})

	it('formats zero seconds as 0 min', () => {
		// Arrange
		const seconds = 0
		// Act
		const result = formatLessonLength(seconds)
		// Assert
		expect(result).toBe('0 min')
	})
})
