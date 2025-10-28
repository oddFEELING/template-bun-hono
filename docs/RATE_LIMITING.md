# Rate Limiting

Redis-backed rate limiting middleware using sliding window algorithm.

## Setup

### 1. Environment Variables

```bash
ENABLE_RATE_LIMITING=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. Configure Rate Limits

Edit `rateLimitMap` in `src/middlewares/rate-limiter.middleware.ts`:

```typescript
export const rateLimitMap: Record<string, RateLimitConfig> = {
  "auth:login": {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyOptions: { useIp: true },
    message: "Too many login attempts",
  },
};
```

#### Configuration Options

```typescript
{
  limit: number                    // Max requests in window
  windowMs: number                 // Time window in milliseconds
  keyOptions: {                    // How to identify users:
    useIp?: boolean                // - By IP address
    useUserId?: boolean            // - By user ID
    useApiKey?: string             // - By API key header name
    useRoutePath?: boolean         // - Include route in key
    customExtractor?: (c) => string // - Custom logic
  }
  message?: string                 // Custom error message
  skip?: (c) => boolean            // Conditional bypass
}
```

## Usage

### Single Route

```typescript
import { createRateLimiter } from "@/middlewares";

app.post("/auth/login", createRateLimiter("auth:login"), loginHandler);
```

### Route Group

```typescript
const apiRoutes = new Hono<AppEnv>();
apiRoutes.use("*", createRateLimiter("api:general"));
```

### Multiple Limiters

```typescript
const limiters = createMultipleRateLimiters(["api:read", "api:write"]);

app.get("/users", limiters["api:read"], handler);
app.post("/users", limiters["api:write"], handler);
```

### Conditional (Dev/Prod)

```typescript
app.post("/api/data", conditionalRateLimiter("api:general"), handler);
```

## Common Patterns

### Skip for Admins

```typescript
{
  limit: 100,
  windowMs: 15 * 60 * 1000,
  keyOptions: { useUserId: true },
  skip: async (c) => c.get('user')?.role === 'admin'
}
```

### Different Keys Combined

```typescript
{
  keyOptions: {
    useIp: true,
    useUserId: true,
    useRoutePath: true
  }
}
```

### Custom Logic

```typescript
{
  keyOptions: {
    customExtractor: async (c) => {
      const user = c.get("user");
      return user?.tier === "premium"
        ? `premium:${user.id}`
        : `free:${user.id}`;
    };
  }
}
```

## Response

Returns `429` with headers:

```http
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1234567890
```
