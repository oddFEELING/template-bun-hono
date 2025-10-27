import { toCamelCase, toPascalCase } from "../../utils/string.js";

/**
 * Generates the list DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateListUsersDtoTemplate(moduleName) {
  const className = toPascalCase(moduleName);
  const varName = toCamelCase(moduleName);
  return `import { z } from "@hono/zod-openapi";
import { ${varName}EntitySchema } from "./${moduleName}.dto";

/**
 * List ${className}s DTO schemas
 * Used for GET /${moduleName} endpoint with pagination
 */

// ~ ======= Query Schema ======= ~
const list${className}sQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .default("1")
      .openapi({
        param: {
          name: "page",
          in: "query",
        },
        description: "Page number for pagination",
        example: "1",
      }),
    limit: z
      .string()
      .optional()
      .default("10")
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

// ~ ======= Response Schema ======= ~
const list${className}sResponseSchema = z
  .object({
    data: z.array(${varName}EntitySchema).openapi({
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
      })
      .openapi({
        description: "Pagination metadata",
      }),
  })
  .openapi("List${className}sResponse");

// ~ ======= TypeScript Types ======= ~
type List${className}sQueryDTO = z.infer<typeof list${className}sQuerySchema>;
type List${className}sResponseDTO = z.infer<typeof list${className}sResponseSchema>;

// ~ ======= Exports ======= ~
export { list${className}sQuerySchema, list${className}sResponseSchema };

export type { List${className}sQueryDTO, List${className}sResponseDTO };
`;
}
