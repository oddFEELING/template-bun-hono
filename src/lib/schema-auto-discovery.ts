/// <reference types="bun-types" />

import type { OpenAPIHono } from "@hono/zod-openapi";
import type { ZodType } from "zod";
import { SchemaRegistry } from "./schema-registry";
import type { AppEnv } from "./types";

/**
 * Type alias for any Zod schema type
 */
// biome-ignore lint/suspicious/noExplicitAny: This type intentionally accepts any Zod schema
type AnyZodSchema = ZodType<any, any, any>;

/**
 * Regex patterns for extracting module and provider information from file paths
 * Defined at module level for better performance
 */
const MODULE_PATH_PATTERN = /modules\/([^/]+)/;
const PROVIDER_PATH_PATTERN = /providers\/([^/]+)/;
const LEADING_SLASH_PATTERN = /^\//;

/**
 * Schema information structure for tracking discovered schemas
 */
interface DiscoveredSchema {
	schema: AnyZodSchema;
	file: string;
	location: string;
}

/**
 * Extracts module name from a file path
 * Returns module name, provider name (prefixed with "provider:"), or "unknown"
 */
function extractModuleName(relativePath: string): string {
	const moduleMatch = relativePath.match(MODULE_PATH_PATTERN);
	const providerMatch = relativePath.match(PROVIDER_PATH_PATTERN);

	if (moduleMatch) {
		return moduleMatch[1];
	}

	if (providerMatch) {
		return `provider:${providerMatch[1]}`;
	}

	return "unknown";
}

/**
 * Converts an absolute file path to a relative path from the src directory
 */
function toRelativePath(absolutePath: string, baseDir: string): string {
	return absolutePath
		.replace(`${baseDir}/..`, "src")
		.replace(LEADING_SLASH_PATTERN, "");
}

/**
 * Checks if an export is a valid Zod schema that should be registered
 */
function isValidZodSchema(exportName: string, exportValue: unknown): boolean {
	// Skip TypeScript type exports (these end with 'DTO' or 'Type')
	if (exportName.endsWith("DTO") || exportName.endsWith("Type")) {
		return false;
	}

	// Only process exports that follow the schema naming convention (ends with 'Schema')
	if (!exportName.endsWith("Schema")) {
		return false;
	}

	// Check if it's a Zod schema with _def property
	if (
		!exportValue ||
		typeof exportValue !== "object" ||
		!("_def" in exportValue) ||
		!exportValue._def
	) {
		return false;
	}

	// Ensure it's a valid Zod schema with a type
	const zodSchema = exportValue as AnyZodSchema;
	return Boolean(zodSchema._def.type);
}

/**
 * Processes a single DTO file and extracts all valid Zod schemas
 */
async function processModuleFile(
	file: string,
	baseDir: string
): Promise<{
	relativePath: string;
	schemas: Record<string, DiscoveredSchema>;
}> {
	const schemas: Record<string, DiscoveredSchema> = {};

	try {
		// Dynamically import the DTO file
		const module = await import(file);

		// Extract relative file path
		const relativePath = toRelativePath(file, baseDir);
		const fileName = relativePath.split("/").pop() || "unknown";

		// Scan all exports for Zod schemas
		for (const [exportName, exportValue] of Object.entries(module)) {
			if (!isValidZodSchema(exportName, exportValue)) {
				continue;
			}

			// Store schema with metadata
			schemas[exportName] = {
				schema: exportValue as AnyZodSchema,
				file: fileName,
				location: relativePath,
			};
		}

		return { relativePath, schemas };
	} catch {
		// Silently skip files that fail to process
		return { relativePath: "", schemas: {} };
	}
}

/**
 * Registers all discovered schemas in both the SchemaRegistry and OpenAPI registry
 */
function registerDiscoveredSchemas(
	allSchemas: Record<string, DiscoveredSchema>,
	app: OpenAPIHono<AppEnv>
): void {
	for (const [schemaName, schemaInfo] of Object.entries(allSchemas)) {
		const schemaModule = extractModuleName(schemaInfo.location);

		// 1. Store in central SchemaRegistry with metadata
		SchemaRegistry.register(schemaName, schemaInfo.schema, {
			module: schemaModule,
			file: schemaInfo.file,
			location: schemaInfo.location,
		});

		// 2. Register with OpenAPI for documentation
		app.openAPIRegistry.register(schemaName, schemaInfo.schema);
	}
}

/**
 * Automatically discovers and registers all OpenAPI schemas from DTO files
 * Scans all *.dto.ts files and registers all exported Zod schemas
 * Uses the official registerComponent method from @hono/zod-openapi
 *
 * IMPORTANT: All schemas in DTO files must use .openapi('SchemaName') to be properly registered.
 * Example:
 *   const mySchema = z.object({ name: z.string() }).openapi('MySchema');
 *
 * Schemas without .openapi() will be skipped to avoid empty objects in the OpenAPI spec.
 */
export async function autoRegisterSchemas(app: OpenAPIHono<AppEnv>) {
	// Find all DTO files using Bun's glob
	const glob = new Bun.Glob("**/*.dto.ts");
	const baseDir = import.meta.dir;
	const dtoFiles = Array.from(
		glob.scanSync({
			cwd: `${baseDir}/..`, // src directory
			absolute: true,
		})
	);

	// Schema discovery happens silently
	// Logging is handled separately via logRegisteredSchemas()

	const allSchemas: Record<string, DiscoveredSchema> = {};

	// Process each DTO file and collect schemas
	for (const file of dtoFiles) {
		const { schemas } = await processModuleFile(file, baseDir);

		// Merge discovered schemas into allSchemas
		for (const [schemaName, schemaInfo] of Object.entries(schemas)) {
			allSchemas[schemaName] = schemaInfo;
		}
	}

	// Register all discovered schemas
	if (Object.keys(allSchemas).length > 0) {
		registerDiscoveredSchemas(allSchemas, app);
	}
}
