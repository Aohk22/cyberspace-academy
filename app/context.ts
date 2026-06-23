import { createContext } from 'react-router'

export type UserContext = {
	id: number
	name: string
	role: string
}

export const userContext = createContext<UserContext | null>(null)
