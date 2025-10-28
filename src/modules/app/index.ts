import { formatValidationError } from "@/lib/_internal/format-validation-error";
import { getService } from "@/lib/_internal/get-service";
import { getRegisteredRoutes } from "@/lib/_internal/route-registry";
import { autoRegisterSchemas } from "@/lib/_internal/schema-auto-discovery";
import { auth } from "@/lib/auth";
import { AppLogger } from "@/lib/logger";
import type { AppEnv } from "@/lib/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";

const logger = getService(AppLogger);

// ~ ======= Create main app router with OpenAPI ======= ~
const app = new OpenAPIHono<AppEnv>({
	defaultHook: (result, c) => {
		if (!result.success) {
			const response = formatValidationError(result.error);
			return c.json(response, 422);
		}
	},
});

// ~ ======= Register all schemas with THIS app instance ======= ~
await autoRegisterSchemas(app);

// ~ ======= Mount Better Auth Handler ======= ~
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ~ ======= Register all module routes ======= ~
import { apiConfig } from "@/config/api.config";
import { logRegisteredSchemas } from "@/lib/_internal/log-schemas";

const routes = getRegisteredRoutes();
const { prefix: apiPrefix, defaultVersion } = apiConfig;

logger.info("\n\n[ Routes ]");

for (const route of routes) {
	const version = route.version || defaultVersion;
	const fullPath = `${apiPrefix}/${version}${route.prefix}`;

	// Apply module-specific middleware if any
	if (route.middleware && route.middleware.length > 0) {
		app.use(fullPath, ...route.middleware);
	}

	// Register the router
	app.route(fullPath, route.router);

	logger.info(`[ Route ] ${route.moduleName} -> ${fullPath}`);
}

logger.info(`[ Routes ] Total: ${routes.length} modules registered\n`);

// ~ ======= Log registered schemas ======= ~
// Note: Schemas are already registered in _init.ts before routes are imported
logRegisteredSchemas(logger);

// ~ ======= OpenAPI Documentation ======= ~
app.doc("/doc/raw", {
	openapi: "3.0.0",
	info: {
		version: "0.0.1",
		title: "My API Template",
		description: "My API Template server documentation",
		contact: {
			name: "Emmanuel Alawode",
			url: "https://github.com/_oddfeeling",
			email: "platforms@chowbea.com",
		},
	},
});

// ~ ======= OpenAPI download route ======= ~
app.get("/doc/download", (c) => {
	// Get the OpenAPI spec from the app
	const openApiSpec = app.getOpenAPIDocument({
		openapi: "3.0.0",
		info: {
			version: "0.0.1",
			title: "My API Template",
			description: "My API Template server documentation",
			contact: {
				name: "Emmanuel Alawode",
				url: "https://github.com/_oddfeeling",
				email: "platforms@chowbea.com",
			},
		},
	});

	// Set headers to force a file download in the browser
	c.header("Content-Type", "application/json; charset=utf-8");
	c.header("Content-Disposition", 'attachment; filename="openapi.json"');
	c.header("Access-Control-Allow-Methods", "GET");

	// Send the generated OpenAPI document with pretty formatting
	return c.text(JSON.stringify(openApiSpec, null, 2));
});

app.get("/doc", Scalar({ url: "/doc/raw" }));

export default app;
