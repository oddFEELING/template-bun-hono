# Service Visibility

## Overview

Services in Naalya API use a NestJS-inspired visibility system to enforce module boundaries and prevent unwanted cross-module dependencies.

## Rules

### **Private Services (Default)**
Services are **private by default** and can only be used within their own module.

```typescript
@Service()
export class UsersService {
  // Only accessible within the users module
}
```

### **Public Services**
Services marked as public can be used by any module.

```typescript
@Service({ visibility: "public" })
export class EmailProvider {
  // Accessible from any module
}
```

## Usage Examples

### ✅ **Correct Usage**

**Within the same module:**
```typescript
// src/modules/users/routes/index.ts
import { UsersService } from "../users.service";

const services = getServices({
  usersService: UsersService, // ✅ Works - same module
});
```

**Using public services:**
```typescript
// src/modules/orders/orders.service.ts
import { EmailProvider } from "@/providers/email";

@Service()
export class OrdersService {
  constructor(
    private readonly emailProvider: EmailProvider // ✅ Works - public provider
  ) {}
}
```

### ❌ **Incorrect Usage**

**Accessing private service from another module:**
```typescript
// src/modules/orders/orders.service.ts
import { UsersService } from "@/modules/users/users.service";

@Service()
export class OrdersService {
  constructor(
    private readonly usersService: UsersService // ❌ Error!
  ) {}
}

// Error: Access denied: UsersService is private to the "users" module 
// and cannot be used in "orders".
```

## When to Use Public

Mark a service as public when:

1. **Providers** - 3rd party integrations (Stripe, Email, Storage)
2. **Shared Utilities** - Core services like AppLogger
3. **Cross-Module APIs** - When a module needs to expose functionality to others

## When to Keep Private

Keep services private when:

1. **Business Logic** - Module-specific CRUD operations
2. **Internal Helpers** - Utilities used only within the module
3. **Database Operations** - Direct database access should stay in the module

## Architecture Benefits

1. ✅ **Enforced Boundaries** - Prevents tight coupling between modules
2. ✅ **Clear APIs** - Public services define the module's contract
3. ✅ **Easy Refactoring** - Private services can be changed without affecting others
4. ✅ **Better Testing** - Mock only public dependencies
5. ✅ **Similar to NestJS** - Familiar pattern for developers

## Best Practices

### **Module Structure**
```
src/modules/users/
  ├── users.service.ts          # @Service() - Private
  ├── users.facade.ts           # @Service({ visibility: 'public' }) - If needed
  └── routes/                   # Uses UsersService directly
```

### **Provider Structure**
```
src/providers/stripe/
  └── stripe.service.ts         # @Service({ visibility: 'public' }) - Always public
```

### **Tip: Use Facades for Complex Modules**

If a module needs to expose functionality to others, create a facade:

```typescript
// users/users.facade.ts
@Service({ visibility: "public" })
export class UsersFacade {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(id: string) {
    const user = await this.usersService.getById(id);
    return user !== null;
  }
  
  // Don't expose CRUD operations - keep them internal
}
```

## Error Messages

When you try to access a private service from another module:

```
Access denied: UsersService is private to the "users" module 
and cannot be used in "orders". 

To use this service across modules, mark it as 
@Service({ visibility: 'public' }).
```

## Summary

- **Default** = Private (module-scoped)
- **Providers** = Public (cross-module)
- **Business Logic** = Keep private
- **Routes** = Always within their module, access everything

