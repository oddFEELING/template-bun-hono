import { env } from "@/config";
import { Service } from "@/decorators";
import { AppLogger } from "@/lib/logger";
import IORedis, { type Redis } from "ioredis";
import Redlock from "redlock";

/**
 * RedisProvider
 * Comprehensive Redis service with caching, pub/sub, locks, and common operations
 * Public provider - accessible from other modules
 */
@Service({ exposeTo: ["provider:bull-mq"] })
export class RedisProvider {
	private readonly logger: AppLogger;
	private client!: Redis;
	private publisher!: Redis;
	private subscriber!: Redis;
	redlock!: Redlock;
	private readonly subscribers: Map<string, Redis> = new Map();

	constructor(logger: AppLogger) {
		this.logger = logger;
		this.initialize();
	}

	/**
	 * Initialize Redis connection and setup Redlock
	 */
	private initialize(): void {
		try {
			// Create main Redis client
			this.client = new IORedis({
				host: env.REDIS_HOST,
				port: env.REDIS_PORT,
				password: env.REDIS_PASSWORD || undefined,
				username: env.REDIS_USERNAME || undefined,
				db: env.REDIS_DATABASE,
				retryStrategy: (times) => {
					const delay = Math.min(times * 50, 2000);
					return delay;
				},
			});

			// Setup event handlers
			this.client.on("connect", () => {
				this.logger.info("Successfully connected to Redis");
			});

			this.client.on("error", (err) => {
				this.logger.error(`Redis connection error: ${err.message}`);
			});

			this.client.on("close", () => {
				this.logger.info("Redis connection closed");
			});

			this.client.on("reconnecting", (delay: number) => {
				this.logger.info(`Redis reconnecting in ${delay}ms`);
			});

			// Create publisher and subscriber for pub/sub
			this.publisher = this.client.duplicate();
			this.subscriber = this.client.duplicate();

			// Initialize Redlock for distributed locking
			// @ts-expect-error - Redlock types have compatibility issues with ioredis types
			this.redlock = new Redlock([this.client], {
				retryCount: 10,
				retryDelay: 150,
				retryJitter: 100,
			});

			this.logger.info("RedisProvider initialized with Redlock");
		} catch (error) {
			this.logger.error(
				`Failed to initialize Redis: ${error instanceof Error ? error.message : String(error)}`
			);
			throw error;
		}
	}

	/**
	 * Get the underlying Redis client
	 */
	getClient(): Redis {
		return this.client;
	}

	// ============================================
	// Basic Key-Value Operations
	// ============================================

	/**
	 * Get value by key
	 */
	get(key: string): Promise<string | null> {
		return this.client.get(this.prefixKey(key));
	}

	/**
	 * Get and parse JSON object
	 */
	async getObject<T>(key: string): Promise<T | null> {
		const value = await this.get(key);
		if (!value) {
			return null;
		}
		try {
			return JSON.parse(value) as T;
		} catch {
			this.logger.error(`Failed to parse JSON for key ${key}`);
			return null;
		}
	}

	/**
	 * Set key-value pair
	 */
	set(key: string, value: string, expiry?: number): Promise<"OK"> {
		if (expiry) {
			return this.client.set(this.prefixKey(key), value, "EX", expiry);
		}
		return this.client.set(this.prefixKey(key), value);
	}

	/**
	 * Set key-value with expiry
	 */
	async setEx(key: string, expiry: number, value: string): Promise<"OK"> {
		return this.client.set(this.prefixKey(key), value, "EX", expiry);
	}

	/**
	 * Set JSON object
	 */
	async setObject<T>(key: string, value: T, expiry?: number): Promise<"OK"> {
		return this.set(key, JSON.stringify(value), expiry);
	}

	/**
	 * Delete key(s)
	 */
	async del(...keys: string[]): Promise<number> {
		const prefixedKeys = keys.map((k) => this.prefixKey(k));
		return this.client.del(...prefixedKeys);
	}

	/**
	 * Check if key exists
	 */
	async exists(...keys: string[]): Promise<number> {
		const prefixedKeys = keys.map((k) => this.prefixKey(k));
		return this.client.exists(...prefixedKeys);
	}

	/**
	 * Get all keys matching pattern
	 */
	async keys(pattern: string): Promise<string[]> {
		const keys = await this.client.keys(this.prefixKey(pattern));
		return keys.map((k) => k.replace(env.REDIS_KEY_PREFIX, ""));
	}

	/**
	 * Increment value
	 */
	async incr(key: string): Promise<number> {
		return this.client.incr(this.prefixKey(key));
	}

	/**
	 * Decrement value
	 */
	async decr(key: string): Promise<number> {
		return this.client.decr(this.prefixKey(key));
	}

	/**
	 * Ping Redis server
	 */
	async ping(): Promise<string> {
		return this.client.ping();
	}

	// ============================================
	// Hash Operations
	// ============================================

	/**
	 * Get hash field value
	 */
	async hget(key: string, field: string): Promise<string | null> {
		return this.client.hget(this.prefixKey(key), field);
	}

