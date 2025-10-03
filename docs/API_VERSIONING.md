# API Versioning

Guide to implementing and managing multiple API versions in Naalya API.

---

## Overview

The Naalya API supports multiple API versions running side-by-side, allowing you to:
- Maintain backwards compatibility
- Gradually migrate clients to new versions
- Test new features without breaking existing clients
- Deprecate old endpoints gracefully

---

## How It Works

### Current Implementation

Routes are automatically versioned using the `RouteConfig`:

```typescript
export const usersRouteConfig: RouteConfig = {
  router: usersRouter,
  prefix: "/users",
  version: "v1",  // ← Version identifier
  moduleName: "Users",
};
```

This automatically creates: `/api/v1/users`

---

## Creating Versioned Modules

### Approach 1: Separate Modules (Recommended)

Create completely separate modules for each version:

```
src/modules/
├── users/              # v1 implementation
│   ├── users.service.ts
│   └── routes/
│       └── index.ts    # version: "v1"
└── users-v2/           # v2 implementation
    ├── users.service.ts
    └── routes/
        └── index.ts    # version: "v2"
```

**Using Tooler:**
```bash
# Create v1 module
bun tooler create module users

# Create v2 module
bun tooler create module users-v2
```

**Update v2 route config:**
```typescript
// users-v2/routes/index.ts
export const usersV2RouteConfig: RouteConfig = {
  router: usersRouter,
  prefix: "/users",
  version: "v2",  // ← v2!
  moduleName: "UsersV2",
};
```

**Result:**
- `/api/v1/users` → users module
- `/api/v2/users` → users-v2 module

---

### Approach 2: Versioned Routes (Same Module)

Keep one module but create versioned route files:

```
src/modules/users/
├── users.service.ts
└── routes/
    ├── v1/
    │   └── index.ts
    └── v2/
        └── index.ts
```

Manually create route versions and update `_init-routes.ts` to discover both.

---

## Version Migration Patterns

### Pattern 1: Shared Service, Different DTOs

Share business logic but change API contracts:

```typescript
// users/users.service.ts (shared)
@Service()
export class UsersService {
  async getAll() {
    return db.select().from(usersTable);
  }
}

// users/interfaces/v1.dto.ts
export const userV1ResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

// users/interfaces/v2.dto.ts  
export const userV2ResponseSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),  // ← Split name field
  lastName: z.string(),
});
```

---

### Pattern 2: Deprecation Warnings

Add headers to v1 responses:

```typescript
// v1/routes/index.ts
usersV1Router.openapi(usersRoutes.getAll, async (c) => {
  c.header("X-API-Version", "1.0");
  c.header("X-API-Deprecated", "true");
  c.header("X-API-Sunset", "2025-12-31");
  c.header("X-API-Upgrade", "/api/v2/users");
  
  const data = await services.usersService.getAll();
  return successResponse(c, data);
});
```

---

### Pattern 3: Feature Flags

Enable features per version:

```typescript
// users/users.service.ts
@Service()
export class UsersService {
  async getAll(version: string) {
    let query = db.select().from(usersTable);
    
    // v2 includes soft-deleted users
    if (version === "v1") {
      query = query.where(eq(usersTable.deletedAt, null));
    }
    
    return query;
  }
}
```

---

## Tooler Enhancement

### Add Version Flag

Let me add support for `--version` flag:

```bash
bun tooler create module users --version v2
```

This would:
1. Create module with version set to "v2"
2. Name it `users-v2` or ask for custom name
3. Set route version in config

---

## Best Practices

### 1. Semantic Versioning

Use semantic version numbers:
- `v1` - Major version 1
- `v2` - Major version 2
- `v2.1` - Minor version (backwards compatible)

### 2. Breaking Changes Only

Only create new major versions for breaking changes:
- ✅ Changing response structure → v2
- ✅ Renaming fields → v2
- ❌ Adding optional fields → v1.1
- ❌ New endpoints → v1.1

### 3. Sunset Policy

Define clear deprecation timelines:
```typescript
// In your API docs
{
  "v1": {
    "status": "deprecated",
    "sunset": "2025-12-31",
    "replacement": "v2"
  },
  "v2": {
    "status": "current"
  }
}
```

### 4. Default Version

Always have a default version redirect:

```typescript
// Redirect /api/users to /api/v2/users
app.get("/api/users", (c) => {
  return c.redirect("/api/v2/users", 301);
});
```

---

## Example: Full V1 → V2 Migration

### Step 1: Current V1 Module

```bash
bun tooler create module users
# Creates: /api/v1/users
```

### Step 2: Create V2 Module

```bash
bun tooler create module users-v2
```

Update route config:
```typescript
// users-v2/routes/index.ts
export const usersV2RouteConfig: RouteConfig = {
  router: usersRouter,
  prefix: "/users",
  version: "v2",
  moduleName: "UsersV2",
};
```

### Step 3: Update V2 DTOs

```typescript
// users-v2/interfaces/users-v2.dto.ts
export const createUserV2Schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  // New fields in v2
  phoneNumber: z.string().optional(),
  avatar: z.string().url().optional(),
});
```

### Step 4: Both Versions Live

- `/api/v1/users` → Original implementation
- `/api/v2/users` → New implementation

### Step 5: Client Migration

Clients update at their own pace:
```typescript
// Old clients
fetch('/api/v1/users')

// New clients
fetch('/api/v2/users')
```

---

## Monitoring & Analytics

Track version usage:

```typescript
// middleware/version-tracking.ts
export const trackVersion = createMiddleware<AppEnv>(async (c, next) => {
  const path = c.req.path;
  const version = path.match(/\/api\/(v\d+)\//)?[1];
  
  const logger = c.get("logger");
  logger.info(`API ${version} called: ${path}`);
  
  await next();
});
```

---

## Summary

Your API already supports versioning! To use it:

1. **Create versioned modules** with tooler
2. **Set version in RouteConfig** (`version: "v2"`)
3. **Both versions coexist** at `/api/v1/...` and `/api/v2/...`
4. **Migrate clients gradually**

**Would you like me to:**
1. Add `--version` flag to tooler?
2. Create a version tracking middleware?
3. Add default version redirects?

