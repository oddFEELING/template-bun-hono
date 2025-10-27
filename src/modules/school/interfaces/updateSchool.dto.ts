import { z } from "@hono/zod-openapi";
import { schoolEntitySchema } from "./school.dto";

/**
 * Update School DTO schemas
 * Used for PATCH /school/:id endpoint
 */

// ~ ======= Request Schema ======= ~
const updateSchoolRequestSchema = z
  .object({
    name: z.string().min(1).optional().openapi({
      description: "Name of the school",
      example: "Updated school name",
    }),
    // Add other updatable fields here (all optional)
  })
  .openapi("UpdateSchoolRequest");

// ~ ======= Response Schema ======= ~
const updateSchoolResponseSchema = schoolEntitySchema.openapi(
  "UpdateSchoolResponse"
);

// ~ ======= TypeScript Types ======= ~
type UpdateSchoolRequestDTO = z.infer<typeof updateSchoolRequestSchema>;
type UpdateSchoolResponseDTO = z.infer<typeof updateSchoolResponseSchema>;

// ~ ======= Exports ======= ~
export { updateSchoolRequestSchema, updateSchoolResponseSchema };

export type { UpdateSchoolRequestDTO, UpdateSchoolResponseDTO };
