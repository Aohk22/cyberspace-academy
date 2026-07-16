import { redirect } from 'react-router'
import { userContext } from '~/context'
import { db } from '~/.server/database/connection'
import { destroySession, getSession } from '~/.server/auth/sessions'
import { getUserById } from '~/.server/database/utils'
import { users } from '~/.server/database/schema'
import { eq } from 'drizzle-orm'
import type { Route } from '../+types/root'

export const authMiddleware: Route.MiddlewareFunction = async ({
	request,
	context,
}) => {
	const session = await getSession(request.headers.get('Cookie'))
	const userId = session.get('userId')
	const userName = session.get('userName')
	const userRole = session.get('userRole')

	if (!userId) {
		throw redirect('/login')
	}

	if (userName && userRole) {
		const subscriptionEndsAt = session.get('subscriptionEndsAt') ?? null
		let role = userRole
		if (
			(role === 'lite' || role === 'pro') &&
			subscriptionEndsAt &&
			new Date(subscriptionEndsAt) < new Date()
		) {
			role = 'learner'
		}
		const viewAsLearner = session.get('viewAsLearner') === true
		const isStaff = role === 'staff'
		const effectiveRole = isStaff && viewAsLearner ? 'learner' : role
		context.set(userContext, {
			id: Number(userId),
			name: userName,
			role: effectiveRole,
			isStaff,
			subscriptionEndsAt,
			viewAsLearner,
		})
	} else {
		const user = await getUserById(userId)
		if (!user) {
			throw redirect('/register', {
				headers: {
					'Set-Cookie': await destroySession(session),
				},
			})
		}

		let role = user.role
		const subscriptionEndsAt = user.subscriptionEndsAt
		if (
			(role === 'lite' || role === 'pro') &&
			subscriptionEndsAt &&
			subscriptionEndsAt < new Date()
		) {
			role = 'learner'
			await db
				.update(users)
				.set({ role: 'learner' })
				.where(eq(users.id, user.id))
		}

		context.set(userContext, {
			id: user.id,
			name: user.name,
			role,
			isStaff: role === 'staff',
			subscriptionEndsAt: subscriptionEndsAt?.toISOString() ?? null,
			viewAsLearner: false,
		})
	}
}
