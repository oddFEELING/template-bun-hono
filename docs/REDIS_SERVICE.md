# Redis Service Documentation

The Redis Service provides a comprehensive set of methods for interacting with Redis, including caching, pub/sub, distributed locking, and common data structure operations.

## Configuration

Add Redis configuration to your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password
REDIS_USERNAME=optional_username
REDIS_DATABASE=0
REDIS_KEY_PREFIX=app:
REDIS_CACHE_TTL=3600
```

## Basic Usage

The `RedisProvider` is a public service accessible from any module:

```typescript
import { RedisProvider } from "@/providers/redis/redis.service";

class YourService {
  constructor(private redis: RedisProvider) {}
}
```

## Common Operations

### Key-Value Operations

```typescript
// Set a value
await redis.set("user:123", "John Doe");
await redis.set("session:abc", "data", 3600); // with TTL

// Get a value
const value = await redis.get("user:123");

// Delete keys
await redis.del("user:123", "user:456");

// Check existence
const exists = await redis.exists("user:123");

// Increment/Decrement
await redis.incr("counter");
await redis.decr("counter");
```

### Object/JSON Operations

```typescript
// Store objects automatically
const user = { id: 123, name: "John", email: "john@example.com" };
await redis.setObject("user:123", user, 3600);

// Retrieve objects
const user = await redis.getObject<User>("user:123");
```

## Caching

### Basic Cache Operations

```typescript
// Set cache with auto serialization
await redis.setCache("products:list", products, 1800);

// Get cached data
const products = await redis.getCache<Product[]>("products:list");

// Clear cache by pattern
await redis.clearCacheByPattern("products:*");
```

### Cache with Fallback

Automatically fetch and cache data if not in cache:

```typescript
const user = await redis.getCacheWithFallback(
  "user:123",
  async () => {
    // This function only runs if cache misses
    return await database.users.findById(123);
  },
  3600 // TTL in seconds
);
```

## Hash Operations

Perfect for storing objects with multiple fields:

```typescript
// Set hash fields
await redis.hset("user:123", "name", "John");
await redis.hset("user:123", "email", "john@example.com");

// Set multiple fields at once
await redis.hsetObject("user:123", {
  name: "John",
  email: "john@example.com",
  age: "30",
});

// Get all hash fields
const user = await redis.hgetall("user:123");

// Get single field
const name = await redis.hget("user:123", "name");

// Delete fields
await redis.hdel("user:123", "age");
```

## List Operations

FIFO/LIFO queues and lists:

```typescript
// Push to list
await redis.lpush("notifications:user:123", "New message");
await redis.rpush("queue:jobs", "job1", "job2");

// Pop from list
const latest = await redis.lpop("notifications:user:123");
const oldest = await redis.rpop("queue:jobs");

// Get range
const items = await redis.lrange("queue:jobs", 0, 9); // First 10 items

// Get list length
const count = await redis.llen("queue:jobs");
```

## Set Operations

Unique collections:

```typescript
// Add members
await redis.sadd("tags:post:123", "nodejs", "redis", "typescript");

// Get all members
const tags = await redis.smembers("tags:post:123");

// Check membership
const isMember = await redis.sismember("tags:post:123", "nodejs");

// Remove members
await redis.srem("tags:post:123", "redis");

// Get set size
const count = await redis.scard("tags:post:123");
```

## Pub/Sub

Real-time messaging between services:

```typescript
// Subscribe to channel
const unsubscribe = await redis.subscribe(
  "notifications",
  (message, channel) => {
    console.log(`Received on ${channel}:`, message);
    const data = JSON.parse(message);
    // Handle notification
  }
);

// Publish message
await redis.publish("notifications", {
  type: "new_message",
  userId: 123,
  message: "Hello!",
});

// Unsubscribe when done
await unsubscribe();
```

## Distributed Locking

### Using Redlock

For distributed systems:

```typescript
// Acquire a distributed lock
const lock = await redis.redlock.acquire(
  ["resource:123"],
  5000 // Lock duration in milliseconds
);

try {
  // Perform operations that need to be exclusive
  await updateCriticalResource();
} finally {
  // Always release the lock
  await redis.redlock.release(lock);
}
```

### Simple Locks

For basic locking needs:

```typescript
// Acquire lock
const token = await redis.lock("resource:123", 30); // 30 seconds TTL

