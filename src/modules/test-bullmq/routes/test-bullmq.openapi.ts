import { createRoute } from "@hono/zod-openapi";
import {
  messageRequestSchema,
  queryParamSchema,
  helloResponseSchema,
  echoResponseSchema,
  queryResponseSchema,
} from "../interfaces/test-bullmq.dto";

/**
 * OpenAPI route definitions for test-bullmq
 */

// ~ ======= GET / - Hello World Route ======= ~
const hello = createRoute({
  method: "get",
  path: "/",
  operationId: "getTestBullmqHello",
  tags: ["TestBullmq"],
  summary: "Get hello world message",
  description: "Returns a simple hello world message from TestBullmq",
  responses: {
    200: {
      description: "Successfully retrieved hello message",
      content: {
        "application/json": {
          schema: helloResponseSchema,
        },
      },
    },
  },
});

// ~ ======= POST / - Echo Message Route ======= ~
const echo = createRoute({
  method: "post",
  path: "/",
  operationId: "postTestBullmqEcho",
  tags: ["TestBullmq"],
  summary: "Echo message",
  description: "Accepts a message and returns it back",
  request: {
    body: {
      content: {
        "application/json": {
          schema: messageRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully echoed message",
      content: {
        "application/json": {
          schema: echoResponseSchema,
        },
      },
    },
  },
});

// ~ ======= GET /query - Query Parameter Route ======= ~
const query = createRoute({
  method: "get",
  path: "/query",
  operationId: "getTestBullmqQuery",
  tags: ["TestBullmq"],
  summary: "Get personalized greeting",
  description: "Returns a greeting with the provided name from query parameter",
  request: {
    query: queryParamSchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved personalized greeting",
      content: {
        "application/json": {
          schema: queryResponseSchema,
        },
      },
    },
  },
});

// ~ ======= Export all routes ======= ~
export const testBullmqRoutes = {
  hello,
  echo,
  query,
};
