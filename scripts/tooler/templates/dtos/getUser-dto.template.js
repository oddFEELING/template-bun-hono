import { toCamelCase, toPascalCase } from "../../utils/string.js";

/**
 * Generates the get single DTO template
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateGetUserDtoTemplate(moduleName) {
	const className = toPascalCase(moduleName);
	const varName = toCamelCase(moduleName);
	return `import { z } from "@hono/zod-openapi";
import { ${varName}EntitySchema } from "./${moduleName}.dto";

/**
 * Get ${className} DTO schemas
 * Used for GET /${moduleName}/:id endpoint
 */

// ~ ======= Response Schema ======= ~
const get${className}ResponseSchema = ${varName}EntitySchema.openapi(
  "Get${className}Response"
);

// ~ ======= TypeScript Types ======= ~
type Get${className}ResponseDTO = z.infer<typeof get${className}ResponseSchema>;

// ~ ======= Exports ======= ~
export { get${className}ResponseSchema };

export type { Get${className}ResponseDTO };
`;
}
