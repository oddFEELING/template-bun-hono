import { auth } from "@/lib/auth";
import {
  forbiddenResponse,
  unauthorizedResponse,
} from "@/lib/response-helpers";
import type { AppEnv } from "@/lib/types";
import { createMiddleware } from "hono/factory";

/**
 * Injects session and user into context
 * Should be applied globally to make auth data available in all routes
 */
export const injectSession = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  c.set("user", session?.user || null);
  c.set("session", session?.session || null);

  await next();
});

/**
 * Requires authentication
 * Returns 401 if user is not authenticated
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get("user");

  if (!user) {
    return unauthorizedResponse(c, "Authentication required");
  }

  await next();
});

/**
 * Requires specific role
 * Returns 403 if user doesn't have the required role
 * @param role - The required role
 */
export function requireRole(role: string) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return unauthorizedResponse(c, "Authentication required");
    }

    // Check if user has the required role
    const userRole = (user as any).role;
    if (userRole !== role) {
      return forbiddenResponse(c, `${role} role required`);
    }

    await next();
  });
}

/**
 * Requires any of the specified roles
 * Returns 403 if user doesn't have at least one of the roles
 * @param roles - Array of acceptable roles
 */
export function requireAnyRole(roles: string[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return unauthorizedResponse(c, "Authentication required");
    }

    const userRole = (user as any).role;
    if (!roles.includes(userRole)) {
      return forbiddenResponse(
        c,
        `One of these roles required: ${roles.join(", ")}`
      );
    }

    await next();
  });
}
