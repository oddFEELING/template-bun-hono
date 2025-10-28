import { env } from "@/config";
import { errorResponse, HTTP_STATUS } from "@/lib";
import { getService } from "@/lib/_internal/get-service";
import { AppLogger } from "@/lib/logger";
import type { AppEnv } from "@/lib/types";
import { RedisProvider } from "@/providers/redis/redis.service";
import { RedisStore } from "@hono-rate-limiter/redis";
import { type Context, type MiddlewareHandler } from "hono";
import { rateLimiter } from "hono-rate-limiter";

/**
 * Rate limit key generator options
 * Provides different strategies for identifying rate limit keys
 */
interface RateLimitKeyOptions {
	/** Use client IP address as key */
	useIp?: boolean;
	/** Use user ID from context (requires authentication) */
	useUserId?: boolean;
	/** Use API key from specified header */
	useApiKey?: string;
	/** Use route path as part of key */
	useRoutePath?: boolean;
	/** Custom key extractor function */
	customExtractor?: (c: Context<AppEnv>) => string | Promise<string>;
}

/**
 * Rate limit configuration for a specific route or route group
 */
interface RateLimitConfig {
	/** Maximum number of requests allowed in the time window */
	limit: number;
	/** Time window in milliseconds */
	windowMs: number;
	/** Key generation strategy */
	keyOptions: RateLimitKeyOptions;
	/** Custom message when rate limit is exceeded */
	message?: string;
	/** Skip rate limiting based on condition */
	skip?: (c: Context<AppEnv>) => boolean | Promise<boolean>;
	/** Whether to use sliding window (default: true) */
	standardHeaders?: "draft-6" | "draft-7" | false;
	/** Whether to send rate limit info in headers */
	legacyHeaders?: boolean;
}

/**
 * Rate limit configuration map
 * Maps route identifiers to their rate limit configurations
 *
 * Example usage:
 * ```typescript
 * export const rateLimitMap: Record<string, RateLimitConfig> = {
 *   'auth:login': {
 *     limit: 5,
 *     windowMs: 15 * 60 * 1000, // 15 minutes
 *     keyOptions: { useIp: true },
 *     message: 'Too many login attempts'
 *   },
 *   'api:general': {
 *     limit: 100,
 *     windowMs: 15 * 60 * 1000,
 *     keyOptions: { useUserId: true, useApiKey: 'X-API-Key' }
 *   }
 * }
 * ```
 */
const rateLimitMap: Record<string, RateLimitConfig> = {
	// Example: Strict rate limit for authentication endpoints
	"auth:login": {
		limit: 5,
		windowMs: 15 * 60 * 1000, // 15 minutes
		keyOptions: {
			useIp: true,
		},
		message: "Too many login attempts. Please try again later.",
		standardHeaders: "draft-7",
		legacyHeaders: false,
	},

	// Example: Moderate rate limit for general API endpoints
	"api:general": {
		limit: 100,
		windowMs: 15 * 60 * 1000, // 15 minutes
		keyOptions: {
			useUserId: true,
			useApiKey: "X-API-Key",
		},
		message: "Rate limit exceeded. Please slow down your requests.",
		standardHeaders: "draft-7",
		legacyHeaders: false,
	},

	// Example: Higher limit for read-only operations
	"api:read": {
		limit: 200,
		windowMs: 15 * 60 * 1000, // 15 minutes
		keyOptions: {
			useUserId: true,
		},
		skip: async () => {
			// Skip rate limiting for admin users
			// Note: Extend user type if you need role-based skipping
			return false;
		},
		standardHeaders: "draft-7",
		legacyHeaders: false,
	},

	// Example: Lower limit for write operations
	"api:write": {
		limit: 50,
		windowMs: 15 * 60 * 1000, // 15 minutes
		keyOptions: {
			useUserId: true,
			useRoutePath: true,
		},
		standardHeaders: "draft-7",
		legacyHeaders: false,
	},

	// Example: Custom key generator for specific use case
	"api:custom": {
		limit: 30,
		windowMs: 60 * 1000, // 1 minute
		keyOptions: {
			customExtractor: async (c) => {
				// Custom logic to generate rate limit key
				const apiKey = c.req.header("X-API-Key");
				const userId = c.get("user")?.id;
				return `custom:${apiKey || "anonymous"}:${userId || "guest"}`;
			},
		},
		standardHeaders: "draft-7",
		legacyHeaders: false,
	},
};

/**
 * Generates a rate limit key based on the provided options
 * Combines multiple strategies to create a unique identifier
 */
