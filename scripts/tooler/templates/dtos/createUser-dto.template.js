import { toCamelCase, toPascalCase } from "../../utils/string.js";

/**
 * Generates the create DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateCreateUserDtoTemplate(moduleName) {
  const className = toPascalCase(moduleName);
  const varName = toCamelCase(moduleName);
  return `import { z } from "@hono/zod-openapi";
import { ${varName}EntitySchema } from "./${moduleName}.dto";

/**
 * Create ${className} DTO schemas
 * Used for POST /${moduleName} endpoint
 */

// ~ ======= Request Schema ======= ~
const create${className}RequestSchema = z
  .object({
    name: z.string().min(1, "Name is required").openapi({
      description: "Name of the ${moduleName}",
      example: "${className} name",
    }),
    // Add other required fields here
  })
  .openapi("Create${className}Request");

// ~ ======= Response Schema ======= ~
const create${className}ResponseSchema = ${varName}EntitySchema.openapi(
  "Create${className}Response"
);

// ~ ======= TypeScript Types ======= ~
type Create${className}RequestDTO = z.infer<typeof create${className}RequestSchema>;
type Create${className}ResponseDTO = z.infer<typeof create${className}ResponseSchema>;

// ~ ======= Exports ======= ~
export { create${className}RequestSchema, create${className}ResponseSchema };

export type { Create${className}RequestDTO, Create${className}ResponseDTO };
`;
}
