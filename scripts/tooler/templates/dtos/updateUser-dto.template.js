import { toCamelCase, toPascalCase } from "../../utils/string.js";

/**
 * Generates the update DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateUpdateUserDtoTemplate(moduleName) {
  const className = toPascalCase(moduleName);
  const varName = toCamelCase(moduleName);
  return `import { z } from "@hono/zod-openapi";
import { ${varName}EntitySchema } from "./${moduleName}.dto";

/**
 * Update ${className} DTO schemas
 * Used for PATCH /${moduleName}/:id endpoint
 */

// ~ ======= Request Schema ======= ~
const update${className}RequestSchema = z
  .object({
    name: z.string().min(1).optional().openapi({
      description: "Name of the ${moduleName}",
      example: "Updated ${moduleName} name",
    }),
    // Add other updatable fields here (all optional)
  })
  .openapi("Update${className}Request");

// ~ ======= Response Schema ======= ~
const update${className}ResponseSchema = ${varName}EntitySchema.openapi(
  "Update${className}Response"
);

// ~ ======= TypeScript Types ======= ~
type Update${className}RequestDTO = z.infer<typeof update${className}RequestSchema>;
type Update${className}ResponseDTO = z.infer<typeof update${className}ResponseSchema>;

// ~ ======= Exports ======= ~
export { update${className}RequestSchema, update${className}ResponseSchema };

export type { Update${className}RequestDTO, Update${className}ResponseDTO };
`;
}
