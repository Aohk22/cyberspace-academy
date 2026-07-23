import type { Route } from './+types/api.chat'
import { handleChatRequest } from '~/.server/chat/handler'

export async function loader() {
	return Response.json({ error: 'Not found' }, { status: 404 })
}

export async function action({ request }: Route.ActionArgs) {
	const body = await request.text()
	const { status, data } = await handleChatRequest(
		body,
		request.headers.get('Cookie'),
	)
	return Response.json(data, { status })
}
