# Naalya API

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
├── lib/                    # Framework-level utilities
│   ├── get-service.ts      # Dependency injection
│   ├── logger.ts           # Logging service
│   ├── response-helpers.ts # Response utilities
│   ├── route-registry.ts   # Route auto-registration
│   └── types.ts            # App environment types
├── modules/                # Business logic modules
│   └── {module}/
│       ├── {module}.service.ts
│       ├── routes/
│       ├── interfaces/
│       └── entities/
├── providers/              # Third-party integrations
│   └── {provider}/
│       └── {provider}.service.ts
├── decorators/             # Service & controller decorators
├── middlewares/            # Global & context middleware
├── config/                 # Configuration files
└── _generated/             # Auto-generated types
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
export class UsersService { }

// Public (global)
@Service({ visibility: "public" })
export class StripeProvider { }

// Granular (specific modules)
@Service({ exposeTo: ['orders', 'payments'] })
export class UsersService { }
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

No manual registration needed!

## 📦 Key Features

- ✅ **Automatic Service Registration** - Dependency injection with tsyringe
- ✅ **Granular Access Control** - Module visibility with `@Service` decorator
- ✅ **Type-Safe API Versioning** - Multiple versions from config
- ✅ **Response Helpers** - Consistent response formats
- ✅ **Full CRUD Generation** - Tooler creates complete modules
- ✅ **OpenAPI Documentation** - Auto-generated API docs
- ✅ **Database Migrations** - Integrated Drizzle Kit workflow
- ✅ **Context Variables** - Logger and requestId in all handlers

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

## 🧪 Development

```bash
# Development mode (with hot reload & module watcher)
bun dev

# Simple mode (no watcher)
bun run dev:simple

# Generate module list
bun run generate:modules
```

## 🏗️ Architecture

Built on:
- **Runtime**: Bun
- **Framework**: Hono
- **Validation**: Zod
- **ORM**: Drizzle
- **DI**: tsyringe
- **API Docs**: Scalar

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
