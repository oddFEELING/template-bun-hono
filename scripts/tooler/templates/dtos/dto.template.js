import { toCamelCase, toPascalCase } from "../../utils/string.js";

/**
 * Generates the base entity DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateDtoTemplate(moduleName) {
	const className = toPascalCase(moduleName);
	const varName = toCamelCase(moduleName);
	return `import { z } from "@hono/zod-openapi";
import { type ${className} } from "../entities/${moduleName}.schema";

/**
 * ${className} base entity schema
 * Core data model for ${moduleName}
 */

// ~ ======= Entity DTO ======= ~
const ${varName}EntityDto = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the ${moduleName}",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    name: z.string().openapi({
      description: "Name of the ${moduleName}",
      example: "${className} name",
    }),
    createdAt: z.coerce.date().openapi({
      description: "Timestamp when the ${moduleName} was created",
      example: "2024-01-01T00:00:00.000Z",
    }),
    updatedAt: z.coerce.date().openapi({
      description: "Timestamp when the ${moduleName} was last updated",
      example: "2024-01-01T00:00:00.000Z",
    }),
  })
  .openapi("${className}") satisfies z.ZodType<${className}>;

// ~ ======= Exports ======= ~
// DTOs are exported for auto-discovery and registered in SchemaRegistry
// Access types via: SchemaRegistryType<"dtoName">
// Note: idParamDto is a shared DTO from @/modules/app/interfaces/app.dto
export { ${varName}EntityDto };
`;
}
