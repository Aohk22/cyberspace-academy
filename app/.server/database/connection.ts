import '~/.server/env'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
	throw new Error(
		`DATABASE_URL is not set. In production, configure it directly in your deployment platform's environment settings.`,
	)
}

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
})

pool.on('connect', (client) => {
	client.query('SET search_path TO cyberspace').catch((err) => {
		console.error('Failed to set search_path on new connection:', err)
	})
})

pool.on('error', (err) => {
	console.error('Unexpected error on idle client:', err)
})

export const db = drizzle({ client: pool, logger: true })
