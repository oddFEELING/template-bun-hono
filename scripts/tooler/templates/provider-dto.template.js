import { toPascalCase } from "../utils/string.js";

/**
 * Generates the provider DTO template file content
 * @param {string} providerName - The name of the provider
 * @returns {string} The DTO template content
 */
export function generateProviderDtoTemplate(providerName) {
  const className = toPascalCase(providerName);
  return `import { z } from "zod";

/**
 * ${className} Provider DTO schemas and types
 * Define interfaces for ${providerName} integration
 */

// ~ ======= Configuration Schema ======= ~
export const ${providerName}ConfigSchema = z.object({
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  // TODO: Add your configuration fields here
});

// ~ ======= Request Schemas ======= ~
export const ${providerName}RequestSchema = z.object({
  action: z.string(),
  // TODO: Add your request fields here
});

// ~ ======= Response Schemas ======= ~
export const ${providerName}ResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  // TODO: Add your response fields here
});

// ~ ======= TypeScript Types ======= ~
export type ${className}Config = z.infer<typeof ${providerName}ConfigSchema>;
export type ${className}Request = z.infer<typeof ${providerName}RequestSchema>;
export type ${className}Response = z.infer<typeof ${providerName}ResponseSchema>;
`;
}
