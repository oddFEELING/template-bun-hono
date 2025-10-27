import { toPascalCase } from "../../utils/string.js";

/**
 * Generates the delete DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateDeleteUserDtoTemplate(moduleName) {
  const className = toPascalCase(moduleName);
  return `import { z } from "@hono/zod-openapi";

/**
 * Delete ${className} DTO schemas
 * Used for DELETE /${moduleName}/:id endpoint
 */

// ~ ======= Response Schema ======= ~
const delete${className}ResponseSchema = z
  .object({
    success: z.boolean().openapi({
      description: "Whether the deletion was successful",
      example: true,
    }),
    message: z.string().openapi({
      description: "Confirmation message",
      example: "${className} deleted successfully",
    }),
  })
  .openapi("Delete${className}Response");

// ~ ======= TypeScript Types ======= ~
type Delete${className}ResponseDTO = z.infer<typeof delete${className}ResponseSchema>;

// ~ ======= Exports ======= ~
export { delete${className}ResponseSchema };

export type { Delete${className}ResponseDTO };
`;
}
