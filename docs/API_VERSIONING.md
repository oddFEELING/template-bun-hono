# API Versioning

Run multiple API versions side-by-side.

## How It Works

Routes include version in the path:

```typescript
export const usersRouteConfig: RouteConfig = {
  router: usersRouter,
  prefix: "/users",
  version: "v1",  // ← Version
  moduleName: "Users",
};
```

**Result:** `/api/v1/users`

## Creating Versions

### Option 1: Separate Modules (Recommended)

```bash
# Create v1
bun tooler create module users

# Create v2
bun tooler create module users-v2 --version v2
```

**Structure:**
```
src/modules/
├── users/       # /api/v1/users
└── users-v2/    # /api/v2/users
```

**Update v2 route config:**
```typescript
// users-v2/routes/index.ts
export const usersV2RouteConfig: RouteConfig = {
  prefix: "/users",
  version: "v2",  // ← Change this
  ...
};
```

### Option 2: Shared Service, Different Routes

Keep one service, create versioned routes:

```
src/modules/users/
├── users.service.ts  # Shared logic
└── routes/
    ├── v1/index.ts
    └── v2/index.ts
```

## Migration Patterns

### Different DTOs
```typescript
// v1.dto.ts
const userV1Schema = z.object({
  id: z.uuid(),
  name: z.string(),
});

// v2.dto.ts
const userV2Schema = z.object({
  id: z.uuid(),
  firstName: z.string(),  // Split name
  lastName: z.string(),
});
```

### Deprecation Headers
```typescript
// v1 routes
c.header("X-API-Version", "1.0");
c.header("X-API-Deprecated", "true");
c.header("X-API-Sunset", "2025-12-31");
c.header("X-API-Upgrade", "/api/v2/users");
```

### Feature Flags
```typescript
async getAll(version: string) {
  let query = db.select().from(users);
  
  // v2 includes deleted users
  if (version === "v1") {
    query = query.where(eq(users.deletedAt, null));
  }
  
  return query;
}
```

## Version Rules

**Breaking changes** → New major version
- Changed response structure
- Renamed/removed fields
- Different validation rules

**Additive changes** → Same version
- New optional fields
- New endpoints
- Additional filters

## Configuration

Set available versions in `api.config.yml`:

```yaml
prefix: "/api"
defaultVersion: "v1"
availableVersions:
  - v1
  - v2
```

## Default Version Redirect

```typescript
// Redirect /api/users → /api/v2/users
app.get("/api/users", (c) => {
  return c.redirect("/api/v2/users", 301);
});
```

## Best Practices

1. **Semantic versioning** - v1, v2, v3 (major versions only)
2. **Breaking changes only** - Don't version for new features
3. **Sunset policy** - Define deprecation timelines
4. **Both versions live** - Allow gradual migration
5. **Document changes** - Clear migration guides

## Example Timeline

```
Month 1: Launch v1
Month 6: Launch v2, deprecate v1
Month 9: Announce v1 sunset (Dec 31)
Month 12: Remove v1 code
```

## Summary

- Version in route config: `version: "v2"`
- Multiple versions coexist: `/api/v1/users`, `/api/v2/users`
- Separate modules recommended
- Gradual client migration
- Clear deprecation policy
