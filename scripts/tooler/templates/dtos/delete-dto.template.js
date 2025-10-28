import { toPascalCase } from "../../utils/string.js";

/**
 * Generates the delete DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateDeleteDtoTemplate(moduleName) {
	const className = toPascalCase(moduleName);
	return `import { z } from "@hono/zod-openapi";

/**
 * Delete ${className} DTOs
 * Used for DELETE /${moduleName}/:id endpoint
 */

// ~ ======= Response DTO ======= ~
const delete${className}ResponseDto = z
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

 // ~ ======= Exports ======= ~
export { delete${className}ResponseDto };
`;
}
