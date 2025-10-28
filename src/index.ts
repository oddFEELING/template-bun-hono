// Import service auto-discovery to register all services (includes Sentry init)
import "./_init";
// Import route auto-discovery to register all routes
import "./_init-routes";

import { OpenAPIHono } from "@hono/zod-openapi";
import {
	type AppEnv,
	AppLogger,
	getServices,
	logRegisteredServices,
	ShutdownManager,
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

// ~ ======= Start server with graceful shutdown ======= ~
const server = Bun.serve({
	fetch: app.fetch,
	port: 8001,
	idleTimeout: 0,
});

appLogger.info(`Server is running on http://localhost:${server.port}`);

// Initialize shutdown manager
const shutdownManager = new ShutdownManager(server, appLogger);

// Register cleanup handlers for all resources that need graceful shutdown
// These handlers will be called in order during shutdown

// 1. Close BullMQ workers and queue connections
try {
	const { bullMqProvider } = getServices({ bullMqProvider: BullMqProvider });
	shutdownManager.registerCleanupHandler(async () => {
		appLogger.info("[Shutdown] Closing BullMQ connections...");
		await bullMqProvider.close();
		appLogger.info("[Shutdown] BullMQ connections closed");
	});
} catch {
	// BullMQ provider might not be initialized if queues haven't been used yet
	appLogger.debug(
		"[Shutdown] BullMQ provider not initialized, skipping cleanup"
	);
}

// 2. Close Redis connections
try {
	const { redisProvider } = getServices({ redisProvider: RedisProvider });
	shutdownManager.registerCleanupHandler(async () => {
		appLogger.info("[Shutdown] Closing Redis connections...");
		await redisProvider.disconnect();
		appLogger.info("[Shutdown] Redis connections closed");
	});
} catch {
	// Redis provider might not be initialized
	appLogger.debug(
		"[Shutdown] Redis provider not initialized, skipping cleanup"
	);
}

// Note: Neon database connections are serverless and don't require explicit cleanup
// The HTTP-based client automatically handles connection lifecycle

appLogger.info("[Shutdown] Graceful shutdown configured and ready");

// ~ ======= Export server for testing ======= ~
export default server;
