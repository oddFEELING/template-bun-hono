import { z } from "@hono/zod-openapi";
import { schoolEntitySchema } from "./school.dto";

/**
 * Create School DTO schemas
 * Used for POST /school endpoint
 */

// ~ ======= Request Schema ======= ~
const createSchoolRequestSchema = z
  .object({
    name: z.string().min(1, "Name is required").openapi({
      description: "Name of the school",
      example: "School name",
    }),
    // Add other required fields here
  })
  .openapi("CreateSchoolRequest");

// ~ ======= Response Schema ======= ~
const createSchoolResponseSchema = schoolEntitySchema.openapi(
  "CreateSchoolResponse"
);

// ~ ======= TypeScript Types ======= ~
type CreateSchoolRequestDTO = z.infer<typeof createSchoolRequestSchema>;
type CreateSchoolResponseDTO = z.infer<typeof createSchoolResponseSchema>;

// ~ ======= Exports ======= ~
export { createSchoolRequestSchema, createSchoolResponseSchema };

export type { CreateSchoolRequestDTO, CreateSchoolResponseDTO };
