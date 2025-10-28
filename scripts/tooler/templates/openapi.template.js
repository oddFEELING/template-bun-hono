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
import { idParamDto } from "@/modules/app/interfaces/app.dto";
import {
  create${className}RequestDto,
  create${className}ResponseDto,
} from "../interfaces/create${className}.dto";
import {
  update${className}RequestDto,
  update${className}ResponseDto,
} from "../interfaces/update${className}.dto";
import { get${className}ResponseDto } from "../interfaces/get${className}.dto";
import {
  list${className}sQueryDto,
  list${className}sResponseDto,
} from "../interfaces/list${className}s.dto";
import { delete${className}ResponseDto } from "../interfaces/delete${className}.dto";
import {
  validationErrorDto,
  notFoundErrorDto,
} from "@/lib/error-schemas";

/**
 * OpenAPI route definitions for ${moduleName}
 */

// ~ ======= List All ${className}s Route (with pagination) ======= ~
const getAll = createRoute({
  method: "get",
  path: "/",
  operationId: "list${className}s",
  tags: ["${className}"],
  summary: "List all ${moduleName}s",
  description: "Retrieves paginated ${moduleName} records from the database",
  request: {
    query: list${className}sQueryDto,
  },
  responses: {
    200: {
      description: "Successfully retrieved paginated ${moduleName}s",
      content: {
        "application/json": {
          schema: list${className}sResponseDto,
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
    params: idParamDto,
  },
  responses: {
    200: {
      description: "Successfully retrieved ${moduleName}",
      content: {
        "application/json": {
          schema: get${className}ResponseDto,
        },
      },
    },
    404: {
      description: "${className} not found",
      content: {
        "application/json": {
          schema: notFoundErrorDto,
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
          schema: create${className}RequestDto,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Successfully created ${moduleName}",
      content: {
        "application/json": {
          schema: create${className}ResponseDto,
        },
      },
    },
    422: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: validationErrorDto,
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
    params: idParamDto,
    body: {
      content: {
        "application/json": {
          schema: update${className}RequestDto,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully updated ${moduleName}",
      content: {
        "application/json": {
          schema: update${className}ResponseDto,
        },
      },
    },
    404: {
      description: "${className} not found",
      content: {
        "application/json": {
          schema: notFoundErrorDto,
        },
      },
    },
    422: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: validationErrorDto,
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
    params: idParamDto,
  },
  responses: {
    200: {
      description: "Successfully deleted ${moduleName}",
      content: {
        "application/json": {
          schema: delete${className}ResponseDto,
        },
      },
    },
    404: {
      description: "${className} not found",
      content: {
        "application/json": {
          schema: notFoundErrorDto,
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
