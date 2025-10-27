# Tooler CLI

Code scaffolding for the Naalya API. Generates modules, providers, and DTOs with consistent patterns.

## Quick Start

```bash
# Create a full CRUD module
bun tooler create module products

# Create a module without database
bun tooler create module notifications --slim

# Create a provider
bun tooler create provider stripe

# List everything
bun tooler list
```

## Commands

### `create module <name>`

Generates a complete module with CRUD operations, routes, and OpenAPI docs.

**Creates:**
- Service with CRUD methods
- 6 separate DTO files (user.dto, createUser.dto, updateUser.dto, getUser.dto, listUsers.dto, deleteUser.dto)
- OpenAPI route definitions
- Database schema
- Auto-registered routes

**Flags:**
- `--slim` - Skip database/CRUD (just service + routes)
- `--public` - Make service accessible everywhere
- `--version <v>` - API version (default: v1)

**Endpoints (full module):**
- `GET    /api/v1/<name>` - List with pagination
- `GET    /api/v1/<name>/:id` - Get by ID
- `POST   /api/v1/<name>` - Create
- `PATCH  /api/v1/<name>/:id` - Update
- `DELETE /api/v1/<name>/:id` - Delete

---

### `create provider <name>`

Generates a provider for third-party integrations.

**Creates:**
- Service class for integration logic
- DTO for configuration/data types
- Optional database schema (prompted)

**Flags:**
- `--private` - Make service module-scoped

---

### `list [type]`

Shows project overview.

**Types:**
- `all` - Everything (default)
- `modules` - All modules with services
- `providers` - All providers with services
- `routes` - API endpoints
- `entities` - Database schemas
- `schemas` - OpenAPI schemas

**Example output:**
```
📦 Modules (2)
  users
    ├─ Services: 1
    └─ UserService (private)
    └─ Features: routes, entities, 6 DTOs

🔌 Providers (4)
  stripe
    ├─ Services: 1
    └─ StripeProvider (private)
       └─ Exposed To: payments, subscriptions
```

---

## Service Visibility

### Private (Default for Modules)
```typescript
@Service()
// Only accessible within its own module
```

### Public (Default for Providers)
```typescript
@Service({ visibility: "public" })
// Accessible everywhere
```

### Granular Access
```typescript
@Service({ exposeTo: ["orders", "provider:stripe"] })
// Private but exposed to specific modules
```

---

## DTO Structure (Full Modules)

Each operation gets its own DTO file:

```
interfaces/
├── product.dto.ts           # Base entity + ID param
├── createProduct.dto.ts     # Create request/response
├── updateProduct.dto.ts     # Update request/response
├── getProduct.dto.ts        # Get single response
├── listProducts.dto.ts      # List query + response (pagination)
└── deleteProduct.dto.ts     # Delete response
```

**Benefits:**
- Clear separation of concerns
- Easy to find and modify
- Auto-discovered by OpenAPI
- Better tree-shaking

---

## Examples

### Full CRUD Module
```bash
bun tooler create module users
# Creates: service, 6 DTOs, routes, OpenAPI, database schema
# Routes: /api/v1/users
```

### Slim Module (No Database)
```bash
bun tooler create module weather --slim
# Creates: service, 1 DTO, routes, OpenAPI
# Perfect for API proxies or calculations
```

### Public Module
```bash
bun tooler create module auth --public
# Creates module that other modules can import
```

### Provider
```bash
bun tooler create provider sendgrid
# Creates provider for email service
# Prompted: database entity? migrations?
```

### List Project
```bash
bun tooler list               # Everything
bun tooler list modules       # Modules only
bun tooler list routes        # API endpoints
```

---

## File Structure

```
scripts/tooler/
├── index.js                 # CLI entry
├── commands/
│   ├── create-module.js     # Module generator
│   ├── create-provider.js   # Provider generator
│   └── list.js              # Project listing
├── templates/
│   ├── dtos/                # Separate DTO templates
│   │   ├── user-dto.template.js
│   │   ├── createUser-dto.template.js
│   │   ├── updateUser-dto.template.js
│   │   ├── getUser-dto.template.js
│   │   ├── listUsers-dto.template.js
│   │   └── deleteUser-dto.template.js
│   ├── service.template.js
│   ├── openapi.template.js
│   └── ...
└── utils/
    ├── logger.js            # Colored output
    ├── prompt.js            # Interactive prompts
    └── string.js            # Text utilities
```

---

## Defaults

- **Modules:** Private services
- **Providers:** Public services
- **API Version:** v1 (from `api.config.yml`)
- **Migrations:** Prompted after generation

---

## Tips

- Use `list` command to see what you have
- Slim modules for APIs without databases
- Providers for third-party integrations
- Full modules for domain entities with CRUD
- All schemas auto-register in OpenAPI docs
