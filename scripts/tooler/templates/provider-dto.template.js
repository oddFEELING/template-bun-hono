import { toCamelCase, toPascalCase } from "../utils/string.js";

/**
 * Generates the provider DTO template file content
 * @param {string} providerName - The name of the provider
 * @returns {string} The DTO template content
 */
export function generateProviderDtoTemplate(providerName) {
	const className = toPascalCase(providerName);
	const varName = toCamelCase(providerName);
	return `import { z } from "@hono/zod-openapi";

/**
 * ${className} Provider DTO schema
 */
const ${varName}Dto = z
  .object({
    // Add your provider configuration fields here
  })
  .openapi("${className}Dto");

// Schema is exported for auto-discovery and registered in SchemaRegistry
// Access type via: SchemaRegistryType<"${className}Dto">
export { ${varName}Dto };
`;
}