	/**
	 * Set hash field value
	 */
	async hset(
		key: string,
		field: string,
		value: string | number
	): Promise<number> {
		return this.client.hset(this.prefixKey(key), field, value);
	}

	/**
	 * Set multiple hash fields
	 */
	async hsetObject(
		key: string,
		value: Record<string, string | number>
	): Promise<number> {
		return this.client.hset(this.prefixKey(key), value);
	}

	/**
	 * Get all hash fields and values
	 */
	async hgetall(key: string): Promise<Record<string, string>> {
		return this.client.hgetall(this.prefixKey(key));
	}

	/**
	 * Delete hash field(s)
	 */
	async hdel(key: string, ...fields: string[]): Promise<number> {
		return this.client.hdel(this.prefixKey(key), ...fields);
	}

	// ============================================
	// List Operations
	// ============================================

	/**
	 * Push value(s) to left of list
	 */
	async lpush(key: string, ...values: string[]): Promise<number> {
		return this.client.lpush(this.prefixKey(key), ...values);
	}

	/**
	 * Push value(s) to right of list
	 */
	async rpush(key: string, ...values: string[]): Promise<number> {
		return this.client.rpush(this.prefixKey(key), ...values);
	}

	/**
	 * Pop value from left of list
	 */
	async lpop(key: string): Promise<string | null> {
		return this.client.lpop(this.prefixKey(key));
	}

	/**
	 * Pop value from right of list
	 */
	async rpop(key: string): Promise<string | null> {
		return this.client.rpop(this.prefixKey(key));
	}

	/**
	 * Get list range
	 */
	async lrange(key: string, start: number, stop: number): Promise<string[]> {
		return this.client.lrange(this.prefixKey(key), start, stop);
	}

	/**
	 * Get list length
	 */
	async llen(key: string): Promise<number> {
		return this.client.llen(this.prefixKey(key));
	}

	// ============================================
	// Set Operations
	// ============================================

	/**
	 * Add member(s) to set
	 */
	async sadd(key: string, ...members: string[]): Promise<number> {
		return this.client.sadd(this.prefixKey(key), ...members);
	}

	/**
	 * Get all set members
	 */
	async smembers(key: string): Promise<string[]> {
		return this.client.smembers(this.prefixKey(key));
	}

	/**
	 * Remove member(s) from set
	 */
	async srem(key: string, ...members: string[]): Promise<number> {
		return this.client.srem(this.prefixKey(key), ...members);
	}

	/**
	 * Check if member exists in set
	 */
	async sismember(key: string, member: string): Promise<number> {
		return this.client.sismember(this.prefixKey(key), member);
	}

	/**
	 * Get set cardinality (size)
	 */
	async scard(key: string): Promise<number> {
		return this.client.scard(this.prefixKey(key));
	}

	// ============================================
	// Expiration Operations
	// ============================================

	/**
	 * Set key expiration in seconds
	 */
	async expire(key: string, seconds: number): Promise<number> {
		return this.client.expire(this.prefixKey(key), seconds);
	}

	/**
	 * Get time to live in seconds
	 */
	async ttl(key: string): Promise<number> {
		return this.client.ttl(this.prefixKey(key));
	}

	/**
	 * Remove expiration from key
	 */
	async persist(key: string): Promise<number> {
		return this.client.persist(this.prefixKey(key));
	}

	// ============================================
	// Caching Operations
	// ============================================

	/**
	 * Get cached value (with automatic JSON parsing)
	 */
	async getCache<T>(key: string): Promise<T | null> {
		const data = await this.get(key);
		if (!data) {
			return null;
		}

		try {
			return JSON.parse(data) as T;
		} catch (_error) {
			this.logger.error(`Failed to parse cached data for key ${key}`);
			return null;
		}
	}

	/**
	 * Set cached value (with automatic JSON serialization)
	 */
	async setCache<T>(key: string, value: T, expiry?: number): Promise<"OK"> {
		const serialized = JSON.stringify(value);
		return this.set(key, serialized, expiry || env.REDIS_CACHE_TTL);
	}

	/**
	 * Get cached value with fallback function
	 */
	async getCacheWithFallback<T>(
		key: string,
		fallbackFn: () => Promise<T>,
		ttl?: number
	): Promise<T | null> {
		// Try cache first
		const cachedData = await this.getCache<T>(key);
		if (cachedData !== null) {
			return cachedData;
		}

		try {
			// Get fresh data
			const freshData = await fallbackFn();
			if (freshData) {
				// Store in cache
				await this.setCache(key, freshData, ttl || env.REDIS_CACHE_TTL);
			}
			return freshData;
		} catch (error) {
			this.logger.error(
				`Error fetching fallback data for key ${key}: ${error instanceof Error ? error.message : String(error)}`
			);
			return null;
		}
	}

