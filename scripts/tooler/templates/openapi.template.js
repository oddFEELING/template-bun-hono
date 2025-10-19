import { toCamelCase, toPascalCase } from "../utils/string.js";

/**
 * Generates the OpenAPI routes template file content
 * @param {string} moduleName - The name of the module
 * @returns {string} The OpenAPI template content
 */
export function generateOpenApiTemplate(moduleName) {
  const className = toPascalCase(moduleName);
  const varName = toCamelCase(moduleName);
  return `import { createRoute, z } from "@hono/zod-openapi";
import {
  idParamSchema,
  create${className}Schema,
  update${className}Schema,
  query${className}Schema,
  ${varName}EntitySchema,
  ${varName}ResponseSchema,
} from "../interfaces/${moduleName}.dto";
import {
  validationErrorSchema,
  notFoundErrorSchema,
} from "@/lib/error-schemas";
import {
  createListSchema,
  createSingleSchema,
} from "@/lib/response-schemas";

/**
 * OpenAPI route definitions for ${moduleName}
 */

// ~ ======= Response Schemas ======= ~
const successListResponse = createListSchema(${varName}ResponseSchema);
const successSingleResponse = createSingleSchema(${varName}ResponseSchema);

// ~ ======= Get All ${className}s Route ======= ~
const getAll = createRoute({
  method: "get",
  path: "/",
  operationId: "getAll${className}",
  tags: ["${className}"],
  summary: "Get all ${moduleName}",
  description: "Retrieves all ${moduleName} records from the database",
  responses: {
    200: {
      description: "Successfully retrieved all ${moduleName}",
      content: {
        "application/json": {
          schema: successListResponse,
        },
      },
    },
  },
});

// ~ ======= Get All ${className}s Paginated Route ======= ~
const getAllPaginated = createRoute({
  method: "get",
  path: "/paginated",
  operationId: "getAll${className}Paginated",
  tags: ["${className}"],
  summary: "Get paginated ${moduleName}",
  description: "Retrieves paginated ${moduleName} records from the database",
  request: {
    query: query${className}Schema,
  },
  responses: {
    200: {
      description: "Successfully retrieved paginated ${moduleName}",
      content: {
        "application/json": {
          schema: successListResponse,
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
          schema: successSingleResponse,
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
          schema: create${className}Schema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Successfully created ${moduleName}",
      content: {
        "application/json": {
          schema: successSingleResponse,
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
          schema: update${className}Schema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully updated ${moduleName}",
      content: {
        "application/json": {
          schema: successSingleResponse,
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
          schema: successSingleResponse,
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
  getAllPaginated,
  getById,
  create,
  update,
  delete: deleteRoute,
};
`;
}
