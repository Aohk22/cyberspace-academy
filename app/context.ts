import { createContext } from 'react-router'

export type UserContext = {
	id: number
	name: string
	role: string
	isStaff: boolean
	subscriptionEndsAt: string | null
	viewAsLearner: boolean
}

export const userContext = createContext<UserContext | null>(null)
