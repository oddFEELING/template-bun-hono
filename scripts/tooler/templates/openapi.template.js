import { toCamelCase, toPascalCase } from "../utils/string.js";

/**
 * Generates the OpenAPI routes template file content
 * @param {string} moduleName - The name of the module
 * @returns {string} The OpenAPI template content
 */
export function generateOpenApiTemplate(moduleName) {
  const className = toPascalCase(moduleName);
  const varName = toCamelCase(moduleName);
  return `import { createRoute } from "@hono/zod-openapi";
import { idParamSchema } from "../interfaces/${moduleName}.dto";
import {
  create${className}RequestSchema,
  create${className}ResponseSchema,
} from "../interfaces/create${className}.dto";
import {
  update${className}RequestSchema,
  update${className}ResponseSchema,
} from "../interfaces/update${className}.dto";
import { get${className}ResponseSchema } from "../interfaces/get${className}.dto";
import {
  list${className}sQuerySchema,
  list${className}sResponseSchema,
} from "../interfaces/list${className}s.dto";
import { delete${className}ResponseSchema } from "../interfaces/delete${className}.dto";
import {
  validationErrorSchema,
  notFoundErrorSchema,
} from "@/lib/error-schemas";
import { createSingleSchema } from "@/lib/response-schemas";

/**
 * OpenAPI route definitions for ${moduleName}
 */

// ~ ======= Response Wrappers ======= ~
const get${className}SuccessResponse = createSingleSchema(get${className}ResponseSchema);
const create${className}SuccessResponse = createSingleSchema(create${className}ResponseSchema);
const update${className}SuccessResponse = createSingleSchema(update${className}ResponseSchema);
const list${className}sSuccessResponse = createSingleSchema(list${className}sResponseSchema);
const delete${className}SuccessResponse = createSingleSchema(delete${className}ResponseSchema);

// ~ ======= List All ${className}s Route (with pagination) ======= ~
const getAll = createRoute({
  method: "get",
  path: "/",
  operationId: "list${className}s",
  tags: ["${className}"],
  summary: "List all ${moduleName}s with pagination",
  description: "Retrieves paginated ${moduleName} records from the database",
  request: {
    query: list${className}sQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved paginated ${moduleName}s",
      content: {
        "application/json": {
          schema: list${className}sSuccessResponse,
        },
      },
    },
  },
});

// ~ ======= Get ${className} By ID Route ======= ~
const getById = createRoute({
  method: "get",
  path: "/{id}",
  operationId: "get${className}ById",
  tags: ["${className}"],
  summary: "Get ${moduleName} by ID",
  description: "Retrieves a single ${moduleName} record by its UUID",
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved ${moduleName}",
      content: {
        "application/json": {
          schema: get${className}SuccessResponse,
        },
      },
    },
    404: {
      description: "${className} not found",
      content: {
        "application/json": {
          schema: notFoundErrorSchema,
        },
      },
    },
  },
});

// ~ ======= Create ${className} Route ======= ~
const create = createRoute({
  method: "post",
  path: "/",
  operationId: "create${className}",
  tags: ["${className}"],
  summary: "Create ${moduleName}",
  description: "Creates a new ${moduleName} record in the database",
  request: {
    body: {
      content: {
        "application/json": {
          schema: create${className}RequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Successfully created ${moduleName}",
      content: {
        "application/json": {
          schema: create${className}SuccessResponse,
        },
      },
    },
    422: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: validationErrorSchema,
        },
      },
    },
  },
});

// ~ ======= Update ${className} Route ======= ~
const update = createRoute({
  method: "patch",
  path: "/{id}",
  operationId: "update${className}",
  tags: ["${className}"],
  summary: "Update ${moduleName}",
  description: "Updates an existing ${moduleName} record in the database",
  request: {
    params: idParamSchema,
    body: {
      content: {
        "application/json": {
          schema: update${className}RequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully updated ${moduleName}",
      content: {
        "application/json": {
          schema: update${className}SuccessResponse,
        },
      },
    },
    404: {
      description: "${className} not found",
      content: {
        "application/json": {
          schema: notFoundErrorSchema,
        },
      },
    },
    422: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: validationErrorSchema,
        },
      },
    },
  },
});

// ~ ======= Delete ${className} Route ======= ~
const deleteRoute = createRoute({
  method: "delete",
  path: "/{id}",
  operationId: "delete${className}",
  tags: ["${className}"],
  summary: "Delete ${moduleName}",
  description: "Deletes a ${moduleName} record from the database",
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: "Successfully deleted ${moduleName}",
      content: {
        "application/json": {
          schema: delete${className}SuccessResponse,
        },
      },
    },
    404: {
      description: "${className} not found",
      content: {
        "application/json": {
          schema: notFoundErrorSchema,
        },
      },
    },
  },
});

// ~ ======= Export all routes ======= ~
export const ${varName}Routes = {
  getAll,
  getById,
  create,
  update,
  delete: deleteRoute,
};
`;
}
