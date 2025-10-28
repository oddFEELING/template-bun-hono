import { z } from "zod";

// Define the schema for environment variables
const envSchema = z.object({
	DATABASE_URL: z.string(),
	BETTER_AUTH_URL: z.string(),
	BETTER_AUTH_SECRET: z.string(),
	CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),

	//  Redis
	REDIS_HOST: z.string().default("localhost"),
	REDIS_PORT: z.coerce.number().int().min(1).max(65_535).default(6379),
	REDIS_PASSWORD: z.string().min(1).optional(),
	REDIS_USERNAME: z.string().min(1).optional(),
	REDIS_DATABASE: z.coerce.number().int().min(0).default(0),
	REDIS_KEY_PREFIX: z.string().optional().default("app:"),
	REDIS_CACHE_TTL: z.coerce.number().int().min(1).default(3600), // 1 hour default cache TTL

	//  Sentry
	SENTRY_DSN: z.string().optional().default(""),
	SENTRY_TRACES_SAMPLE_RATE: z.coerce
		.number()
		.min(0)
		.max(1)
		.default(0.1)
		.optional(),

	//  Rate Limiting
	ENABLE_RATE_LIMITING: z.string().optional().default("false"),
	NODE_ENV: z.string().optional().default("development"),

	//  Bull Board UI
	BULL_BOARD_ENABLED: z
		.string()
		.optional()
		.default("true")
		.transform((val) => val === "true"),

	//  Graceful Shutdown
	SHUTDOWN_TIMEOUT: z.coerce.number().int().min(1000).default(30_000), // 30 seconds default timeout for graceful shutdown
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
