# @Service Decorator

Dependency injection and access control for Naalya API services.

## Quick Reference

```typescript
// Private (default)
@Service()
export class UsersService {}

// Public (accessible everywhere)
@Service({ visibility: "public" })
export class AppLogger {}

// Granular (specific modules only)
@Service({ exposeTo: ["orders", "payments"] })
export class UsersService {}
```

## What It Does

1. Registers service as singleton (tsyringe)
2. Resolves instance immediately
3. Enforces access control
4. Validates dependencies at startup
5. Auto-injects contextualized logger

## Options

### `visibility`
- `"public"` - Accessible everywhere
- `"private"` - Module-scoped (default)

### `exposeTo`
- Array of module identifiers
- Only works with private services
- Provides granular access control

```typescript
@Service({ exposeTo: ["orders", "provider:stripe"] })
```

## Type Safety

Module identifiers are auto-generated with full autocomplete:

```typescript
// src/_generated/modules.ts
export type ModuleIdentifier = 
  | "users"
  | "orders"
  | "provider:stripe";

// In your service
@Service({ exposeTo: [
  // ↑ Ctrl+Space shows autocomplete!
]})
```

Generate module list:
```bash
bun run generate:modules
```

## Access Rules

| From → To | Public | Private (Same Module) | Private (Different Module) | Granular |
|-----------|--------|----------------------|---------------------------|----------|
| Same Module | ✅ | ✅ | ❌ | Check list |
| Different Module | ✅ | ❌ | ❌ | Check list |
| Anywhere | ✅ | ❌ | ❌ | Check list |

## Examples

### Module with Dependencies
```typescript
@Service()
export class OrdersService {
  constructor(
    private readonly logger: AppLogger,        // ✅ Public
    private readonly usersService: UsersService // ❌ If UsersService is private
  ) {}
}
```

### Provider Accessing Module
```typescript
// In users.service.ts
@Service({ exposeTo: ["provider:stripe"] })
export class UsersService {}

// In stripe.service.ts
@Service({ visibility: "public" })
export class StripeProvider {
  constructor(
    private readonly usersService: UsersService // ✅ Allowed
  ) {}
}
```

## Module Identifier Format

**Modules:**
```
src/modules/users/  → "users"
src/modules/orders/ → "orders"
```

**Providers:**
```
src/providers/stripe/ → "provider:stripe"
src/providers/email/  → "provider:email"
```

## Validation

**Compile-time (TypeScript):**
```typescript
@Service({ exposeTo: ["invalid-module"] })
// Error: Type '"invalid-module"' is not assignable
```

**Runtime (Decorator):**
```typescript
@Service({ exposeTo: ["typo-module"] as any })
// Error: Invalid modules: [typo-module]
```

**Dependency (Injection):**
```typescript
constructor(private readonly privateService: PrivateService) {}
// Error: Access denied: cannot inject PrivateService
```

## Common Errors

### Cannot Use Both
```typescript
// ❌ Error
@Service({ 
  visibility: "public", 
  exposeTo: ["orders"] 
})

// Pick one:
@Service({ visibility: "public" })
@Service({ exposeTo: ["orders"] })
```

### Circular Dependencies
```typescript
// users.service.ts depends on orders.service.ts
// orders.service.ts depends on users.service.ts
// ❌ Circular dependency!
```

**Fix:** Refactor or use facades to break the cycle.

## Best Practices

1. **Default to private** - Only expose when needed
2. **Use `exposeTo` over `public`** - Better control
3. **Document exposure reasons** - Comments explain why
4. **Avoid circular deps** - Refactor instead
5. **Regenerate module list** - After adding modules

## Troubleshooting

**No autocomplete?**
```bash
bun run generate:modules
# Restart TypeScript server in IDE
```

**Access denied?**
- Check spelling of module names
- Verify `provider:` prefix for providers
- Ensure module list is up to date
- Check service is in `exposeTo` array

## How It Works

1. Decorator extracts module from file path
2. Validates `exposeTo` against generated module list
3. Registers with tsyringe as singleton
4. Validates constructor dependencies
5. Resolves instance
6. Stores metadata in ServiceRegistry

## Summary

- **Private** = Default, module-scoped
- **Public** = Accessible everywhere
- **Granular** = Specific modules only
- **Type-safe** = Full autocomplete
- **Validated** = Compile + runtime checks
