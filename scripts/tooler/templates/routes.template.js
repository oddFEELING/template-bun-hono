import { toCamelCase, toPascalCase } from "../utils/string.js";

/**
 * Generates the routes index template file content
 * @param {string} moduleName - The name of the module
 * @param {string} version - API version (default: "v1")
 * @returns {string} The routes index template content
 */
export function generateRoutesIndexTemplate(moduleName, version = "v1") {
  const className = toPascalCase(moduleName);
  const varName = toCamelCase(moduleName);
  return `import { OpenAPIHono } from "@hono/zod-openapi";
import { getServices } from "@/lib/get-service";
import { registerRoute } from "@/lib/route-registry";
import type { RouteConfig } from "@/lib/route-registry";
import type { AppEnv } from "@/lib/types";
import {
  successResponse,
  createdResponse,
  notFoundResponse,
} from "@/lib/response-helpers";
import { ${className}Service } from "../${moduleName}.service";
import { ${varName}Routes } from "./${moduleName}.openapi";

// ~ ======= Get service instances ======= ~
const services = getServices({
  ${varName}Service: ${className}Service,
});

// ~ ======= Initialize router ======= ~
const ${varName}Router = new OpenAPIHono<AppEnv>();

// ~ ======= List All ${className}s (with pagination) ======= ~
${varName}Router.openapi(${varName}Routes.getAll, async (c) => {
  const query = c.req.valid("query");
  const data = await services.${varName}Service.getAllPaginated(query);
  return successResponse(c, data);
});

// ~ ======= Get ${className} By ID ======= ~
${varName}Router.openapi(${varName}Routes.getById, async (c) => {
  const { id } = c.req.valid("param");
  const data = await services.${varName}Service.getById(id);
  
  if (!data) {
    return notFoundResponse(c, "${className} not found");
  }
  
  return successResponse(c, data);
});

// ~ ======= Create ${className} ======= ~
${varName}Router.openapi(${varName}Routes.create, async (c) => {
  const body = c.req.valid("json");
  const data = await services.${varName}Service.create(body);
  return createdResponse(c, data);
});

// ~ ======= Update ${className} ======= ~
${varName}Router.openapi(${varName}Routes.update, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const data = await services.${varName}Service.update(id, body);
  
  if (!data) {
    return notFoundResponse(c, "${className} not found");
  }
  
  return successResponse(c, data);
});

// ~ ======= Delete ${className} ======= ~
${varName}Router.openapi(${varName}Routes.delete, async (c) => {
  const { id } = c.req.valid("param");
  const deleted = await services.${varName}Service.delete(id);
  
  if (!deleted) {
    return notFoundResponse(c, "${className} not found");
  }
  
  return successResponse(c, {
    success: true,
    message: "${className} deleted successfully",
  });
});

// ~ ======= Route Configuration ======= ~
const ${varName}RouteConfig: RouteConfig = {
  router: ${varName}Router,
  prefix: "/${moduleName}",
  version: "${version}",
  moduleName: "${className}",
};

// ~ ======= Register route ======= ~
registerRoute(${varName}RouteConfig);

// ~ ======= Exports ======= ~
export { ${varName}RouteConfig };
export default ${varName}Router;
`;
}
