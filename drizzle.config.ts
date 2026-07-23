import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

type AppEnv = 'dev' | 'preview' | 'prod'

const ENV_FILES: Record<AppEnv, string> = {
	dev: '.dev.env',
	preview: '.preview.env',
	prod: '.prod.env',
}

const appEnv = (process.env.APP_ENV as AppEnv) || 'dev'
const envFile = ENV_FILES[appEnv]

if (!envFile) {
	throw new Error(
		`Unknown APP_ENV "${appEnv}". Expected one of: ${Object.keys(ENV_FILES).join(', ')}`,
	)
}

const result = config({ path: envFile, override: true })

if (result.error) {
	throw new Error(`Failed to load ${envFile}: ${result.error.message}`)
}

if (!process.env.DATABASE_URL) {
	throw new Error(`DATABASE_URL not set after loading ${envFile}`)
}

export default defineConfig({
	dialect: 'postgresql',
	schema: './app/.server/database/schema.ts',
	out: `./drizzle/out/${appEnv}`,
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
	schemaFilter: ['cyberspace'],
})