	/**
	 * Clear cache by pattern
	 */
	async clearCacheByPattern(pattern: string): Promise<number> {
		const keys = await this.client.keys(this.prefixKey(pattern));
		if (keys.length > 0) {
			const count = await this.client.del(...keys);
			this.logger.info(
				`Cleared ${count} cache keys matching pattern: ${pattern}`
			);
			return count;
		}
		return 0;
	}

	// ============================================
	// Pub/Sub Operations
	// ============================================

	/**
	 * Publish message to channel
	 */
	async publish(
		channel: string,
		message: object | string | number
	): Promise<number> {
		try {
			const msg =
				typeof message === "string" ? message : JSON.stringify(message);
			return this.publisher.publish(channel, msg);
		} catch (error) {
			this.logger.error(
				`Error publishing to channel ${channel}: ${error instanceof Error ? error.message : String(error)}`
			);
			throw error;
		}
	}

	/**
	 * Subscribe to channel with callback
	 * Returns unsubscribe function
	 */
	async subscribe(
		channel: string,
		callback: (message: string, channelName: string) => void
	): Promise<() => Promise<void>> {
		try {
			const subscriber = this.client.duplicate();

			subscriber.on("error", (err) => {
				this.logger.error(
					`Redis subscriber error on channel ${channel}: ${err.message}`
				);
			});

			await subscriber.subscribe(channel);
			this.logger.info(`Successfully subscribed to channel: ${channel}`);

			subscriber.on("message", (receivedChannel, message) => {
				try {
					if (typeof message !== "string") {
						this.logger.warn(
							`Received non-string message on channel ${receivedChannel}`
						);
						return;
					}
					callback(message, receivedChannel);
				} catch (error) {
					this.logger.error(
						`Error in message handler for channel ${receivedChannel}: ${error instanceof Error ? error.message : String(error)}`
					);
				}
			});

			this.subscribers.set(channel, subscriber);

			// Return unsubscribe function
			return async () => {
				await this.unsubscribe(channel);
			};
		} catch (error) {
			this.logger.error(
				`Error subscribing to channel ${channel}: ${error instanceof Error ? error.message : String(error)}`
			);
			throw error;
		}
	}

	/**
	 * Unsubscribe from channel
	 */
	async unsubscribe(channel: string): Promise<void> {
		const subscriber = this.subscribers.get(channel);
		if (subscriber) {
			try {
				await subscriber.unsubscribe(channel);
				subscriber.removeAllListeners("message");
				if (subscriber.status === "ready") {
					await subscriber.quit();
				} else {
					subscriber.disconnect();
				}
				this.subscribers.delete(channel);
				this.logger.info(`Unsubscribed from channel: ${channel}`);
			} catch (error) {
				this.logger.warn(
					`Error unsubscribing from channel ${channel}: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		}
	}

	// ============================================
	// Locking Operations (Simple locks)
	// ============================================

	/**
	 * Acquire a simple lock (not using Redlock)
	 * Returns token if successful, null otherwise
	 */
	async lock(key: string, ttl = 30): Promise<string | null> {
		const token = Math.random().toString(36).substring(2);
		const acquired = await this.client.set(
			this.prefixKey(`lock:${key}`),
			token,
			"EX",
			ttl,
			"NX"
		);
		return acquired ? token : null;
	}

	/**
	 * Release a simple lock
	 */
	async unlock(key: string, token: string): Promise<boolean> {
		const script = `
			if redis.call("get", KEYS[1]) == ARGV[1] then
				return redis.call("del", KEYS[1])
			else
				return 0
			end
		`;

		const result = (await this.client.eval(
			script,
			1,
			this.prefixKey(`lock:${key}`),
			token
		)) as number;
		return result === 1;
	}

	// ============================================
	// Advanced Operations
	// ============================================

	/**
	 * Execute Redis transaction (pipeline)
	 */
	pipeline() {
		return this.client.pipeline();
	}

	/**
	 * Execute Lua script
	 */
	async eval(
		script: string,
		numKeys: number,
		...args: (string | number)[]
	): Promise<unknown> {
		return this.client.eval(script, numKeys, ...args);
	}

	/**
	 * Get publisher client
	 */
	getPublisher(): Redis {
		return this.publisher;
	}

	/**
	 * Get subscriber client
	 */
	getSubscriber(): Redis {
		return this.subscriber;
	}

	// ============================================
	// Helper Methods
	// ============================================

	/**
	 * Add prefix to key
	 */
	private prefixKey(key: string): string {
		return `${env.REDIS_KEY_PREFIX}${key}`;
	}

	/**
	 * Cleanup connections on shutdown
	 */
	async disconnect(): Promise<void> {
		try {
			// Close all subscriber connections
			for (const [channel, _subscriber] of this.subscribers) {
				await this.unsubscribe(channel);
			}

			// Close main connections
			if (this.client?.status === "ready") {
				await this.client.quit();
			}
			if (this.publisher?.status === "ready") {
				await this.publisher.quit();
			}
			if (this.subscriber?.status === "ready") {
				await this.subscriber.quit();
			}

			this.logger.info("Redis connections closed successfully");
		} catch (error) {
			this.logger.error(
				`Error disconnecting from Redis: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}
