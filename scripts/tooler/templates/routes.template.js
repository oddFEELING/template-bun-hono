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

// ~ ======= Get All ${className}s ======= ~
${varName}Router.openapi(${varName}Routes.getAll, async (c) => {
  const data = await services.${varName}Service.getAll();
  return successResponse(c, data);
});

// ~ ======= Get All ${className}s Paginated ======= ~
${varName}Router.openapi(${varName}Routes.getAllPaginated, async (c) => {
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
  const data = await services.${varName}Service.delete(id);
  
  if (!data) {
    return notFoundResponse(c, "${className} not found");
  }
  
  return successResponse(c, data);
});

// ~ ======= Route Configuration ======= ~
export const ${varName}RouteConfig: RouteConfig = {
  router: ${varName}Router,
  prefix: "/${moduleName}",
  version: "${version}",
  moduleName: "${className}",
  // middleware: [], // Add module-specific middleware here if needed
};

// ~ ======= Register route ======= ~
registerRoute(${varName}RouteConfig);

// ~ ======= Export router (for testing or manual use) ======= ~
export default ${varName}Router;
`;
}
