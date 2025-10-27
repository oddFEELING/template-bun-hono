import { toCamelCase, toPascalCase } from "../utils/string.js";

/**
 * Generates a simple route index template file content with basic GET, POST, and query endpoints
 * @param {string} routeName - The name of the route
 * @param {string} version - API version (default: "v1")
 * @returns {string} The simple route index template content
 */
export function generateSimpleRouteTemplate(routeName, version = "v1") {
	const className = toPascalCase(routeName);
	const varName = toCamelCase(routeName);

	return `import { OpenAPIHono } from "@hono/zod-openapi";
import { getServices } from "@/lib/get-service";
import { registerRoute } from "@/lib/route-registry";
import type { RouteConfig } from "@/lib/route-registry";
import type { AppEnv } from "@/lib/types";
import { successResponse } from "@/lib/response-helpers";
import { ${className}Service } from "../${routeName}.service";
import { ${varName}Routes } from "./${routeName}.openapi";

// ~ ======= Get service instances ======= ~
const services = getServices({
  ${varName}Service: ${className}Service,
});

// ~ ======= Initialize Router ======= ~
const ${varName}Router = new OpenAPIHono<AppEnv>();

// ~ ======= Route Handlers ======= ~

// GET / - Hello World
${varName}Router.openapi(${varName}Routes.hello, async (c) => {
  const data = await services.${varName}Service.getHelloMessage();
  return successResponse(c, data);
});

// POST / - Echo Message
${varName}Router.openapi(${varName}Routes.echo, async (c) => {
  const body = c.req.valid("json");
  const data = await services.${varName}Service.echoMessage(body.message);
  return successResponse(c, data);
});

// GET /query - Query Parameter Greeting
${varName}Router.openapi(${varName}Routes.query, async (c) => {
  const query = c.req.valid("query");
  const data = await services.${varName}Service.getPersonalizedGreeting(query.name);
  return successResponse(c, data);
});

// ~ ======= Route Configuration ======= ~
const ${varName}RouteConfig: RouteConfig = {
  router: ${varName}Router,
  prefix: "/${routeName}",
  version: "${version}",
  moduleName: "${className}",
};

// ~ ======= Register Route ======= ~
registerRoute(${varName}RouteConfig);

// ~ ======= Exports ======= ~
export { ${varName}RouteConfig };
export default ${varName}Router;
`;
}
