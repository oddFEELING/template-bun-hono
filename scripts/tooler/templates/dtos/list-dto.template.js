import { toCamelCase, toPascalCase } from "../../utils/string.js";

/**
 * Generates the list DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateListDtoTemplate(moduleName) {
	const className = toPascalCase(moduleName);
	const varName = toCamelCase(moduleName);
	return `import { z } from "@hono/zod-openapi";
import { ${varName}EntityDto } from "./${moduleName}.dto";

/**
 * List ${className}s DTOs
 * Used for GET /${moduleName} endpoint with pagination
 */

// ~ ======= Query DTO ======= ~
const list${className}sQueryDto = z
  .object({
    page: z
      .preprocess(
        (val) => {
          const num = Number(val);
          return Number.isNaN(num) ? 1 : num;
        },
        z.number().int().min(1).default(1)
      )
      .openapi({
        param: {
          name: "page",
          in: "query",
        },
        description: "Page number for pagination",
        example: "1",
      }),
    limit: z
      .preprocess(
        (val) => {
          const num = Number(val);
          return Number.isNaN(num) ? 10 : num;
        },
        z.number().int().min(1).max(100).default(10)
      )
      .openapi({
        param: {
          name: "limit",
          in: "query",
        },
        description: "Number of items per page (max 100)",
        example: "10",
      }),
    // Add other query filters here (search, sort, etc.)
  })
  .openapi("List${className}sQuery");

// ~ ======= Response DTO ======= ~
const list${className}sResponseDto = z
  .object({
    data: z.array(${varName}EntityDto).openapi({
      description: "Array of ${moduleName} records",
    }),
    pagination: z
      .object({
        page: z.number().openapi({
          description: "Current page number",
          example: 1,
        }),
        limit: z.number().openapi({
          description: "Items per page",
          example: 10,
        }),
        total: z.number().openapi({
          description: "Total number of records",
          example: 100,
        }),
        totalPages: z.number().openapi({
          description: "Total number of pages",
          example: 10,
        }),
        hasNext: z.boolean().openapi({
          description: "Whether there is a next page",
          example: true,
        }),
        hasPrev: z.boolean().openapi({
          description: "Whether there is a previous page",
          example: false,
        }),
        nextPage: z.number().nullable().openapi({
          description: "Next page number (null if no next page)",
          example: 2,
        }),
        prevPage: z.number().nullable().openapi({
          description: "Previous page number (null if no previous page)",
          example: null,
        }),
      })
      .openapi({
        description: "Pagination metadata",
      }),
  })
  .openapi("List${className}sResponse");

// ~ ======= Exports ======= ~
// DTOs are exported for auto-discovery and registered in SchemaRegistry
// Access types via: SchemaRegistryType<"dtoName">
export { list${className}sQueryDto, list${className}sResponseDto };
`;
}
