import { z } from "@hono/zod-openapi";
import { schoolEntitySchema } from "./school.dto";

/**
 * Get School DTO schemas
 * Used for GET /school/:id endpoint
 */

// ~ ======= Response Schema ======= ~
const getSchoolResponseSchema = schoolEntitySchema.openapi(
  "GetSchoolResponse"
);

// ~ ======= TypeScript Types ======= ~
type GetSchoolResponseDTO = z.infer<typeof getSchoolResponseSchema>;

// ~ ======= Exports ======= ~
export { getSchoolResponseSchema };

export type { GetSchoolResponseDTO };
