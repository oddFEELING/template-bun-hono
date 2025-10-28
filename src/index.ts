// Import service auto-discovery to register all services (includes Sentry init)
import "./_init";
// Import route auto-discovery to register all routes
import "./_init-routes";

import { env } from "@/config";
import { OpenAPIHono } from "@hono/zod-openapi";
import {
	type AppEnv,
	AppLogger,
	getServices,
	logRegisteredServices,
} from "./lib";
import { addAppMiddleware } from "./middlewares";
import { BullMqProvider } from "./providers/bull-mq/bull-mq.service";
import { RedisProvider } from "./providers/redis/redis.service";

const { appLogger } = getServices({ appLogger: AppLogger });

const app = new OpenAPIHono<AppEnv>();
addAppMiddleware(app);

// ~ ======= Log registered services ======= ~
logRegisteredServices(appLogger);

app.get("/", (c) =>
	c.json({
		status: "ok",
		message: "Naalya API is running",
		version: "1.0.0",
	})
);

// ~ ======= Graceful Shutdown Handler ======= ~
// Simple signal handlers for graceful shutdown (Hono-compatible)
// Use global flag to prevent duplicate handler registration during hot reload
const SHUTDOWN_HANDLERS_KEY = Symbol.for("app.shutdown.handlers.registered");

// Check if handlers are already registered (prevents duplicates during hot reload)
type GlobalWithShutdown = typeof globalThis & Record<symbol, boolean>;
if (!(globalThis as GlobalWithShutdown)[SHUTDOWN_HANDLERS_KEY]) {
	const gracefulShutdown = async (signal: string) => {
		appLogger.info(
			`[Shutdown] ${signal} received, starting graceful shutdown...`
		);

		const shutdownTimeout = setTimeout(() => {
			appLogger.error(
				`[Shutdown] Timeout (${env.SHUTDOWN_TIMEOUT}ms) exceeded, forcing exit`
			);
			process.exit(1);
		}, env.SHUTDOWN_TIMEOUT);

		try {
			// Close BullMQ connections
			try {
				const { bullMqProvider } = getServices({
					bullMqProvider: BullMqProvider,
				});
				appLogger.info("[Shutdown] Closing BullMQ connections...");
				await bullMqProvider.close();
				appLogger.info("[Shutdown] BullMQ connections closed");
			} catch {
				appLogger.debug("[Shutdown] BullMQ provider not initialized, skipping");
			}

			// Close Redis connections
			try {
				const { redisProvider } = getServices({ redisProvider: RedisProvider });
				appLogger.info("[Shutdown] Closing Redis connections...");
				await redisProvider.disconnect();
				appLogger.info("[Shutdown] Redis connections closed");
			} catch {
				appLogger.debug("[Shutdown] Redis provider not initialized, skipping");
			}

			clearTimeout(shutdownTimeout);
			appLogger.info("[Shutdown] Graceful shutdown completed successfully");
			process.exit(0);
		} catch (error) {
			clearTimeout(shutdownTimeout);
			appLogger.error(
				`[Shutdown] Error during shutdown: ${error instanceof Error ? error.message : String(error)}`
			);
			process.exit(1);
		}
	};

	// Register signal handlers only once
	process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
	process.on("SIGINT", () => gracefulShutdown("SIGINT"));

	// Mark handlers as registered
	(globalThis as GlobalWithShutdown)[SHUTDOWN_HANDLERS_KEY] = true;

	appLogger.info("[Shutdown] Graceful shutdown handlers registered");
}

// ~ ======= Export Hono app configuration for Bun ======= ~
export default {
	fetch: app.fetch,
	port: 8001,
	idleTimeout: 0,
};
