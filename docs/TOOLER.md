# Naalya Tooler CLI

A powerful code generator for the Naalya API that scaffolds modules, providers, and handles database migrations with an interactive workflow.

---

## Table of Contents

- [Usage](#usage)
  - [Overview](#overview)
  - [Commands](#commands)
  - [Flags](#flags)
  - [Examples](#examples)
  - [Service Visibility](#service-visibility)
  - [Migration Workflow](#migration-workflow)
  - [Best Practices](#best-practices)
- [Contributing](#contributing)
  - [Architecture](#architecture)
  - [File Structure](#file-structure)
  - [Adding New Commands](#adding-new-commands)
  - [Adding New Templates](#adding-new-templates)
  - [Modifying Existing Commands](#modifying-existing-commands)
  - [Testing](#testing)
  - [Code Style](#code-style)

---

## Usage

### Overview

The Naalya Tooler is a CLI tool that automates the creation of:
- **Modules**: Business logic with full CRUD operations, routes, and OpenAPI specs
- **Providers**: Third-party integrations and shared services

It follows NestJS-inspired patterns with automatic service registration, route discovery, and built-in visibility control.

### Commands

#### **`create module <name>`**

Creates a complete module with:
- Service class with full CRUD operations
- DTOs with Zod validation schemas
- Routes with OpenAPI specifications
- Drizzle ORM schema
- Auto-registered routes at `/api/v1/<name>`

**Structure created:**
```
src/modules/<name>/
├── <name>.service.ts              # Business logic with CRUD
├── interfaces/
│   └── <name>.dto.ts              # Zod schemas & TypeScript types
├── routes/
│   ├── index.ts                   # Route registration
│   └── <name>.openapi.ts          # OpenAPI route definitions
└── entities/
    └── <name>.schema.ts           # Drizzle database schema
```

**Generated routes:**
- `GET    /api/v1/<name>`           - Get all records
- `GET    /api/v1/<name>/paginated` - Get paginated records
- `GET    /api/v1/<name>/:id`       - Get record by ID
- `POST   /api/v1/<name>`           - Create new record
- `PATCH  /api/v1/<name>/:id`       - Update record
- `DELETE /api/v1/<name>/:id`       - Delete record

---

#### **`create provider <name>`**

Creates a provider for third-party integrations:
- Service class for integration logic
- DTOs for configuration and data types
- Optional database schema (prompted interactively)

**Structure created:**
```
src/providers/<name>/
├── <name>.service.ts              # Integration logic
├── interfaces/
│   └── <name>.dto.ts              # Config & data schemas
└── entities/                      # Optional
    └── <name>.schema.ts           # If database entity needed
```

---

### Flags

#### **`--public`**
Makes the service accessible from other modules.

```bash
bun tooler create module users --public
# Generates: @Service({ visibility: "public" })
```

#### **`--private`**
Makes the service accessible only within its module.

```bash
bun tooler create provider stripe --private
# Generates: @Service()
```

#### **`--version <version>`**
Specifies the API version for the module (default: from `api.config.yml`).

```bash
bun tooler create module users --version v2
# Creates module for API v2
# Routes: /api/v2/users
```

**Note:** Version must be listed in `api.config.yml` `availableVersions`.

#### **`--help`**
Shows help information.

```bash
bun tooler --help
```

---

### Examples

#### **Basic Module Creation**

```bash
# Create a users module (private by default)
bun tooler create module users
```

**Output:**
```
🚀 Creating module: users

ℹ Creating directory structure...
✓ Directory structure created
ℹ Creating users.service.ts...
✓ users.service.ts created
ℹ Creating interfaces/users.dto.ts...
✓ interfaces/users.dto.ts created
ℹ Creating routes/index.ts...
✓ routes/index.ts created
ℹ Creating routes/users.openapi.ts...
✓ routes/users.openapi.ts created
ℹ Creating entities/users.schema.ts...
✓ entities/users.schema.ts created

✨ Module "users" created successfully!

? Would you like to generate migrations? (y/N):
```

---

#### **Public Module (Shared Service)**

```bash
# Create a module that other modules can use
bun tooler create module notifications --public
```

This creates a service that can be imported and used in other modules.

---

#### **Provider Creation**

```bash
# Create a Stripe integration provider (public by default)
bun tooler create provider stripe
```

**Interactive prompts:**
```
? Does this provider need a database entity? (y/N): y
ℹ Creating entities/stripe.schema.ts...
✓ entities/stripe.schema.ts created

? Would you like to generate migrations? (y/N): y
ℹ Generating migrations...
✓ Migrations generated successfully

? Would you like to run the migrations now? (y/N): y
ℹ Running migrations...
✓ Migrations applied successfully
```

---

#### **Private Provider (Internal Use)**

```bash
# Create a provider only used within a specific context
bun tooler create provider cache --private
```

---

### Service Visibility

Services use a NestJS-inspired visibility system to enforce module boundaries.

#### **Default Behavior**

- **Modules**: Create `private` services (module-scoped)
- **Providers**: Create `public` services (globally accessible)

#### **Private Services (Default for Modules)**

```typescript
@Service()
export class UsersService {
  // Only accessible within the users module
}
```

**Access control:**
- ✅ Can be used in `users/routes/index.ts`
- ✅ Can be used in `users/users.facade.ts`
- ❌ Cannot be imported in `orders/orders.service.ts`

#### **Public Services (Default for Providers)**

```typescript
@Service({ visibility: "public" })
export class StripeProvider {
  // Accessible from any module
}
```

**Access control:**
- ✅ Can be used anywhere in the application
- ✅ Intended for shared services and integrations

#### **Error Example**

```typescript
// ❌ This will fail at runtime
// src/modules/orders/orders.service.ts
import { UsersService } from "@/modules/users/users.service";

@Service()
export class OrdersService {
  constructor(private readonly usersService: UsersService) {}
  // Error: Access denied: UsersService is private to the "users" module
}
```

**Solution:** Mark UsersService as public or create a UsersFacade.

---

### Migration Workflow

The tooler integrates with Drizzle Kit for database migrations.

#### **1. Module Creation with Migrations**

```bash
bun tooler create module products
```

After files are created, you'll be prompted:

```
? Would you like to generate migrations for the database schema? (y/N): y
ℹ Generating migrations...
[Drizzle Kit output...]
✓ Migrations generated successfully

? Would you like to run the migrations now? (y/N): y
ℹ Running migrations...
[Drizzle Kit output...]
✓ Migrations applied successfully
```

#### **2. Manual Migration**

If you skip migrations during creation:

```bash
# Generate migrations
bun run migration:generate

# Run migrations
bun run migration:run
```

#### **3. Workflow Best Practices**

1. Create module/provider with tooler
2. Customize the schema in `entities/*.schema.ts`
3. Generate migrations
4. Review generated SQL in `drizzle/migrations/`
5. Run migrations to apply changes

---

### Best Practices

#### **1. Module vs Provider**

**Use Modules for:**
- Business logic (users, products, orders)
- CRUD operations
- Domain-specific functionality
- Features with REST APIs

**Use Providers for:**
- Third-party integrations (Stripe, SendGrid, AWS)
- Shared utilities (caching, logging)
- External service wrappers
- Infrastructure concerns

#### **2. Service Visibility**

**Keep services private when:**
- They're module-specific CRUD operations
- They directly access the database
- They contain business logic specific to one domain

**Make services public when:**
- They're providers (integrations)
- They're facades exposing specific functionality
- They're shared utilities (AppLogger)
- Other modules need to access them

#### **3. Naming Conventions**

- **Modules**: Use plural nouns (`users`, `products`, `orders`)
- **Providers**: Use singular nouns (`stripe`, `email`, `storage`)
- **Files**: Use kebab-case (`user-profile`, `email-sender`)

#### **4. Database Schemas**

After generating a module/provider:

1. Open `entities/*.schema.ts`
2. Customize columns based on your needs
3. Add indexes, foreign keys, and constraints
4. Run migrations

#### **5. DTOs and Validation**

Customize `interfaces/*.dto.ts` to:
- Add proper validation rules with Zod
- Define request/response types
- Add custom schemas for specific operations
- Document fields with JSDoc comments

---

## Contributing

### Architecture

The Tooler CLI is built with a modular architecture for easy extension and maintenance.

#### **Core Concepts**

1. **Commands** - Handle business logic for each CLI command
2. **Templates** - Generate code with consistent patterns
3. **Utils** - Shared functionality (logging, prompts, string manipulation)
4. **Index** - CLI entry point and argument parsing

#### **Execution Flow**

```
User runs command
    ↓
index.js parses arguments & flags
    ↓
Routes to appropriate command (create-module.js or create-provider.js)
    ↓
Command uses templates to generate files
    ↓
Command prompts user for migrations (if applicable)
    ↓
Command runs migration scripts (if user confirms)
    ↓
Success message with next steps
```

---

### File Structure

```
scripts/tooler/
├── index.js                          # CLI entry point & argument parser
├── commands/
│   ├── create-module.js              # Module creation logic
│   └── create-provider.js            # Provider creation logic
├── templates/
│   ├── service.template.js           # Module service template
│   ├── provider.template.js          # Provider service template
│   ├── dto.template.js               # Module DTO template
│   ├── provider-dto.template.js      # Provider DTO template
│   ├── routes.template.js            # Routes template
│   ├── openapi.template.js           # OpenAPI template
│   └── schema.template.js            # Drizzle schema template
└── utils/
    ├── logger.js                     # Colored logging functions
    ├── prompt.js                     # Interactive prompts
    ├── string.js                     # String manipulation (toPascalCase, etc.)
    └── config.js                     # Config loader (api.config.yml)

src/
├── lib/                              # Framework-level utilities
│   ├── get-service.ts                # Dependency injection
│   ├── logger.ts                     # Logging service
│   ├── response-helpers.ts           # Response utilities
│   ├── response-schemas.ts           # Schema factories
│   ├── error-schemas.ts              # Error schemas
│   ├── format-validation-error.ts    # Validation formatter
│   ├── route-registry.ts             # Route registration
│   ├── log-services.ts               # Service logging
│   └── types.ts                      # App environment types
└── utils/                            # Business logic utilities
    └── index.ts                      # App-specific helpers
```

---

### Adding New Commands

To add a new command (e.g., `create controller`):

#### **1. Create Command File**

Create `scripts/tooler/commands/create-controller.js`:

```javascript
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import {
  colors,
  logError,
  logHeader,
  logInfo,
  logSuccess,
} from "../utils/logger.js";

/**
 * Creates a controller with all necessary files
 * @param {string} controllerName - The name of the controller to create
 * @param {string} visibility - Service visibility ('public' or 'private')
 */
export async function createController(controllerName, visibility = "private") {
  try {
    logHeader(`🚀 Creating controller: ${controllerName}`);

    const baseDir = resolve(process.cwd(), "src", "controllers", controllerName);

    // Check if exists
    if (existsSync(baseDir)) {
      logError(`Controller "${controllerName}" already exists!`);
      process.exit(1);
    }

    // Create directories
    logInfo("Creating directory structure...");
    await mkdir(baseDir, { recursive: true });
    logSuccess("Directory structure created");

    // Generate files using templates
    // ... your file generation logic

    // Success message
    logHeader(`✨ Controller "${controllerName}" created successfully!`);
    console.log(`${colors.dim}Location: src/controllers/${controllerName}${colors.reset}`);
  } catch (error) {
    logError(`Failed to create controller: ${error.message}`);
    process.exit(1);
  }
}
```

#### **2. Update Index.js**

Add the command to `scripts/tooler/index.js`:

```javascript
import { createController } from "./commands/create-controller.js";

// In the CLI logic section:
else if (command === "create" && subCommand === "controller") {
  if (!name) {
    logError("Controller name is required!");
    console.log(
      `\nUsage: bun tooler create controller ${colors.yellow}<controller_name>${colors.reset}\n`
    );
    process.exit(1);
  }

  const visibility = flags.public ? "public" : "private";
  await createController(name, visibility);
}
```

#### **3. Update Help Text**

Add to the help function:

```javascript
${colors.green}create controller${colors.reset} ${colors.yellow}<controller_name>${colors.reset}  Create a new controller
```

---

### Adding New Templates

To add a new template (e.g., middleware template):

#### **1. Create Template File**

Create `scripts/tooler/templates/middleware.template.js`:

```javascript
import { toPascalCase } from "../utils/string.js";

/**
 * Generates the middleware template file content
 * @param {string} middlewareName - The name of the middleware
 * @returns {string} The middleware template content
 */
export function generateMiddlewareTemplate(middlewareName) {
  const className = toPascalCase(middlewareName);
  return `import type { Context, Next } from "hono";

/**
 * ${className}Middleware
 * Middleware for handling ${middlewareName}
 */
export async function ${middlewareName}Middleware(c: Context, next: Next) {
  // TODO: Add your middleware logic here
  console.log("${className} middleware executed");
  
  await next();
}
`;
}
```

#### **2. Import and Use in Command**

```javascript
import { generateMiddlewareTemplate } from "../templates/middleware.template.js";

// In your command:
await writeFile(
  join(baseDir, `${name}.middleware.ts`),
  generateMiddlewareTemplate(name)
);
```

#### **3. Template Best Practices**

- Use template literals for code generation
- Include proper JSDoc comments
- Add TODO comments for user customization
- Use consistent formatting (2-space indentation)
- Include imports that will be commonly needed
- Use string utilities (`toPascalCase`, `toCamelCase`)

---

### Modifying Existing Commands

#### **Example: Adding a New File to Module Creation**

To add a `module.config.ts` file when creating modules:

**1. Create the template:**

```javascript
// scripts/tooler/templates/config.template.js
export function generateConfigTemplate(moduleName) {
  const className = toPascalCase(moduleName);
  return `/**
 * ${className} Module Configuration
 */
export const ${moduleName}Config = {
  enableCache: true,
  timeout: 5000,
  // TODO: Add your config here
};
`;
}
```

**2. Update `create-module.js`:**

```javascript
import { generateConfigTemplate } from "../templates/config.template.js";

// In createModule function, after other files:

// ~ ======= Create config file ======= ~
logInfo(`Creating ${moduleName}.config.ts...`);
await writeFile(
  join(baseDir, `${moduleName}.config.ts`),
  generateConfigTemplate(moduleName)
);
logSuccess(`${moduleName}.config.ts created`);
```

---

### Testing

#### **Manual Testing**

**1. Test Basic Creation:**

```bash
# Test module creation
bun tooler create module test-users

# Verify files were created
ls -la src/modules/test-users

# Clean up
rm -rf src/modules/test-users
```

**2. Test with Flags:**

```bash
# Test visibility flags
bun tooler create module test-public --public
bun tooler create provider test-private --private

# Verify correct decorator in generated files
```

**3. Test Migration Workflow:**

```bash
# Create module and answer prompts
bun tooler create module test-products

# When prompted:
# - Say yes to migrations
# - Say yes to running migrations
# - Verify database changes
```

**4. Test Error Handling:**

```bash
# Try to create duplicate module
bun tooler create module users
bun tooler create module users  # Should error

# Try invalid flags
bun tooler create module test --public --private  # Should error
```

#### **Automated Testing (Future)**

Consider adding:
- Unit tests for template generators
- Integration tests for command execution
- Snapshot tests for generated files
- Mock file system for testing

---

### Code Style

#### **1. File Organization**

- One export per template file
- Group related utilities
- Use descriptive function names
- Add JSDoc comments for all public functions

#### **2. Naming Conventions**

- **Functions**: camelCase (`createModule`, `generateTemplate`)
- **Files**: kebab-case (`create-module.js`, `string-utils.js`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_VISIBILITY`)

#### **3. Comments**

```javascript
/**
 * Brief description
 * @param {string} name - Parameter description
 * @returns {string} Return value description
 */
export function myFunction(name) {
  // Implementation comments
}
```

#### **4. Error Handling**

```javascript
try {
  // Operation
  logSuccess("Operation completed");
} catch (error) {
  logError(`Failed to do something: ${error.message}`);
  process.exit(1);
}
```

#### **5. Logging**

Use semantic logging functions:

```javascript
logHeader("🚀 Creating module: users");  // Major sections
logInfo("Creating file...");              // Progress updates
logSuccess("✓ File created");             // Successful operations
logError("✗ Failed");                     // Errors
```

#### **6. User Interaction**

```javascript
// Use colored output for better UX
console.log(
  `Next step: Update ${colors.cyan}schema.ts${colors.reset}`
);

// Use prompts for yes/no questions
const shouldProceed = await promptYesNo(
  "Would you like to continue?",
  true  // default value
);
```

---

### Development Workflow

#### **1. Making Changes**

```bash
# 1. Edit tooler files
vim scripts/tooler/commands/create-module.js

# 2. Test your changes
bun tooler create module test-feature

# 3. Verify output
cat src/modules/test-feature/test-feature.service.ts

# 4. Clean up test files
rm -rf src/modules/test-feature
```

#### **2. Adding Dependencies**

The tooler uses only Node.js/Bun built-ins:
- `fs` / `fs/promises` - File system operations
- `path` - Path manipulation
- `readline` - Interactive prompts

Avoid adding external dependencies to keep it lightweight.

#### **3. Debugging**

Add temporary logging:

```javascript
console.log("DEBUG:", { moduleName, visibility, baseDir });
```

Use `--help` to test help output:

```bash
bun tooler --help
```

---

### Common Tasks

#### **Change Default Template Content**

Edit the appropriate template file in `scripts/tooler/templates/`.

#### **Add New Prompt**

Use the `promptYesNo` utility:

```javascript
import { promptYesNo } from "../utils/prompt.js";

const shouldAddTests = await promptYesNo(
  "Would you like to add test files?",
  false
);

if (shouldAddTests) {
  // Generate test files
}
```

#### **Modify Color Scheme**

Edit `scripts/tooler/utils/logger.js`:

```javascript
export const colors = {
  green: "\x1b[32m",  // Success
  blue: "\x1b[34m",   // Info
  yellow: "\x1b[33m", // Warning
  red: "\x1b[31m",    // Error
  cyan: "\x1b[36m",   // Highlight
};
```

---

## Summary

The Naalya Tooler provides a powerful, extensible CLI for scaffolding code with consistent patterns. Its modular architecture makes it easy to add new commands, modify existing ones, and maintain clean, generated code.

**Key Features:**
- ✅ NestJS-inspired patterns
- ✅ Automatic service registration
- ✅ Built-in visibility control
- ✅ Interactive migration workflow
- ✅ Extensible template system
- ✅ Beautiful colored output

**For Users:** Focus on business logic, let tooler handle boilerplate.

**For Contributors:** Clean architecture makes adding features straightforward.

---

## Additional Resources

- [Service Visibility Documentation](./SERVICE_VISIBILITY.md)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Hono Framework Documentation](https://hono.dev)
- [OpenAPI Specification](https://swagger.io/specification/)

