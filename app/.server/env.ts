import { config } from 'dotenv'

type AppEnv = 'dev' | 'preview' | 'prod'

const ENV_FILES: Record<AppEnv, string> = {
	dev: '.dev.env',
	preview: '.preview.env',
	prod: '.prod.env',
}

const appEnv = (process.env.APP_ENV as AppEnv) || 'dev'

if (!ENV_FILES[appEnv]) {
	throw new Error(
		`Unknown APP_ENV "${appEnv}". Expected one of: ${Object.keys(ENV_FILES).join(', ')}`,
	)
}

if (process.env.NODE_ENV !== 'production') {
	const result = config({ path: ENV_FILES[appEnv], override: true })
	if (result.error) {
		throw new Error(
			`Failed to load ${ENV_FILES[appEnv]}: ${result.error.message}`,
		)
	}
}
