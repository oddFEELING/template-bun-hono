import type { OpenAPIHono } from "@hono/zod-openapi";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "./types";

/**
 * Route configuration metadata
 * Defines the structure for registering module routes
 */
export interface RouteConfig {
  /** The router instance containing all route handlers */
  router: OpenAPIHono<AppEnv>;

  /** Route prefix (e.g., "/users", "/products") */
  prefix: string;

  /** API version (defaults to "v1") */
  version?: string;

  /** Module-specific middleware to apply to all routes */
  middleware?: MiddlewareHandler[];

  /** Module name for logging purposes */
  moduleName: string;
}

/**
 * Registry to store all route configurations
 * Maps route keys to their configurations
 */
export const RouteRegistry = new Map<string, RouteConfig>();

/**
 * Registers a route configuration in the registry
 * @param config - The route configuration to register
 */
export function registerRoute(config: RouteConfig) {
  const key = `${config.version || "v1"}:${config.prefix}`;

  if (RouteRegistry.has(key)) {
    console.warn(`Route ${key} already registered. Skipping duplicate.`);
    return;
  }

  RouteRegistry.set(key, config);
}

/**
 * Gets all registered route configurations
 * @returns Array of all registered route configs
 */
export function getRegisteredRoutes(): RouteConfig[] {
  console.log("getRegisteredRoutes", RouteRegistry.keys());
  return Array.from(RouteRegistry.values());
}

/**
 * Clears the route registry
 * Useful for testing purposes
 */
export function clearRouteRegistry() {
  RouteRegistry.clear();
}
