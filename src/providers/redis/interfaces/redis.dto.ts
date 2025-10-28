import { z } from "@hono/zod-openapi";

/**
 * Redis Provider DTOs
 * Type definitions for Redis operations
 */

// Lock operation response
export const RedisLockSchema = z
	.object({
		token: z.string().nullable(),
		acquired: z.boolean(),
	})
	.openapi("RedisLock");

export type RedisLock = z.infer<typeof RedisLockSchema>;

// Cache entry metadata
export const CacheMetadataSchema = z
	.object({
		key: z.string(),
		ttl: z.number().optional(),
		createdAt: z.date().optional(),
	})
	.openapi("CacheMetadata");

export type CacheMetadata = z.infer<typeof CacheMetadataSchema>;

// Pub/Sub message
export const PubSubMessageSchema = z
	.object({
		channel: z.string(),
		message: z.union([z.string(), z.any(), z.number()]),
		timestamp: z.date().optional(),
	})
	.openapi("PubSubMessage");

export type PubSubMessage = z.infer<typeof PubSubMessageSchema>;

// Redis connection config
export const RedisConfigSchema = z
	.object({
		host: z.string(),
		port: z.number(),
		password: z.string().optional(),
		username: z.string().optional(),
		db: z.number().default(0),
		keyPrefix: z.string().optional(),
		cacheTTL: z.number().default(3600),
	})
	.openapi("RedisConfig");

export type RedisConfig = z.infer<typeof RedisConfigSchema>;
