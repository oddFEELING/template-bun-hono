import { z } from "@hono/zod-openapi";

/**
 * TestBullmq DTO schemas for request/response validation
 * Simple schemas for basic route endpoints
 */

// ~ ======= Request Schemas ======= ~

// Schema for POST request body
const messageRequestSchema = z
  .object({
    message: z.string().min(1, "Message is required").openapi({
      description: "Message to echo back",
      example: "Hello from TestBullmq!",
    }),
  })
  .openapi("TestBullmqMessageRequest");

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
  .openapi("TestBullmqQueryParams");

// ~ ======= Response Schemas ======= ~

// Response schema for GET / endpoint
const helloResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Greeting message",
      example: "Hello World from TestBullmq!",
    }),
  })
  .openapi("TestBullmqHelloResponse");

// Response schema for POST / endpoint
const echoResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Echoed message",
      example: "Hello from TestBullmq!",
    }),
  })
  .openapi("TestBullmqEchoResponse");

// Response schema for GET /query endpoint
const queryResponseSchema = z
  .object({
    greeting: z.string().openapi({
      description: "Personalized greeting",
      example: "Hello, World! Welcome to TestBullmq.",
    }),
  })
  .openapi("TestBullmqQueryResponse");

// ~ ======= Exports ======= ~
// Schemas are exported for auto-discovery and registered in SchemaRegistry
// Access types via: SchemaRegistryType<"schemaName">
export {
  messageRequestSchema,
  queryParamSchema,
  helloResponseSchema,
  echoResponseSchema,
  queryResponseSchema,
};
