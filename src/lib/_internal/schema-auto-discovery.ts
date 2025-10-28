/// <reference types="bun-types" />

import type { OpenAPIHono } from "@hono/zod-openapi";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import type { ZodTypeAny } from "zod";
import type { AppEnv } from "../types";
import { SchemaRegistry } from "./schema-registry";

/**
 * Regex patterns for extracting module and provider information from file paths
 * Defined at module level for better performance
 */
const MODULE_PATH_PATTERN = /modules\/([^/]+)/;
const PROVIDER_PATH_PATTERN = /providers\/([^/]+)/;

/**
 * Schema information structure for tracking discovered schemas
 */
interface DiscoveredSchema {
	schema: ZodTypeAny;
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
	// Compute the src root directory using path utilities
	const srcRoot = resolve(baseDir, "../..");

	// Get relative path from src root
	const relativePath = relative(srcRoot, absolutePath);

	// Normalize and ensure forward slashes
	return `src/${relativePath}`.replace(/\\/g, "/");
}

/**
 * Extracts the OpenAPI schema name by parsing the source file
 * Looks for .openapi("SchemaName") calls in the variable declaration
 * Handles both single-line and multi-line formats
 */
function extractOpenApiNameFromSource(
	variableName: string,
	filePath: string
): string | null {
	try {
		const sourceCode = readFileSync(filePath, "utf-8");

		// Match: const variableName = ...anything....openapi("SchemaName" or 'SchemaName')
		// Supports both:
		//   const schema = z.object({...}).openapi("Name")
		//   const schema = z.object({...}).openapi(\n\t"Name"\n)
		const pattern = new RegExp(
			`const\\s+${variableName}\\s*=\\s*[\\s\\S]*?\\.openapi\\(\\s*["']([^"']+)["']\\s*\\)`,
			"m"
		);

		const match = sourceCode.match(pattern);
		return match ? match[1] : null;
	} catch {
		return null;
	}
}

/**
 * Checks if an export is a valid Zod DTO that should be registered
 */
function isValidZodDto(exportName: string, exportValue: unknown): boolean {
	// Skip TypeScript type exports (these end with 'DTO' in caps or 'Type')
	if (exportName.endsWith("DTO") || exportName.endsWith("Type")) {
		return false;
	}

	// Only process exports that follow the DTO naming convention (ends with 'Dto')
	if (!exportName.endsWith("Dto")) {
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

	// Ensure it's a valid Zod schema with a typeName (stable discriminator)
	const zodSchema = exportValue as ZodTypeAny;
	// biome-ignore lint/suspicious/noExplicitAny: Accessing Zod internal _def structure for schema validation
	const def = zodSchema._def as any;
	return Boolean(def?.typeName || def?.type);
}

/**
 * Schema discovery result with OpenAPI name
 */
interface DiscoveredSchemaWithName extends DiscoveredSchema {
	openApiName: string | null;
}

/**
 * Processes a single DTO file and extracts all valid Zod schemas
 */
async function processModuleFile(
	file: string,
	baseDir: string
): Promise<{
	relativePath: string;
	schemas: Record<string, DiscoveredSchemaWithName>;
}> {
	const schemas: Record<string, DiscoveredSchemaWithName> = {};
	let relativePath = "";

	try {
		// Dynamically import the DTO file
		const module = await import(file);

		// Extract relative file path
		relativePath = toRelativePath(file, baseDir);
		const fileName = relativePath.split("/").pop() || "unknown";

		// Scan all exports for Zod DTOs
		for (const [exportName, exportValue] of Object.entries(module)) {
			if (!isValidZodDto(exportName, exportValue)) {
				continue;
			}

			// Extract OpenAPI name from source file
			const openApiName = extractOpenApiNameFromSource(exportName, file);

			// Store schema with metadata including the OpenAPI name
			schemas[exportName] = {
				schema: exportValue as ZodTypeAny,
				file: fileName,
				location: relativePath,
				openApiName,
			};
		}

		return { relativePath, schemas };
	} catch (err) {
		// Log error for debugging but continue processing other files
		const errorMessage = err instanceof Error ? err.message : String(err);
		// biome-ignore lint/suspicious/noConsole: Error logging for debugging schema discovery issues
		console.error(
			`[Schema Discovery] Failed to process ${relativePath || file}: ${errorMessage}`
		);
		return { relativePath: "", schemas: {} };
	}
}

/**
 * Registers all discovered schemas in both the SchemaRegistry and OpenAPI registry
 */
function registerDiscoveredSchemas(
	allSchemas: Record<string, DiscoveredSchemaWithName>,
	app: OpenAPIHono<AppEnv>
): void {
	for (const [variableName, schemaInfo] of Object.entries(allSchemas)) {
		const schemaModule = extractModuleName(schemaInfo.location);

		// Use the OpenAPI name extracted from source, fallback to variable name
		const openApiName = schemaInfo.openApiName || variableName;

		// 1. Store in central SchemaRegistry with metadata using OpenAPI name
		SchemaRegistry.register(openApiName, schemaInfo.schema, {
			module: schemaModule,
			file: schemaInfo.file,
			location: schemaInfo.location,
		});

		// 2. Register with OpenAPI registry
		// Schemas with .openapi("Name") will use that name automatically
		app.openAPIRegistry.register(openApiName, schemaInfo.schema);
	}
}

/**
 * Automatically discovers and registers all OpenAPI DTOs from DTO files
 * Scans all *.dto.ts files and registers all exported Zod DTOs
 * Uses source code parsing to extract .openapi() names
 *
 * IMPORTANT: All DTOs in DTO files must use .openapi('DtoName') to be properly registered.
 * Example:
 *   const myDto = z.object({ name: z.string() }).openapi('MyDto');
 *
 * DTOs without .openapi() will use their variable names.
 */
export async function autoRegisterSchemas(app: OpenAPIHono<AppEnv>) {
	// Find all DTO files using Bun's glob
	const glob = new Bun.Glob("**/*.dto.ts");
	const baseDir = import.meta.dir;
	const dtoFiles = Array.from(
		glob.scanSync({
			cwd: `${baseDir}/../..`, // src directory (from _internal up two levels)
			absolute: true,
		})
	);

	// Schema discovery happens silently
	// Logging is handled separately via logRegisteredSchemas()

	const allSchemas: Record<string, DiscoveredSchemaWithName> = {};

	// Process each DTO file and collect schemas
	for (const file of dtoFiles) {
		const { schemas } = await processModuleFile(file, baseDir);

		// Merge discovered schemas into allSchemas with duplicate detection
		for (const [schemaName, schemaInfo] of Object.entries(schemas)) {
			// Check for duplicate schema names
			if (allSchemas[schemaName]) {
				const existingLocation = allSchemas[schemaName].location;
				// biome-ignore lint/suspicious/noConsole: Warning about duplicate schema names during discovery
				console.warn(
					`[Schema Discovery] Duplicate schema name detected: "${schemaName}"\n` +
						`  First found at: ${existingLocation}\n` +
						`  Duplicate at:   ${schemaInfo.location}\n` +
						"  Keeping the first occurrence. Consider renaming one of these schemas."
				);
				continue; // Skip overwriting, preserve first-discovered definition
			}
			allSchemas[schemaName] = schemaInfo;
		}
	}

	// Register all discovered schemas
	if (Object.keys(allSchemas).length > 0) {
		registerDiscoveredSchemas(allSchemas, app);
	}
}
