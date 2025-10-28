/**
 * Library exports
 * Framework-level utilities and helpers
 */

export type {
	SchemaIdentifier,
	SchemaRegistryType,
} from "../_generated/schemas";
// Internal infrastructure (re-exported for convenience)
export * from "./_internal/format-validation-error";
export * from "./_internal/get-service";
export * from "./_internal/log-schemas";
export * from "./_internal/log-services";
export * from "./_internal/route-registry";
export * from "./_internal/schema-auto-discovery";
export * from "./_internal/schema-registry";
// Authentication
export * from "./auth";
// Response utilities
export * from "./error-schemas";
// Logging
export * from "./logger";
export * from "./response-helpers";
export * from "./response-schemas";
// Shutdown
export * from "./shutdown";
// Types
export * from "./types";
