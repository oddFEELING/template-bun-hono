import { z } from "@hono/zod-openapi";

/**
 * Delete School DTO schemas
 * Used for DELETE /school/:id endpoint
 */

// ~ ======= Response Schema ======= ~
const deleteSchoolResponseSchema = z
  .object({
    success: z.boolean().openapi({
      description: "Whether the deletion was successful",
      example: true,
    }),
    message: z.string().openapi({
      description: "Confirmation message",
      example: "School deleted successfully",
    }),
  })
  .openapi("DeleteSchoolResponse");

// ~ ======= TypeScript Types ======= ~
type DeleteSchoolResponseDTO = z.infer<typeof deleteSchoolResponseSchema>;

// ~ ======= Exports ======= ~
export { deleteSchoolResponseSchema };

export type { DeleteSchoolResponseDTO };
