import { toCamelCase, toPascalCase } from "../../utils/string.js";

/**
 * Generates the get single DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateGetDtoTemplate(moduleName) {
	const className = toPascalCase(moduleName);
	const varName = toCamelCase(moduleName);
	return `import { ${varName}EntityDto } from "./${moduleName}.dto";

/**
 * Get ${className} DTOs
 * Used for GET /${moduleName}/:id endpoint
 */

// ~ ======= Response DTO ======= ~
// Response is the entity DTO with OpenAPI registration for proper documentation
const get${className}ResponseDto = ${varName}EntityDto.openapi("Get${className}Response");

// ~ ======= Exports ======= ~
// DTOs are exported for auto-discovery and registered in SchemaRegistry
// Access types via: SchemaRegistryType<"dtoName">
export { get${className}ResponseDto };
`;
}
