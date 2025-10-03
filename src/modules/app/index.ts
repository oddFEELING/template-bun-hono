import { auth } from "@/lib/auth";
import { formatValidationError } from "@/lib/format-validation-error";
import { getService } from "@/lib/get-service";
import { AppLogger } from "@/lib/logger";
import { getRegisteredRoutes } from "@/lib/route-registry";
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

// ~ ======= Mount Better Auth Handler ======= ~
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// ~ ======= OpenAPI Documentation ======= ~
app.doc("/doc/raw", {
  openapi: "3.0.0",
  info: {
    version: "0.0.1",
    title: "Naalya API",
    description: "Naalya API server documentation",
    contact: {
      name: "Emmanuel Alawode",
      url: "https://github.com/_oddfeeling",
      email: "platforms@chowbea.com",
    },
  },
});

app.get("/doc", Scalar({ url: "/doc/raw" }));

// ~ ======= Register all module routes ======= ~
import { apiConfig } from "@/config/api.config";

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

export default app;
