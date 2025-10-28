import type { OpenAPIHono } from "@hono/zod-openapi";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";

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
 * Internal registry to store all route configurations
 * Maps route keys to their configurations
 * Not exported to prevent external mutation
 */
const RouteRegistry = new Map<string, RouteConfig>();

/**
 * Registers a route configuration in the registry
 * @param config - The route configuration to register
 */
export function registerRoute(config: RouteConfig) {
	const key = `${config.version || "v1"}:${config.prefix}`;

	if (RouteRegistry.has(key)) {
		const existing = RouteRegistry.get(key);
		// biome-ignore lint/suspicious/noConsole: Warning about duplicate route registration for debugging
		console.warn(
			`[Route Registry] Duplicate route detected: "${key}"\n` +
				`  First registered: module="${existing?.moduleName}", prefix="${existing?.prefix}", version="${existing?.version || "v1"}"\n` +
				`  Duplicate attempt: module="${config.moduleName}", prefix="${config.prefix}", version="${config.version || "v1"}"\n` +
				"  The duplicate registration will be ignored."
		);
		return;
	}

	RouteRegistry.set(key, config);
}

/**
 * Gets all registered route configurations
 * Returns a defensive copy to prevent external mutation
 * @returns Array of all registered route configs
 */
export function getRegisteredRoutes(): RouteConfig[] {
	return Array.from(RouteRegistry.values());
}

/**
 * Clears the route registry
 * Useful for testing purposes
 */
export function clearRouteRegistry() {
	RouteRegistry.clear();
}
