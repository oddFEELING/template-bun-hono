# Service Visibility

Control which modules can access your services.

## Three Levels

### Private (Default)
```typescript
@Service()
export class UsersService {
  // Only accessible within users module
}
```

### Public
```typescript
@Service({ visibility: "public" })
export class StripeProvider {
  // Accessible everywhere
}
```

### Granular
```typescript
@Service({ exposeTo: ["orders", "payments"] })
export class UsersService {
  // Only accessible by orders and payments modules
}
```

## Rules

**Same Module** - Always allowed
```typescript
// users/routes/index.ts can use users/users.service.ts ✅
```

**Public Services** - Always allowed
```typescript
// Any module can use AppLogger ✅
```

**Private Services** - Blocked across modules
```typescript
// orders/orders.service.ts CANNOT use users/users.service.ts ❌
```

**Granular Access** - Only listed modules
```typescript
@Service({ exposeTo: ["orders"] })
// orders module can use ✅
// payments module cannot use ❌
```

## Provider Access

Providers use `provider:` prefix:

```typescript
@Service({ exposeTo: ["provider:stripe", "provider:email"] })
export class PaymentsService {
  // Accessible by stripe and email providers
}
```

## When to Use What

**Private** - Default for modules, keeps logic isolated  
**Public** - Providers, shared utilities, core services  
**Granular** - Specific cross-module needs, better than public  

## Tooler Defaults

```bash
bun tooler create module users        # Private
bun tooler create module users --public  # Public
bun tooler create provider stripe     # Public
bun tooler create provider cache --private  # Private
```

## Errors

```
Access denied: OrdersService cannot inject UsersService 
which is private to the "users" module.

Fix:
1. @Service({ visibility: 'public' })
2. @Service({ exposeTo: ['orders'] })
3. Remove the dependency
```

## Best Practices

- Start private, expose only when needed
- Use `exposeTo` over `public` for better control
- Document why services are exposed
- Keep business logic private
