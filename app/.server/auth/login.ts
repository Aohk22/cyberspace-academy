import bcrypt from 'bcrypt'
import { DrizzleQueryError, eq } from 'drizzle-orm'
import { db } from '~/.server/database/connection'
import { users } from '~/.server/database/schema'

async function validateCredentials(email: string, password: string) {
	try {
		const result = await db
			.select()
			.from(users)
			.where(eq(users.email, email))

		const user = result.at(0)

		if (!user) {
			return null
		}

		if (!user.password) {
			return null
		}

		const match = await bcrypt.compare(password, user.password)
		if (match) {
			return {
				id: user.id,
				name: user.name,
				role: user.role,
				subscriptionEndsAt: user.subscriptionEndsAt,
			}
		} else {
			return null
		}
	} catch (e) {
		if (e instanceof DrizzleQueryError) {
			console.log('ERROR: DrizzleQueryError')
			console.log(e)
			return null
		}
		throw e
	}
}

export { validateCredentials }
