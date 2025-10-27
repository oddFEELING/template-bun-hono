import { createMiddleware } from "hono/factory";
import { getServices } from "@/lib/get-service";
import { AppLogger } from "@/lib/logger";
import type { AppEnv } from "@/lib/types";

/**
 * Context middleware
 * Adds commonly used utilities to the Hono context for easier access in route handlers
 */
export const addContextVariables = createMiddleware<AppEnv>(async (c, next) => {
	const { appLogger } = getServices({ appLogger: AppLogger });

	c.set("logger", appLogger);
	c.set("requestId", crypto.randomUUID());

	await next();
});
