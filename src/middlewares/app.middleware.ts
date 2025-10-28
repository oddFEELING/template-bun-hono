import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger as honoLogger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
// Temporarily disable Sentry to avoid OpenTelemetry recursion issues
import * as Sentry from "@sentry/bun";
import { env } from "@/config/env.config";
import { errorResponse } from "@/lib";
import { getService } from "@/lib/_internal/get-service";
import { AppLogger } from "@/lib/logger";
import type { AppEnv } from "@/lib/types";
import routes from "@/modules/app";
import { injectSession } from "./auth.middleware";
import { createBullBoardMiddleware } from "./bull-board.middleware";
import { addContextVariables } from "./context.middleware";

const logger = getService(AppLogger);

export const addAppMiddleware = (app: OpenAPIHono<AppEnv>) => {
	// Add context variables (logger, requestId)
	app.use(addContextVariables);

	// Inject session into all routes
	app.use(injectSession);

	app.use((c, next) => {
		Sentry.setTag("request_id", c.get("requestId"));
		if (c.get("user")) {
			Sentry.setUser({
				id: c.get("user")?.id,
				email: c.get("user")?.email,
			});
		}
		return next();
	});

	// Global middleware with configurable CORS origins from environment
	app.use(
		cors({
			origin: env.CORS_ALLOWED_ORIGINS,
		})
	);
	app.use(prettyJSON());
	app.use(secureHeaders());
	app.use(timeout(10_000));
	app.use(honoLogger(logger.info.bind(logger)));

	// Error handler - logs errors (Sentry capture disabled)
	app.onError((err, c) => {
		// Log the error instead of sending to Sentry
		logger.error(`Unhandled error: ${err.message}`);

		// Return appropriate response
		if (err instanceof HTTPException) {
			return err.getResponse();
		}
		return errorResponse(c, err.message);
	});

	// Mount the app router (which includes docs + all API routes)
	app.route("/", routes);

	// Test error endpoint (Sentry disabled)
	app.get("/error", (c) => {
		logger.info("User triggered test error");
		return c.json({ message: "Test error" });
	});

	createBullBoardMiddleware(app);
};
