# Hono Bun Template: Opinionated

### Note: There are heavy abstractiosn in this template and the conventions are moderately enforced.

A NestJS-inspired API framework built with Hono, TypeScript, and Bun. Features automatic service discovery, granular access control, and powerful code generation.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun dev

# View API documentation
open http://localhost:8000/doc
```

## 📁 Project Structure

```
src/
├── _generated/             # Auto-generated types
│   ├── modules.ts          # Module registry
│   └── schemas.ts          # Schema registry
├── config/                 # Configuration files
│   ├── api.config.ts       # API versioning config
│   ├── env.config.ts       # Environment variables
│   └── index.ts
├── decorators/             # Service decorators
│   ├── service.decorator.ts
│   └── index.ts
├── drizzle/                # Database ORM
│   └── db.ts
├── lib/                    # Framework utilities
│   ├── _internal/          # Internal utilities
│   │   ├── get-service.ts      # Dependency injection
│   │   ├── route-registry.ts   # Route auto-registration
│   │   ├── schema-registry.ts  # Schema auto-discovery
│   │   └── ...
│   ├── auth.ts             # Better Auth integration
│   ├── logger.ts           # Pino logger
│   ├── response-helpers.ts # Response utilities
│   └── types.ts            # TypeScript types
├── middlewares/            # Global middleware
│   ├── app.middleware.ts       # App-level middleware
│   ├── auth.middleware.ts      # Authentication
│   ├── context.middleware.ts   # Request context
│   ├── rate-limiter.middleware.ts # Rate limiting
│   └── bull-board.middleware.ts   # Queue dashboard
├── modules/                # Business logic modules
│   └── {module}/
│       ├── {module}.service.ts
│       ├── routes/
│       ├── interfaces/      # DTOs & types
│       └── entities/        # Database schemas
├── providers/              # Third-party integrations
│   ├── redis/              # Redis provider
│   │   ├── redis.service.ts
│   │   └── interfaces/
│   └── bull-mq/            # Queue provider
│       ├── bull-mq.service.ts
│       └── interfaces/
├── types/                  # Global types
├── utils/                  # Utility functions
├── _init.ts                # Service initialization
├── _init-routes.ts         # Route initialization
└── index.ts                # App entry point
```

## 🛠️ CLI Tooler

Generate modules and providers with full CRUD operations:

```bash
# Create a module
bun tooler create module users

# Create a module for API v2
bun tooler create module users-v2 --version v2

# Create a provider
bun tooler create provider stripe

# Create a public service
bun tooler create module notifications --public
```

See [Tooler Documentation](./docs/TOOLER.md) for details.

## 🔐 Service Visibility

Services use granular access control:

```typescript
// Private (module-scoped)
@Service()
export class UsersService {}

// Public (global)
@Service({ visibility: "public" })
export class StripeProvider {}

// Granular (specific modules)
@Service({ exposeTo: ["orders", "payments"] })
export class UsersService {}
```

See [Service Decorator Documentation](./docs/SERVICE_DECORATOR.md) for details.

## 📡 API Versioning

Multiple API versions coexist:

- `/api/v1/users` - Version 1
- `/api/v2/users` - Version 2

Configure in `api.config.yml`:

```yaml
defaultVersion: "v1"
prefix: "/api"
availableVersions:
  - "v1"
  - "v2"
