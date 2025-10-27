import { z } from "@hono/zod-openapi";
import { schoolEntitySchema } from "./school.dto";

/**
 * List Schools DTO schemas
 * Used for GET /school endpoint with pagination
 */

// ~ ======= Query Schema ======= ~
const listSchoolsQuerySchema = z
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
  .openapi("ListSchoolsQuery");

// ~ ======= Response Schema ======= ~
const listSchoolsResponseSchema = z
  .object({
    data: z.array(schoolEntitySchema).openapi({
      description: "Array of school records",
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
  .openapi("ListSchoolsResponse");

// ~ ======= TypeScript Types ======= ~
type ListSchoolsQueryDTO = z.infer<typeof listSchoolsQuerySchema>;
type ListSchoolsResponseDTO = z.infer<typeof listSchoolsResponseSchema>;

// ~ ======= Exports ======= ~
export { listSchoolsQuerySchema, listSchoolsResponseSchema };

export type { ListSchoolsQueryDTO, ListSchoolsResponseDTO };
