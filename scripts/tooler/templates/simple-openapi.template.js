import { toCamelCase, toPascalCase } from "../utils/string.js";

/**
 * Generates the OpenAPI routes template for simple routes
 * @param {string} routeName - The name of the route
 * @returns {string} The OpenAPI template content
 */
export function generateSimpleOpenApiTemplate(routeName) {
	const className = toPascalCase(routeName);
	const varName = toCamelCase(routeName);

	return `import { createRoute } from "@hono/zod-openapi";
import {
  messageRequestSchema,
  queryParamSchema,
  helloResponseSchema,
  echoResponseSchema,
  queryResponseSchema,
} from "../interfaces/${routeName}.dto";
import { createSingleSchema } from "@/lib/response-schemas";

/**
 * OpenAPI route definitions for ${routeName}
 */

// ~ ======= Response Schemas ======= ~
const helloSuccessResponse = createSingleSchema(helloResponseSchema);
const echoSuccessResponse = createSingleSchema(echoResponseSchema);
const querySuccessResponse = createSingleSchema(queryResponseSchema);

// ~ ======= GET / - Hello World Route ======= ~
const hello = createRoute({
  method: "get",
  path: "/",
  operationId: "get${className}Hello",
  tags: ["${className}"],
  summary: "Get hello world message",
  description: "Returns a simple hello world message from ${className}",
  responses: {
    200: {
      description: "Successfully retrieved hello message",
      content: {
        "application/json": {
          schema: helloSuccessResponse,
        },
      },
    },
  },
});

// ~ ======= POST / - Echo Message Route ======= ~
const echo = createRoute({
  method: "post",
  path: "/",
  operationId: "post${className}Echo",
  tags: ["${className}"],
  summary: "Echo message",
  description: "Accepts a message and returns it back",
  request: {
    body: {
      content: {
        "application/json": {
          schema: messageRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully echoed message",
      content: {
        "application/json": {
          schema: echoSuccessResponse,
        },
      },
    },
  },
});

// ~ ======= GET /query - Query Parameter Route ======= ~
const query = createRoute({
  method: "get",
  path: "/query",
  operationId: "get${className}Query",
  tags: ["${className}"],
  summary: "Get personalized greeting",
  description: "Returns a greeting with the provided name from query parameter",
  request: {
    query: queryParamSchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved personalized greeting",
      content: {
        "application/json": {
          schema: querySuccessResponse,
        },
      },
    },
  },
});

// ~ ======= Export all routes ======= ~
export const ${varName}Routes = {
  hello,
  echo,
  query,
};
`;
}
