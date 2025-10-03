import { toCamelCase, toPascalCase } from "../utils/string.js";

/**
 * Generates the DTO interface template file content
 * @param {string} moduleName - The name of the module
 * @returns {string} The DTO template content
 */
export function generateDtoTemplate(moduleName) {
  const className = toPascalCase(moduleName);
  const varName = toCamelCase(moduleName);
  return `import { z } from "zod";

/**
 * ${className} DTO schemas for request/response validation
 */

// ~ ======= ID Parameter Schema ======= ~
export const idParamSchema = z.object({
  id: z.uuid("Invalid UUID format"),
});

// ~ ======= Create ${className} Schema ======= ~
export const create${className}Schema = z.object({
  name: z.string().min(1, "Name is required"),
  // TODO: Add your fields here
});

// ~ ======= Update ${className} Schema ======= ~
export const update${className}Schema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  // TODO: Add your fields here
});

// ~ ======= Query ${className} Schema ======= ~
export const query${className}Schema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
});

// ~ ======= Response Schemas ======= ~
export const ${varName}ResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  // TODO: Add your response fields here
});

export const ${varName}ListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(${varName}ResponseSchema).nullable(),
  status: z.number(),
});

export const ${varName}SingleResponseSchema = z.object({
  success: z.boolean(),
  data: ${varName}ResponseSchema.nullable(),
  status: z.number(),
});

// ~ ======= TypeScript Types ======= ~
export type IdParamDTO = z.infer<typeof idParamSchema>;
export type Create${className}DTO = z.infer<typeof create${className}Schema>;
export type Update${className}DTO = z.infer<typeof update${className}Schema>;
export type Query${className}DTO = z.infer<typeof query${className}Schema>;
`;
}
