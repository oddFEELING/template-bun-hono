import { toCamelCase, toPascalCase } from "../../utils/string.js";

/**
 * Generates the update DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateUpdateDtoTemplate(moduleName) {
  const className = toPascalCase(moduleName);
  const varName = toCamelCase(moduleName);
  return `import { z } from "@hono/zod-openapi";
import { ${varName}EntityDto } from "./${moduleName}.dto";

/**
 * Update ${className} DTOs
 * Used for PATCH /${moduleName}/:id endpoint
 */

// ~ ======= Request DTO ======= ~
const update${className}RequestDto = ${varName}EntityDto
  .partial()
  .openapi("Update${className}Request");

// ~ ======= Response DTO ======= ~
// Response is the entity DTO with OpenAPI registration for proper documentation
const update${className}ResponseDto = ${varName}EntityDto.openapi("Update${className}Response");

// ~ ======= Exports ======= ~
// DTOs are exported for auto-discovery and registered in SchemaRegistry
// Access types via: SchemaRegistryType<"dtoName">
export { update${className}RequestDto, update${className}ResponseDto };
`;
}
