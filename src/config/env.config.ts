import { z } from "zod";

// Define the schema for environment variables
const envSchema = z.object({
	DATABASE_URL: z.string(),
	BETTER_AUTH_URL: z.string(),
	BETTER_AUTH_SECRET: z.string(),
	CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),

	//  Redis
	REDIS_HOST: z.string().default("localhost"),
	REDIS_PORT: z.number().default(6379),
	REDIS_PASSWORD: z.string().optional().default(""),
	REDIS_USERNAME: z.string().optional().default(""),
	REDIS_DATABASE: z.number().default(0),
	REDIS_KEY_PREFIX: z.string().optional().default("app:"),
	REDIS_CACHE_TTL: z.number().default(3600), // 1 hour default cache TTL

	//  Sentry DSN
	SENTRY_DSN: z.string().optional().default(""),

	//  Rate Limiting
	ENABLE_RATE_LIMITING: z.string().optional().default("false"),
	NODE_ENV: z.string().optional().default("development"),

	//  Graceful Shutdown
	SHUTDOWN_TIMEOUT: z.number().default(30_000), // 30 seconds default timeout for graceful shutdown
});

// Parse and validate environment variables
const parsedEnv = envSchema.parse(process.env);

// Export env with parsed CORS origins as an array
export const env = {
	...parsedEnv,
	// Convert comma-separated origins string into an array of trimmed origin strings
	CORS_ALLOWED_ORIGINS: parsedEnv.CORS_ALLOWED_ORIGINS.split(",").map(
		(origin) => origin.trim()
	),
};
