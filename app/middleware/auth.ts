import { redirect } from 'react-router'
import { userContext } from '~/context'
import { destroySession, getSession } from '~/.server/auth/sessions'
import { getUserById } from '~/.server/database/utils'
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
		context.set(userContext, {
			id: Number(userId),
			name: userName,
			role: userRole,
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
		context.set(userContext, {
			id: user.id,
			name: user.name,
			role: user.role,
		})
	}
}