const generateRateLimitKey = (
	c: Context<AppEnv>,
	options: RateLimitKeyOptions
): string => {
	const keyParts: string[] = [];

	// Note: customExtractor is handled in the rateLimiter.keyGenerator

	// Include IP address
	if (options.useIp) {
		const ip =
			c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
			c.req.header("x-real-ip") ||
			"unknown";
		keyParts.push(`ip:${ip}`);
	}

	// Include user ID
	if (options.useUserId) {
		const user = c.get("user");
		const userId = user?.id || "anonymous";
		keyParts.push(`user:${userId}`);
	}

	// Include API key from header
	if (options.useApiKey) {
		const apiKey = c.req.header(options.useApiKey);
		keyParts.push(`apikey:${apiKey || "none"}`);
	}

	// Include route path
	if (options.useRoutePath) {
		const path = c.req.path;
		keyParts.push(`path:${path}`);
	}

	// Return combined key or default to IP
	return keyParts.length > 0
		? keyParts.join(":")
		: `ip:${c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"}`;
};

/**
 * Creates a rate limiter middleware for a specific configuration
 * Uses Redis store for distributed rate limiting across multiple server instances
 */
const createRateLimiter = (configKey: string): MiddlewareHandler<AppEnv> => {
	const logger = getService(AppLogger);
	const redisProvider = getService(RedisProvider);
	const config = rateLimitMap[configKey];

	// Validate configuration exists
	if (!config) {
		logger.error(`Rate limit configuration not found for key: ${configKey}`);
		throw new Error(`Rate limit configuration not found for key: ${configKey}`);
	}

	// Create Redis store for rate limiting
	// Type assertions needed for compatibility between ioredis and hono-rate-limiter
	const store = new RedisStore({
		sendCommand: async (...args: string[]) => {
			// biome-ignore lint/suspicious/noExplicitAny: ioredis types compatibility
			const client = redisProvider.getClient() as any;
			// biome-ignore lint/suspicious/noExplicitAny: call method types compatibility
			return client.call(...(args as any));
		},
		prefix: `ratelimit:${configKey}:`,
		// biome-ignore lint/suspicious/noExplicitAny: RedisStore options compatibility
	} as any);

	// Create and return the rate limiter middleware
	return rateLimiter({
		windowMs: config.windowMs,
		limit: config.limit,
		standardHeaders: config.standardHeaders ?? "draft-7",
		legacyHeaders: config.legacyHeaders ?? false,
		store,
		// Custom key generator based on configuration
		keyGenerator: async (c: Context<AppEnv>) => {
			// Use custom extractor if provided
			if (config.keyOptions.customExtractor) {
				return await config.keyOptions.customExtractor(c);
			}
			return generateRateLimitKey(c, config.keyOptions);
		},
		// Custom handler when rate limit is exceeded
		handler: (c: Context<AppEnv>) => {
			logger.warn(
				`Rate limit exceeded for ${configKey}: ${c.req.path} - Key: ${generateRateLimitKey(c, config.keyOptions)}`
			);
			return errorResponse(
				c,
				config.message || "Too many requests. Please try again later.",
				HTTP_STATUS.TOO_MANY_REQUESTS
			);
		},
		// Skip rate limiting based on configuration
		skip: config.skip,
		// biome-ignore lint/suspicious/noExplicitAny: rateLimiter requires type casting for store and legacyHeaders options
	} as any);
};

/**
 * Convenience function to create multiple rate limiters
 * Useful for applying different rate limits to different route groups
 */
const createMultipleRateLimiters = (
	configKeys: string[]
): Record<string, MiddlewareHandler<AppEnv>> => {
	const limiters: Record<string, MiddlewareHandler<AppEnv>> = {};

	for (const key of configKeys) {
		limiters[key] = createRateLimiter(key);
	}

	return limiters;
};

/**
 * Helper to check if rate limiting is enabled
 * Useful for conditional rate limiting based on environment
 */
const isRateLimitingEnabled = (): boolean => {
	// Rate limiting can be disabled in development if needed
	return env.NODE_ENV === "production" || env.ENABLE_RATE_LIMITING === "true";
};

/**
 * Wrapper to conditionally apply rate limiting
 * Skips rate limiting if disabled via environment variable
 */
const conditionalRateLimiter = (
	configKey: string
): MiddlewareHandler<AppEnv> => {
	if (!isRateLimitingEnabled()) {
		// Return pass-through middleware if rate limiting is disabled
		return async (_c, next) => next();
	}
	return createRateLimiter(configKey);
};

// Exports
export {
	conditionalRateLimiter,
	createMultipleRateLimiters,
	createRateLimiter,
	isRateLimitingEnabled,
	rateLimitMap,
};
