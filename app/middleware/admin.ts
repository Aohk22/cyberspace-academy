import { redirect } from 'react-router'
import { userContext } from '~/context'
import { can } from '~/auth/permissions'
import type { Route } from '../+types/root'

export const adminMiddleware: Route.MiddlewareFunction = async ({
	context,
}) => {
	const user = context.get(userContext)
	if (!can(user, 'admin')) {
		throw redirect('/dashboard')
	}
}
