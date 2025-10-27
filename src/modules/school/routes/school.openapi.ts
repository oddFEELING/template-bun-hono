import { createRoute } from "@hono/zod-openapi";
import { idParamSchema } from "../interfaces/school.dto";
import {
  createSchoolRequestSchema,
  createSchoolResponseSchema,
} from "../interfaces/createSchool.dto";
import {
  updateSchoolRequestSchema,
  updateSchoolResponseSchema,
} from "../interfaces/updateSchool.dto";
import { getSchoolResponseSchema } from "../interfaces/getSchool.dto";
import {
  listSchoolsQuerySchema,
  listSchoolsResponseSchema,
} from "../interfaces/listSchools.dto";
import { deleteSchoolResponseSchema } from "../interfaces/deleteSchool.dto";
import {
  validationErrorSchema,
  notFoundErrorSchema,
} from "@/lib/error-schemas";
import { createSingleSchema } from "@/lib/response-schemas";

/**
 * OpenAPI route definitions for school
 */

// ~ ======= Response Wrappers ======= ~
const getSchoolSuccessResponse = createSingleSchema(getSchoolResponseSchema);
const createSchoolSuccessResponse = createSingleSchema(createSchoolResponseSchema);
const updateSchoolSuccessResponse = createSingleSchema(updateSchoolResponseSchema);
const listSchoolsSuccessResponse = createSingleSchema(listSchoolsResponseSchema);
const deleteSchoolSuccessResponse = createSingleSchema(deleteSchoolResponseSchema);

// ~ ======= List All Schools Route (with pagination) ======= ~
const getAll = createRoute({
  method: "get",
  path: "/",
  operationId: "listSchools",
  tags: ["School"],
  summary: "List all schools with pagination",
  description: "Retrieves paginated school records from the database",
  request: {
    query: listSchoolsQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved paginated schools",
      content: {
        "application/json": {
          schema: listSchoolsSuccessResponse,
        },
      },
    },
  },
});

// ~ ======= Get School By ID Route ======= ~
const getById = createRoute({
  method: "get",
  path: "/{id}",
  operationId: "getSchoolById",
  tags: ["School"],
  summary: "Get school by ID",
  description: "Retrieves a single school record by its UUID",
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved school",
      content: {
        "application/json": {
          schema: getSchoolSuccessResponse,
        },
      },
    },
    404: {
      description: "School not found",
      content: {
        "application/json": {
          schema: notFoundErrorSchema,
        },
      },
    },
  },
});

// ~ ======= Create School Route ======= ~
const create = createRoute({
  method: "post",
  path: "/",
  operationId: "createSchool",
  tags: ["School"],
  summary: "Create school",
  description: "Creates a new school record in the database",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createSchoolRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Successfully created school",
      content: {
        "application/json": {
          schema: createSchoolSuccessResponse,
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

// ~ ======= Update School Route ======= ~
const update = createRoute({
  method: "patch",
  path: "/{id}",
  operationId: "updateSchool",
  tags: ["School"],
  summary: "Update school",
  description: "Updates an existing school record in the database",
  request: {
    params: idParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateSchoolRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully updated school",
      content: {
        "application/json": {
          schema: updateSchoolSuccessResponse,
        },
      },
    },
    404: {
      description: "School not found",
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

// ~ ======= Delete School Route ======= ~
const deleteRoute = createRoute({
  method: "delete",
  path: "/{id}",
  operationId: "deleteSchool",
  tags: ["School"],
  summary: "Delete school",
  description: "Deletes a school record from the database",
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: "Successfully deleted school",
      content: {
        "application/json": {
          schema: deleteSchoolSuccessResponse,
        },
      },
    },
    404: {
      description: "School not found",
      content: {
        "application/json": {
          schema: notFoundErrorSchema,
        },
      },
    },
  },
});

// ~ ======= Export all routes ======= ~
export const schoolRoutes = {
  getAll,
  getById,
  create,
  update,
  delete: deleteRoute,
};
