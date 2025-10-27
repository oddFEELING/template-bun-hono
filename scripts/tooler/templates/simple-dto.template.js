import { toPascalCase } from "../utils/string.js";

/**
 * Generates a simple DTO template for basic route endpoints
 * @param {string} routeName - The name of the route
 * @returns {string} The DTO template content
 */
export function generateSimpleDtoTemplate(routeName) {
  const className = toPascalCase(routeName);

  return `import { z } from "@hono/zod-openapi";

/**
 * ${className} DTO schemas for request/response validation
 * Simple schemas for basic route endpoints
 */

// ~ ======= Request Schemas ======= ~

// Schema for POST request body
const messageRequestSchema = z
  .object({
    message: z.string().min(1, "Message is required").openapi({
      description: "Message to echo back",
      example: "Hello from ${className}!",
    }),
  })
  .openapi("${className}MessageRequest");

// Schema for query parameter
const queryParamSchema = z
  .object({
    name: z.string().optional().openapi({
      param: {
        name: "name",
        in: "query",
      },
      description: "Name to include in greeting",
      example: "World",
    }),
  })
  .openapi("${className}QueryParams");

// ~ ======= Response Schemas ======= ~

// Response schema for GET / endpoint
const helloResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Greeting message",
      example: "Hello World from ${className}!",
    }),
  })
  .openapi("${className}HelloResponse");

// Response schema for POST / endpoint
const echoResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Echoed message",
      example: "Hello from ${className}!",
    }),
  })
  .openapi("${className}EchoResponse");

// Response schema for GET /query endpoint
const queryResponseSchema = z
  .object({
    greeting: z.string().openapi({
      description: "Personalized greeting",
      example: "Hello, World! Welcome to ${className}.",
    }),
  })
  .openapi("${className}QueryResponse");

// ~ ======= TypeScript Types ======= ~
type MessageRequestDTO = z.infer<typeof messageRequestSchema>;
type QueryParamDTO = z.infer<typeof queryParamSchema>;
type HelloResponseDTO = z.infer<typeof helloResponseSchema>;
type EchoResponseDTO = z.infer<typeof echoResponseSchema>;
type QueryResponseDTO = z.infer<typeof queryResponseSchema>;

// ~ ======= Exports ======= ~
export {
  messageRequestSchema,
  queryParamSchema,
  helloResponseSchema,
  echoResponseSchema,
  queryResponseSchema,
};

export type {
  MessageRequestDTO,
  QueryParamDTO,
  HelloResponseDTO,
  EchoResponseDTO,
  QueryResponseDTO,
};
`;
}
