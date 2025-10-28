import { toCamelCase, toPascalCase } from "../../utils/string.js";

/**
 * Generates the create DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateCreateDtoTemplate(moduleName) {
	const className = toPascalCase(moduleName);
	const varName = toCamelCase(moduleName);
	return `import { z } from "@hono/zod-openapi";
import { ${varName}EntityDto } from "./${moduleName}.dto";

/**
 * Create ${className} DTOs
 * Used for POST /${moduleName} endpoint
 */

// ~ ======= Request DTO ======= ~
const create${className}RequestDto = z
  .object({
    name: z.string().min(1, "Name is required").openapi({
      description: "Name of the ${moduleName}",
      example: "${className} name",
    }),
    // Add other required fields here
  })
  .openapi("Create${className}Request");

// ~ ======= Response DTO ======= ~
// Response is the entity DTO with OpenAPI registration for proper documentation
const create${className}ResponseDto = ${varName}EntityDto.openapi("Create${className}Response");

// ~ ======= Exports ======= ~
// DTOs are exported for auto-discovery and registered in SchemaRegistry
// Access types via: SchemaRegistryType<"dtoName">
export { create${className}RequestDto, create${className}ResponseDto };
`;
}
