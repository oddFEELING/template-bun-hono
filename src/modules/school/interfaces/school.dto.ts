import { z } from "@hono/zod-openapi";

/**
 * School base entity schema
 * Core data model for school
 */

// ~ ======= Entity Schema ======= ~
const schoolEntitySchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the school",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    name: z.string().openapi({
      description: "Name of the school",
      example: "School name",
    }),
    createdAt: z.string().datetime().openapi({
      description: "Timestamp when the school was created",
      example: "2024-01-01T00:00:00.000Z",
    }),
    updatedAt: z.string().datetime().openapi({
      description: "Timestamp when the school was last updated",
      example: "2024-01-01T00:00:00.000Z",
    }),
  })
  .openapi("School");

// ~ ======= ID Parameter Schema ======= ~
const idParamSchema = z
  .object({
    id: z.string().uuid().openapi({
      param: {
        name: "id",
        in: "path",
      },
      description: "UUID of the school",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  })
  .openapi("SchoolIdParam");

// ~ ======= TypeScript Types ======= ~
type SchoolEntity = z.infer<typeof schoolEntitySchema>;
type IdParamDTO = z.infer<typeof idParamSchema>;

// ~ ======= Exports ======= ~
export { schoolEntitySchema, idParamSchema };

export type { SchoolEntity, IdParamDTO };