```

See [API Versioning Documentation](./docs/API_VERSIONING.md) for details.

## 🔄 Auto-Discovery

Services and routes automatically register on startup:

- **Services**: All `*.service.ts` files
- **Routes**: All `modules/*/routes/index.ts` files
- **Schemas**: All `entities/*.scheam.ts` files

No manual registration needed!

## 🔌 Built-in Providers

### Redis Provider

Comprehensive Redis service with:

- Key-value operations (get, set, delete)
- Hash operations (hget, hset, hdel)
- List operations (lpush, rpush, lpop, rpop)
- Set operations (sadd, srem, smembers)
- Sorted sets (zadd, zrem, zrange)
- Pub/Sub messaging
- Distributed locks with Redlock
- Pipelining and transactions

### BullMQ Provider

Background job processing with:

- Job queue management
- Scheduled/delayed jobs
- Job retry logic
- Job events (completed, failed, progress)
- Queue metrics and monitoring
- Bull Board dashboard at `/admin/queues`

## 🛡️ Built-in Middleware

### Rate Limiting

Redis-backed rate limiting with:

- Per-route configuration
- Multiple key strategies (IP, User ID, API Key)
- Sliding window algorithm
- Custom rate limit rules
- Skip conditions for admin users

### Authentication

Better Auth integration with:

- Session management
- User context injection
- Protected route helpers

### Context

Request context with:

- Unique request ID
- Logger instance
- User session
- Auto-injected in all handlers

### Security

Production-ready security:

- CORS configuration
- Secure headers
- Request timeout
- Error handling with Sentry

## 📦 Key Features

### 🔧 Core Framework

- ✅ **Automatic Service Registration** - Dependency injection with tsyringe
- ✅ **Granular Access Control** - Module visibility with `@Service` decorator
- ✅ **Type-Safe API Versioning** - Multiple API versions from config
- ✅ **Response Helpers** - Consistent response formats across endpoints
- ✅ **Context Variables** - Logger and requestId in all handlers
- ✅ **Auto-Discovery** - Services, routes, and schemas register automatically

### 🛠️ Developer Experience

- ✅ **Full CRUD Generation** - Tooler CLI creates complete modules with routes, DTOs, services
- ✅ **OpenAPI Documentation** - Auto-generated API docs with Scalar UI
- ✅ **Hot Reload** - File watchers for modules and schemas
- ✅ **Type Safety** - Full TypeScript support with Zod validation

### 🔐 Security & Authentication

- ✅ **Better Auth Integration** - Modern authentication with sessions
- ✅ **Rate Limiting** - Redis-backed sliding window rate limiting
- ✅ **Secure Headers** - Built-in security middleware
- ✅ **CORS Configuration** - Configurable CORS from environment

### 🗄️ Data & Caching

- ✅ **Drizzle ORM** - Type-safe database queries with PostgreSQL
- ✅ **Redis Provider** - Comprehensive Redis service with caching, pub/sub, locks
- ✅ **Database Migrations** - Integrated Drizzle Kit workflow
- ✅ **Schema Registry** - Auto-discovered database schemas

### 📊 Monitoring & Queues

- ✅ **BullMQ Integration** - Background job processing with Redis
- ✅ **Bull Board Dashboard** - Visual queue monitoring at `/admin/queues`
- ✅ **Pino Logger** - Structured logging with context
- ✅ **Sentry Integration** - Error tracking and monitoring

### 🚀 Production Ready

- ✅ **Environment Config** - Zod-validated environment variables
- ✅ **Error Handling** - Centralized error handling with proper status codes
- ✅ **Request Timeout** - Configurable request timeouts
- ✅ **Pretty JSON** - Development-friendly JSON formatting

## 🗄️ Database

```bash
# Generate migrations
bun run migration:generate

# Run migrations
bun run migration:run
```

## 📚 Documentation

- [Tooler CLI](./docs/TOOLER.md) - Code generation tool
- [Service Decorator](./docs/SERVICE_DECORATOR.md) - Access control system
- [Service Visibility](./docs/SERVICE_VISIBILITY.md) - Visibility patterns
- [API Versioning](./docs/API_VERSIONING.md) - Version management
- [Rate Limiting](./docs/RATE_LIMITING.md) - Redis-backed rate limiting
- [Redis Service](./docs/REDIS_SERVICE.md) - Redis provider documentation

## 🧪 Development

```bash
# Development mode (with hot reload & module watcher)
bun dev

# Simple mode (no watcher)
bun run dev:simple

# Generate module list
bun run generate:modules
```

## 🏗️ Tech Stack

### Core

- **Runtime**: Bun - Fast JavaScript runtime
- **Framework**: Hono - Ultrafast web framework
- **Language**: TypeScript - Type-safe development

### API & Validation

- **Validation**: Zod - TypeScript-first schema validation
- **OpenAPI**: @hono/zod-openapi - Type-safe OpenAPI routes
- **API Docs**: Scalar - Beautiful API documentation

### Database & Caching

- **ORM**: Drizzle - Type-safe SQL ORM
- **Database**: PostgreSQL (Neon) - Serverless Postgres
- **Cache**: Redis (ioredis) - In-memory data store
- **Locks**: Redlock - Distributed locks

### Background Jobs

- **Queue**: BullMQ - Redis-based job queue
- **Dashboard**: Bull Board - Queue monitoring UI

### Authentication & Security

- **Auth**: Better Auth - Modern authentication
- **Rate Limiting**: hono-rate-limiter - Redis-backed rate limiting
- **Security**: Hono secure-headers - Security middleware

### Monitoring & Logging

- **Logger**: Pino - Fast JSON logger
- **Error Tracking**: Sentry - Error monitoring
- **DI**: tsyringe - Dependency injection

## 📝 Scripts

```json
{
  "dev": "Start dev server with watchers",
  "dev:simple": "Start dev server only",
  "tooler": "Run code generator",
  "generate:modules": "Generate module list",
  "migration:generate": "Generate DB migrations",
  "migration:run": "Run DB migrations"
}
```

## 🤝 Contributing

See [Contributing Guide](./docs/TOOLER.md#contributing) for development workflow and best practices.
