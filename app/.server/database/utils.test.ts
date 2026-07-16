import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/.server/database/connection', () => {
	const db = {
		execute: vi.fn(),
		select: vi.fn(),
		update: vi.fn(),
	}
	return { db }
})

vi.mock('bcrypt', () => ({
	compare: vi.fn(),
	hash: vi.fn(),
}))

import { db } from '~/.server/database/connection'
import {
	getCategories,
	getCourse,
	getCourseLessonCount,
	updatePassword,
} from '~/.server/database/utils'
import { compare, hash } from 'bcrypt'

const mockedDb = db as unknown as {
	execute: ReturnType<typeof vi.fn>
	select: ReturnType<typeof vi.fn>
	update: ReturnType<typeof vi.fn>
}

describe('getCategories', () => {
	beforeEach(() => mockedDb.execute.mockReset())

	it('parses returned rows into Category objects', async () => {
		// Arrange
		mockedDb.execute.mockResolvedValue({
			rows: [{ id: 1, name: 'Web' }],
		})
		// Act
		const result = await getCategories()
		// Assert
		expect(result).toEqual([{ id: 1, name: 'Web' }])
		expect(mockedDb.execute).toHaveBeenCalledOnce()
	})
})

describe('getCourse', () => {
	beforeEach(() => mockedDb.execute.mockReset())

	// NOTE: This test currently FAILS and documents a real bug.
	// `getCourse` does `z.safeParse(courseSchema, result)` where `result` is the
	// whole `{ rows: [...] }` object, not `result.rows[0]`. safeParse fails and
	// it returns null. It should parse `result.rows[0]`.
	it('returns the course when the row is valid', async () => {
		// Arrange
		const courseRow = {
			id: 5,
			title: 'Intro',
			description: 'd',
			instructor: 'i',
			thumbnail: '',
			length: 3600,
			categoryId: 1,
		}
		mockedDb.execute.mockResolvedValue({ rows: [courseRow] })
		// Act
		const result = await getCourse(5)
		// Assert
		expect(result).toMatchObject({ id: 5, title: 'Intro' })
	})

	it('returns null when no row matches', async () => {
		// Arrange
		mockedDb.execute.mockResolvedValue({ rows: [] })
		// Act
		const result = await getCourse(999)
		// Assert
		expect(result).toBeNull()
	})
})

describe('getCourseLessonCount', () => {
	beforeEach(() => mockedDb.execute.mockReset())

	// NOTE: This test currently FAILS and documents a real bug.
	// `getCourseLessonCount` does `z.number().parse(result.rows[0])`, but
	// pg returns `{ count: 12 }`, not `12`. It should parse `result.rows[0].count`.
	it('returns the numeric count from the first row', async () => {
		// Arrange
		mockedDb.execute.mockResolvedValue({ rows: [{ count: 12 }] })
		// Act
		const result = await getCourseLessonCount(1)
		// Assert
		expect(result).toBe(12)
	})
})

describe('updatePassword', () => {
	beforeEach(() => {
		mockedDb.execute.mockReset()
		mockedDb.select.mockReset()
		mockedDb.update.mockReset()
		vi.mocked(compare).mockReset()
		vi.mocked(hash).mockReset()
	})

	it('returns an error when the user does not exist', async () => {
		// Arrange
		mockedDb.execute.mockResolvedValue({ rows: [] })
		// Act
		const result = await updatePassword(1, 'old', 'new')
		// Assert
		expect(result).toEqual({ ok: false, error: 'User not found.' })
	})

	it('returns an error when the current password is incorrect', async () => {
		// Arrange
		mockedDb.execute.mockResolvedValue({
			rows: [{ password: 'hashed' }],
		})
		vi.mocked(compare).mockResolvedValue(false as unknown as never)
		// Act
		const result = await updatePassword(1, 'wrong', 'new')
		// Assert
		expect(result).toEqual({
			ok: false,
			error: 'Current password is incorrect.',
		})
	})

	it('hashes and stores the new password on success', async () => {
		// Arrange
		mockedDb.execute.mockResolvedValue({
			rows: [{ password: 'hashed' }],
		})
		vi.mocked(compare).mockResolvedValue(true as unknown as never)
		vi.mocked(hash).mockResolvedValue('newhashed' as unknown as never)
		// Act
		const result = await updatePassword(1, 'old', 'new')
		// Assert
		expect(result).toEqual({ ok: true })
		expect(hash).toHaveBeenCalledWith('new', 10)
	})
})
