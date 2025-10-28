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
 * ${className} Provider DTO schemas and types
 */

// ~ ======= Configuration Schema ======= ~
const ${varName}ConfigSchema = z
  .object({
    apiKey: z.string().optional().openapi({
      description: "API key for ${providerName} service",
    }),
    apiSecret: z.string().optional().openapi({
      description: "API secret for ${providerName} service",
    }),
  })
  .openapi("${className}Config");

// ~ ======= Request Schemas ======= ~
const ${varName}RequestSchema = z
  .object({
    action: z.string().openapi({
      description: "Action to perform with ${providerName}",
    }),
  })
  .openapi("${className}Request");

// ~ ======= Response Schemas ======= ~
const ${varName}ResponseSchema = z
  .object({
    success: z.boolean().openapi({
      description: "Whether the operation was successful",
    }),
    data: z.any().optional().openapi({
      description: "Response data from ${providerName}",
    }),
    error: z.string().optional().openapi({
      description: "Error message if operation failed",
    }),
  })
  .openapi("${className}Response");

// ~ ======= Exports ======= ~
// Schemas are exported for auto-discovery and registered in SchemaRegistry
// Access types via: SchemaRegistryType<"schemaName">
export {
  ${varName}ConfigSchema,
  ${varName}RequestSchema,
  ${varName}ResponseSchema,
};
`;
}
