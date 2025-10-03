# Service Decorator Documentation

A comprehensive guide to the `@Service` decorator - the foundation of dependency injection and access control in Naalya API.

---

## Table of Contents

- [Overview](#overview)
- [Basic Usage](#basic-usage)
  - [Private Services](#private-services)
  - [Public Services](#public-services)
  - [Granular Access Control](#granular-access-control)
- [Type Safety & Autocomplete](#type-safety--autocomplete)
- [Access Control Rules](#access-control-rules)
- [Examples](#examples)
  - [Module-to-Module Access](#module-to-module-access)
  - [Provider Access](#provider-access)
  - [Multiple Consumers](#multiple-consumers)
- [Error Messages](#error-messages)
- [Best Practices](#best-practices)
- [Advanced Topics](#advanced-topics)
  - [How It Works](#how-it-works)
  - [Module Detection](#module-detection)
  - [Validation Flow](#validation-flow)
- [Troubleshooting](#troubleshooting)

---

## Overview

The `@Service` decorator is a powerful class decorator that:

1. **Registers services** in the dependency injection container (using tsyringe)
2. **Enforces access control** between modules and providers
3. **Provides type safety** with autocomplete for module identifiers
4. **Validates dependencies** at both compile-time and runtime

### Key Features

- ✅ **NestJS-inspired** - Familiar pattern for experienced developers
- ✅ **Three visibility levels** - Private, Public, and Granular
- ✅ **Type-safe** - Full TypeScript autocomplete for module names
- ✅ **Runtime validation** - Catches invalid configurations before service initialization
- ✅ **Clear error messages** - Helpful guidance when access is denied
- ✅ **Zero configuration** - Works automatically with auto-discovery

---

## Basic Usage

### Private Services

**Default behavior** - Services are private and only accessible within their own module.

```typescript
import { Service } from "@/decorators";

@Service()
export class UsersService {
  constructor(private readonly logger: AppLogger) {}
  
  async getAll() {
    // Module-specific business logic
    return [];
  }
}
```

**Access Rules:**
- ✅ Can be used in `users/routes/index.ts`
- ✅ Can be used in `users/users.controller.ts`
- ✅ Can be used in other services within the `users` module
- ❌ Cannot be injected in `orders/orders.service.ts`
- ❌ Cannot be used via `getService()` from other modules

---

### Public Services

**Globally accessible** - Services that can be used anywhere in the application.

```typescript
import { Service } from "@/decorators";

@Service({ visibility: "public" })
export class StripeProvider {
  constructor(private readonly logger: AppLogger) {}
  
  async processPayment(amount: number) {
    // Integration logic accessible to all modules
    return { success: true };
  }
}
```

**Access Rules:**
- ✅ Can be used from any module
- ✅ Can be used from any provider
- ✅ Intended for shared services and integrations
- ✅ Common for providers, loggers, and core utilities

**Use Cases:**
- Third-party integrations (Stripe, SendGrid, AWS)
- Core utilities (AppLogger, CacheService)
- Shared infrastructure (Database, Queue)

---

### Granular Access Control

**Selective access** - Expose a service to specific modules only.

```typescript
import { Service } from "@/decorators";

@Service({ exposeTo: ['school', 'attendance'] })
export class StaffService {
  constructor(private readonly logger: AppLogger) {}
  
  async getStaffList() {
    // Only accessible by staff, school, and attendance modules
    return [];
  }
}
```

**Access Rules:**
- ✅ Can be used in `staff` module (own module)
- ✅ Can be used in `school` module (explicitly allowed)
- ✅ Can be used in `attendance` module (explicitly allowed)
- ❌ Cannot be used in any other module

**Benefits:**
- Fine-grained control over dependencies
- Documents intended usage in code
- Prevents unintended coupling
- Easier to refactor (know exactly who depends on what)

---

## Type Safety & Autocomplete

The decorator provides **full TypeScript autocomplete** for module identifiers.

### How It Works

1. **Module list is generated** automatically at `src/_generated/modules.ts`
2. **Type is imported** in the decorator
3. **Autocomplete shows** all available modules when typing

### Example

```typescript
@Service({ exposeTo: [
  // ^ Press Ctrl+Space here to see autocomplete!
  // Available options:
  // - "staff"
  // - "school"
  // - "attendance"
  // - "provider:stripe"
  // - "provider:email"
]})
export class StaffService { }
```

### Generated Type

```typescript
// src/_generated/modules.ts (auto-generated)
export type ModuleIdentifier = 
  | "staff"
  | "school"
  | "attendance"
  | "provider:stripe"
  | "provider:email";
```

### Validation

**Compile-time (TypeScript):**
```typescript
// ❌ TypeScript error
@Service({ exposeTo: ['invalid-module'] })
export class StaffService { }
// Error: Type '"invalid-module"' is not assignable to type 'ModuleIdentifier'
```

**Runtime (Decorator validation):**
```typescript
// ❌ Runtime error (if TypeScript is bypassed)
@Service({ exposeTo: ['typo-module'] as any })
export class StaffService { }
// Error: Invalid exposeTo configuration in StaffService:
//   Invalid modules: [typo-module]
```

---

## Access Control Rules

### Rule 1: Same Module Access

Services can always access other services within their own module.

```typescript
// In users/users.service.ts
@Service()
export class UsersService { }

// In users/users.helper.ts
@Service()
export class UsersHelper {
  constructor(
    private readonly usersService: UsersService  // ✅ Same module
  ) {}
}
```

---

### Rule 2: Public Access

Public services can be accessed from anywhere.

```typescript
// In utils/logger.ts
@Service({ visibility: "public" })
export class AppLogger { }

// In any module/provider
@Service()
export class AnyService {
  constructor(
    private readonly logger: AppLogger  // ✅ Public service
  ) {}
}
```

---

### Rule 3: Granular Access

Services with `exposeTo` can be accessed by specified modules only.

```typescript
// In staff/staff.service.ts
@Service({ exposeTo: ['school', 'attendance'] })
export class StaffService { }

// In school/school.service.ts
@Service()
export class SchoolService {
  constructor(
    private readonly staffService: StaffService  // ✅ In exposeTo list
  ) {}
}

// In orders/orders.service.ts
@Service()
export class OrdersService {
  constructor(
    private readonly staffService: StaffService  // ❌ Not in exposeTo list
  ) {}
}
```

---

### Rule 4: Provider Access

Providers are prefixed with `provider:` in the `exposeTo` field.

```typescript
// In users/users.service.ts
@Service({ exposeTo: ['provider:stripe', 'provider:email'] })
export class UsersService { }

// In providers/stripe/stripe.service.ts
@Service({ visibility: "public" })
export class StripeProvider {
  constructor(
    private readonly usersService: UsersService  // ✅ In exposeTo list
  ) {}
}
```

---

## Examples

### Module-to-Module Access

#### Scenario: Schools need to access Staff data

**staff.service.ts:**
```typescript
@Service({ exposeTo: ['school'] })
export class StaffService {
  constructor(private readonly logger: AppLogger) {}
  
  async getStaffBySchool(schoolId: string) {
    return db.select()
      .from(staffTable)
      .where(eq(staffTable.schoolId, schoolId));
  }
}
```

**school.service.ts:**
```typescript
@Service()
export class SchoolService {
  constructor(
    private readonly logger: AppLogger,
    private readonly staffService: StaffService  // ✅ Allowed
  ) {}
  
  async getSchoolWithStaff(schoolId: string) {
    const school = await this.getById(schoolId);
    const staff = await this.staffService.getStaffBySchool(schoolId);
    return { school, staff };
  }
}
```

---

### Provider Access

#### Scenario: Stripe provider needs access to Orders and Payments

**orders.service.ts:**
```typescript
@Service({ exposeTo: ['provider:stripe'] })
export class OrdersService {
  async getOrderTotal(orderId: string) {
    // Calculate order total
    return 99.99;
  }
}
```

**stripe.service.ts:**
```typescript
@Service({ visibility: "public" })
export class StripeProvider {
  constructor(
    private readonly ordersService: OrdersService  // ✅ Allowed
  ) {}
  
  async createPaymentIntent(orderId: string) {
    const total = await this.ordersService.getOrderTotal(orderId);
    // Process payment with Stripe
    return { clientSecret: "..." };
  }
}
```

---

### Multiple Consumers

#### Scenario: Notifications service used by multiple modules

**notifications.service.ts:**
```typescript
@Service({ exposeTo: ['orders', 'users', 'provider:email'] })
export class NotificationsService {
  constructor(private readonly logger: AppLogger) {}
  
  async sendNotification(userId: string, message: string) {
    // Send notification logic
  }
}
```

**Usage across modules:**
```typescript
// In orders/orders.service.ts
@Service()
export class OrdersService {
  constructor(
    private readonly notifications: NotificationsService  // ✅ Allowed
  ) {}
}

// In users/users.service.ts
@Service()
export class UsersService {
  constructor(
    private readonly notifications: NotificationsService  // ✅ Allowed
  ) {}
}

// In payments/payments.service.ts
@Service()
export class PaymentsService {
  constructor(
    private readonly notifications: NotificationsService  // ❌ Not allowed
  ) {}
}
```

---

## Error Messages

### Access Denied (No exposeTo)

```
Access denied: SchoolService in "school" module cannot inject StaffService 
which is private to the "staff" module.

To fix this, you can:
1. Mark the service as public: @Service({ visibility: 'public' })
2. Add 'school' to exposeTo: @Service({ exposeTo: ['school'] })
3. Remove the cross-module dependency (recommended for clean architecture)
```

### Access Denied (With exposeTo)

```
Access denied: OrdersService in "orders" module cannot inject StaffService 
which is private to the "staff" module. This service is only exposed to: [school, attendance].

To fix this, you can:
1. Mark the service as public: @Service({ visibility: 'public' })
2. Add 'orders' to exposeTo: @Service({ exposeTo: ['school', 'attendance', 'orders'] })
3. Remove the cross-module dependency (recommended for clean architecture)
```

### Invalid Module Identifier

```
Invalid exposeTo configuration in StaffService:
  Invalid modules: [shcool, attndance]

Run 'bun run generate:modules' to see available modules.
Available modules are listed in src/_generated/modules.ts
```

---

## Best Practices

### 1. Default to Private

Start with private services and only expose when necessary.

```typescript
// ✅ Good - Private by default
@Service()
export class UsersService {
  // Keep implementation details hidden
}
```

```typescript
// ❌ Avoid - Don't make everything public
@Service({ visibility: "public" })
export class UsersService {
  // Now every module can depend on this
}
```

---

### 2. Use Granular Access Over Public

Prefer `exposeTo` over `public` for better control.

```typescript
// ✅ Better - Explicit dependencies
@Service({ exposeTo: ['orders', 'payments'] })
export class UsersService {
  // Clear which modules depend on this
}
```

```typescript
// ❌ Less ideal - Opens to everything
@Service({ visibility: "public" })
export class UsersService {
  // Any module can now depend on this
}
```

---

### 3. Document Why Exposure is Needed

Add comments explaining the reasoning.

```typescript
/**
 * StaffService
 * Exposed to school module because schools need to fetch their staff members
 * Exposed to attendance module for staff attendance tracking
 */
@Service({ exposeTo: ['school', 'attendance'] })
export class StaffService {
  // Implementation
}
```

---

### 4. Keep Provider Access Patterns Consistent

Use consistent naming for providers in `exposeTo`.

```typescript
// ✅ Good - Use provider: prefix
@Service({ exposeTo: ['provider:stripe', 'provider:email'] })
export class PaymentsService { }

// ❌ Bad - Missing prefix
@Service({ exposeTo: ['stripe', 'email'] })
export class PaymentsService { }
```

---

### 5. Regular Audits

Periodically review your `exposeTo` configurations to ensure they're still needed.

```bash
# Search for all exposeTo usage
grep -r "exposeTo" src/modules src/providers
```

---

## Advanced Topics

### How It Works

#### 1. Decorator Execution

```
Service class defined
    ↓
@Service() decorator applied
    ↓
Extract module from file path (via stack trace)
    ↓
Validate exposeTo field (if provided)
    ↓
Register with tsyringe (injectable + singleton)
    ↓
Validate constructor dependencies
    ↓
Resolve instance from container
    ↓
Store in ServiceRegistry with metadata
```

#### 2. Metadata Storage

Each service is stored with:

```typescript
interface ServiceMetadata {
  instance: any;              // The resolved service instance
  visibility: "public" | "private";  // Access level
  module?: string;            // Module name (e.g., "users", "provider:stripe")
  name: string;               // Service class name
  exposeTo?: string[];        // List of allowed modules
}
```

#### 3. Access Validation

When a service is injected:

```
Constructor dependency requested
    ↓
Extract calling module from stack trace
    ↓
Get dependency metadata from registry
    ↓
Check visibility rules:
  - Public? → Allow
  - Same module? → Allow
  - In exposeTo list? → Allow
  - Otherwise → Deny with error
```

---

### Module Detection

Module names are automatically detected from file paths:

```typescript
// File: src/modules/users/users.service.ts
// Detected module: "users"

// File: src/providers/stripe/stripe.service.ts
// Detected module: "provider:stripe"

// File: src/utils/logger.ts
// Detected module: undefined (global scope)
```

**Stack Trace Pattern Matching:**

```javascript
function getModuleFromStack(): string | undefined {
  const stack = new Error().stack;
  
  // Match: /modules/{moduleName}/
  const moduleMatch = stack.match(/\/modules\/([^\/]+)\//);
  if (moduleMatch) return moduleMatch[1];
  
  // Match: /providers/{providerName}/
  const providerMatch = stack.match(/\/providers\/([^\/]+)\//);
  if (providerMatch) return `provider:${providerMatch[1]}`;
  
  return undefined;
}
```

---

### Validation Flow

#### Constructor Injection Validation

```typescript
@Service({ exposeTo: ['school'] })
export class StaffService {
  constructor(private readonly logger: AppLogger) {}
  //                          ↑
  //          Validated before service is instantiated
}
```

**Steps:**
1. Decorator extracts constructor parameter types using `reflect-metadata`
2. For each dependency, checks if it's in ServiceRegistry
3. Validates access using visibility rules
4. Throws error if access denied
5. Only if all validations pass, resolves the service

#### Manual Access Validation

```typescript
// Using getService()
const staffService = getService(StaffService);
//                     ↑
//     Validates access based on caller's module
```

**Steps:**
1. Extract calling module from stack trace
2. Get service metadata from registry
3. Validate access rules
4. Return instance or throw error

---

## Troubleshooting

### Issue: Autocomplete Not Working

**Problem:** TypeScript doesn't show module names when typing `exposeTo`.

**Solution:**

1. Generate the module list:
   ```bash
   bun run generate:modules
   ```

2. Restart TypeScript server in your IDE:
   - VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
   - Cursor: Same as VS Code

3. Verify the generated file exists:
   ```bash
   cat src/_generated/modules.ts
   ```

---

### Issue: Module List Out of Sync

**Problem:** Added a new module but it doesn't appear in autocomplete.

**Solution:**

The module list auto-regenerates with `bun dev`. If not running:

```bash
bun run generate:modules
```

Or start dev mode which watches for changes:

```bash
bun dev
# Automatically regenerates when modules/providers are added/removed
```

---

### Issue: Circular Dependencies

**Problem:** Two services depend on each other.

**Example:**
```typescript
// users.service.ts
@Service({ exposeTo: ['orders'] })
export class UsersService {
  constructor(private readonly ordersService: OrdersService) {}
}

// orders.service.ts
@Service({ exposeTo: ['users'] })
export class OrdersService {
  constructor(private readonly usersService: UsersService) {}
}
```

**Solution:**

1. **Refactor to remove circular dependency** (best approach)
2. **Use facades** to break the cycle
3. **Inject only one way** and use method calls for the other

---

### Issue: Access Denied Despite exposeTo

**Problem:** Service is in `exposeTo` but still getting access denied.

**Possible Causes:**

1. **Typo in module name:**
   ```typescript
   // ❌ Wrong
   @Service({ exposeTo: ['shcool'] })  // Typo!
   
   // ✅ Correct
   @Service({ exposeTo: ['school'] })
   ```

2. **Wrong provider prefix:**
   ```typescript
   // ❌ Wrong
   @Service({ exposeTo: ['stripe'] })
   
   // ✅ Correct
   @Service({ exposeTo: ['provider:stripe'] })
   ```

3. **Module list not regenerated:**
   ```bash
   bun run generate:modules
   ```

---

### Issue: Cannot Use exposeTo with Public

**Problem:** Getting error when using both `visibility: "public"` and `exposeTo`.

**Error:**
```
Invalid @Service configuration in UsersService:
Cannot use 'exposeTo' when visibility is 'public'.

Public services are accessible from all modules, making 'exposeTo' redundant.
```

**Solution:**

Choose one approach:

```typescript
// Option 1: Remove exposeTo (keep public)
@Service({ visibility: "public" })
export class UsersService { }

// Option 2: Remove visibility (use granular access)
@Service({ exposeTo: ['orders', 'payments'] })
export class UsersService { }
```

---

## Configuration

### Enabling/Disabling Access Control

Access control is always enabled. To temporarily disable for debugging:

```typescript
// In get-service.ts - comment out validation (NOT recommended for production)
function validateServiceAccess(...) {
  // return;  // Temporarily disable
  
  // ... validation logic
}
```

### Viewing Registered Services

On server startup, you'll see all registered services with their visibility:

```
[ Services ]
[ Service ] AppLogger [PUBLIC]
[ Service ] StaffService [PRIVATE] (staff) → [school, attendance]
[ Service ] SchoolService [PRIVATE] (school)
[ Service ] StripeProvider [PUBLIC] (provider:stripe)
[ Service ] UsersService [PRIVATE] (users)
```

**Legend:**
- `[PUBLIC]` - Accessible from anywhere
- `[PRIVATE]` - Module-scoped
- `(module-name)` - Which module owns the service
- `→ [...]` - Which modules can access it (if exposeTo is set)

---

## API Reference

### `@Service(options?)`

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `options.visibility` | `"public" \| "private"` | `"private"` | Service visibility level |
| `options.exposeTo` | `ModuleIdentifier[]` | `undefined` | List of modules that can access this service (only valid when visibility is private) |

**Returns:** Class decorator

**Important:** You **cannot** use both `visibility: "public"` and `exposeTo` together. Public services are accessible everywhere, making `exposeTo` redundant and will throw an error.

**Examples:**

```typescript
// Private (default)
@Service()

// Public
@Service({ visibility: "public" })

// Granular
@Service({ exposeTo: ['orders', 'payments'] })

// ❌ Invalid - Will throw error
@Service({ visibility: "public", exposeTo: ['orders'] })
// Error: Cannot use 'exposeTo' when visibility is 'public'
```

---

### Module Identifier Format

**Modules:** Use the module folder name
```typescript
src/modules/users/  → "users"
src/modules/orders/ → "orders"
```

**Providers:** Prefix with `provider:`
```typescript
src/providers/stripe/ → "provider:stripe"
src/providers/email/  → "provider:email"
```

---

## Integration with Tooler

### Creating Services with Visibility

```bash
# Module with private service (default)
bun tooler create module users

# Module with public service
bun tooler create module users --public

# Provider with public service (default)
bun tooler create provider stripe

# Provider with private service
bun tooler create provider cache --private
```

### Generated Code

**Private module service:**
```typescript
@Service()
export class UsersService { }
```

**Public provider service:**
```typescript
@Service({ visibility: "public" })
export class StripeProvider { }
```

---

## Summary

The `@Service` decorator provides:

1. **Automatic registration** - Services are discovered and registered
2. **Access control** - Enforce module boundaries
3. **Type safety** - Full autocomplete for module identifiers
4. **Flexibility** - Three visibility levels (private, granular, public)
5. **Clear errors** - Helpful messages when things go wrong

### Decision Tree

```
Need cross-module access?
├─ No  → @Service()
└─ Yes → Need access from everywhere?
         ├─ Yes → @Service({ visibility: "public" })
         └─ No  → @Service({ exposeTo: ['module1', 'module2'] })
```

### Quick Reference

| Use Case | Decorator | Example |
|----------|-----------|---------|
| Module CRUD operations | `@Service()` | `UsersService` |
| Shared utility | `@Service({ visibility: "public" })` | `AppLogger` |
| 3rd party integration | `@Service({ visibility: "public" })` | `StripeProvider` |
| Selective sharing | `@Service({ exposeTo: ['orders'] })` | `UsersService` |

---

## Additional Resources

- [Service Visibility Documentation](./SERVICE_VISIBILITY.md)
- [Tooler CLI Documentation](./TOOLER.md)
- [tsyringe Documentation](https://github.com/microsoft/tsyringe)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