if (token) {
  try {
    // Do work
    await processResource();
  } finally {
    // Release lock
    await redis.unlock("resource:123", token);
  }
} else {
  console.log("Resource is locked by another process");
}
```

## Expiration Management

```typescript
// Set expiration (in seconds)
await redis.expire("session:abc", 3600);

// Get time to live
const ttl = await redis.ttl("session:abc");
console.log(`Expires in ${ttl} seconds`);

// Remove expiration (make key persistent)
await redis.persist("session:abc");
```

## Advanced Operations

### Pipeline (Batch Operations)

Execute multiple commands efficiently:

```typescript
const pipeline = redis.pipeline();

pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.incr("counter");
pipeline.get("key1");

const results = await pipeline.exec();
```

### Lua Scripts

Execute custom Lua scripts:

```typescript
const script = `
  local current = redis.call("get", KEYS[1])
  if current == false then
    redis.call("set", KEYS[1], ARGV[1])
    return 1
  end
  return 0
`;

const result = await redis.eval(script, 1, "mykey", "myvalue");
```

### Raw Client Access

For operations not covered by the service:

```typescript
const client = redis.getClient();
await client.zrange("leaderboard", 0, 9); // Sorted set operations
```

## Key Patterns

All keys are automatically prefixed with `REDIS_KEY_PREFIX` (default: `app:`):

```typescript
await redis.set("user:123", "data");
// Actually stored as: "app:user:123"

// Get all keys matching pattern
const keys = await redis.keys("user:*");
// Returns: ["user:123", "user:456"] (without prefix)
```

## Best Practices

1. **Use TTL for cache**: Always set expiration for cached data

   ```typescript
   await redis.setCache("data", value, 3600);
   ```

2. **Use cache with fallback**: Simplifies cache logic

   ```typescript
   const data = await redis.getCacheWithFallback("key", fetchFn, ttl);
   ```

3. **Clean up pub/sub**: Always unsubscribe when done

   ```typescript
   const unsub = await redis.subscribe("channel", handler);
   // Later...
   await unsub();
   ```

4. **Release locks**: Use try/finally to ensure lock release

   ```typescript
   const lock = await redis.redlock.acquire(["resource"], 5000);
   try {
     // work
   } finally {
     await redis.redlock.release(lock);
   }
   ```

5. **Use appropriate data structures**:
   - **String**: Simple values, counters
   - **Hash**: Objects with multiple fields
   - **List**: Queues, timelines
   - **Set**: Unique collections, tags

## Connection Management

The Redis service automatically:

- Establishes connection on initialization
- Handles reconnection on failures
- Logs connection events
- Cleans up on shutdown

To manually disconnect:

```typescript
await redis.disconnect();
```

## Examples

### Session Management

```typescript
// Store session
await redis.setCache(
  `session:${sessionId}`,
  {
    userId: user.id,
    email: user.email,
    createdAt: new Date(),
  },
  86400
); // 24 hours

// Get session
const session = await redis.getCache<Session>(`session:${sessionId}`);

// Delete session
await redis.del(`session:${sessionId}`);
```

### Rate Limiting

```typescript
const key = `rate:${userId}:${endpoint}`;
const count = await redis.incr(key);

if (count === 1) {
  await redis.expire(key, 60); // 1 minute window
}

if (count > 100) {
  throw new Error("Rate limit exceeded");
}
```

### Real-time Notifications

```typescript
// Service A: Publish notification
await redis.publish("user:notifications", {
  userId: 123,
  type: "message",
  data: { from: "John", message: "Hi!" },
});

// Service B: Subscribe to notifications
await redis.subscribe("user:notifications", async (message) => {
  const notification = JSON.parse(message);
  await sendWebSocket(notification.userId, notification.data);
});
```

### Leaderboard (using raw client)

```typescript
const client = redis.getClient();

// Add scores
await client.zadd("leaderboard", 100, "player1");
await client.zadd("leaderboard", 200, "player2");

// Get top 10
const top10 = await client.zrange("leaderboard", 0, 9, "WITHSCORES");
```

## See Also

- [Service Decorator](./SERVICE_DECORATOR.md) - Learn about service visibility
- [Tooler Documentation](./TOOLER.md) - Generate providers and modules
