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
} from "./lib";
import { addAppMiddleware } from "./middlewares";

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

// ~ ======= Export app ======= ~
export default {
	fetch: app.fetch,
	port: 8001,
	idleTimeout: 0,
};
