/**
 * Library exports
 * Framework-level utilities and helpers
 */

// Types
export * from "./types";

// Authentication
export * from "./auth";

// Dependency Injection
export * from "./get-service";

// Logging
export * from "./logger";

// Response utilities
export * from "./error-schemas";
export * from "./format-validation-error";
export * from "./response-helpers";
export * from "./response-schemas";

// Routing
export * from "./log-services";
export * from "./route-registry";
export * from "./schema-auto-discovery";
export * from "./log-schemas";
export * from "./schema-registry";

export type {
  SchemaIdentifier,
  SchemaRegistryType,
} from "../_generated/schemas";
