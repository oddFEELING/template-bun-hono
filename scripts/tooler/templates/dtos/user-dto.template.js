import { toCamelCase, toPascalCase } from "../../utils/string.js";

/**
 * Generates the base entity DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateUserDtoTemplate(moduleName) {
  const className = toPascalCase(moduleName);
  const varName = toCamelCase(moduleName);
  return `import { z } from "@hono/zod-openapi";

/**
 * ${className} base entity schema
 * Core data model for ${moduleName}
 */

// ~ ======= Entity Schema ======= ~
const ${varName}EntitySchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the ${moduleName}",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    name: z.string().openapi({
      description: "Name of the ${moduleName}",
      example: "${className} name",
    }),
    createdAt: z.string().datetime().openapi({
      description: "Timestamp when the ${moduleName} was created",
      example: "2024-01-01T00:00:00.000Z",
    }),
    updatedAt: z.string().datetime().openapi({
      description: "Timestamp when the ${moduleName} was last updated",
      example: "2024-01-01T00:00:00.000Z",
    }),
  })
  .openapi("${className}");

// ~ ======= ID Parameter Schema ======= ~
const idParamSchema = z
  .object({
    id: z.string().uuid().openapi({
      param: {
        name: "id",
        in: "path",
      },
      description: "UUID of the ${moduleName}",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  })
  .openapi("${className}IdParam");

// ~ ======= TypeScript Types ======= ~
type ${className}Entity = z.infer<typeof ${varName}EntitySchema>;
type IdParamDTO = z.infer<typeof idParamSchema>;

// ~ ======= Exports ======= ~
export { ${varName}EntitySchema, idParamSchema };

export type { ${className}Entity, IdParamDTO };
`;
}
